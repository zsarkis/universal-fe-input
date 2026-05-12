import { FilesetResolver, FaceLandmarker, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { TypedEmitter } from '../emitter.js';
import type { GazeReading } from '../types.js';
import { OneEuroFilter } from './one-euro.js';
import { FixationDetector } from './fixation.js';
import type {
  AdapterStatus,
  PerceptionAdapter,
  PerceptionAdapterEvents,
} from './adapter.js';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 362;
const LEFT_EYE_TOP = 159;
const LEFT_EYE_BOTTOM = 145;
const RIGHT_EYE_TOP = 386;
const RIGHT_EYE_BOTTOM = 374;

/** Raw per-frame features extracted from face landmarks + head pose. */
export interface GazeFeatures {
  // Iris position within each eye socket, normalized to roughly [-1, 1].
  lx: number;
  ly: number;
  rx: number;
  ry: number;
  // Head pose: yaw, pitch, roll (radians) and translation (tx,ty,tz in model units).
  yaw: number;
  pitch: number;
  roll: number;
  tx: number;
  ty: number;
  tz: number;
}

/** A single calibration sample: where the user looked, and the features at that moment. */
export interface FaceGazeCalibrationSample {
  screenX: number;
  screenY: number;
  features: GazeFeatures;
}

/** Coefficient vector for one axis. Length = NUM_TERMS. */
type Coefficients = number[];

interface PolyFit {
  x: Coefficients;
  y: Coefficients;
  version: number;
}

const FIT_VERSION = 2;

export interface FaceGazeAdapterOptions {
  oneEuro?: { minCutoff: number; beta: number; dCutoff: number };
  fixation?: { radiusPx: number; dwellMs: number };
}

const DEFAULTS: Required<FaceGazeAdapterOptions> = {
  // Heavier smoothing than before. minCutoff=0.3 = ~3s smoothing window
  // when stationary; beta=0.15 lets quick saccades through.
  oneEuro: { minCutoff: 0.3, beta: 0.15, dCutoff: 1 },
  // dwellMs raised from 100 → 200 to suppress micro-jitter false-positives
  // on HOVERED transitions; 100ms was firing on natural saccadic noise.
  fixation: { radiusPx: 60, dwellMs: 200 },
};

const STORAGE_KEY = 'face-gaze-calibration-v2';

/** Build the polynomial feature vector for regression. Must match between fit and apply. */
function expandFeatures(f: GazeFeatures): number[] {
  // Average per-axis iris position is a more stable estimator than either eye alone.
  const ax = (f.lx + f.rx) / 2;
  const ay = (f.ly + f.ry) / 2;
  return [
    1,
    f.lx, f.rx, f.ly, f.ry,
    f.yaw, f.pitch, f.roll,
    ax * f.yaw, // iris-x compensated by head yaw (the big win for head-movement drift)
    ay * f.pitch, // iris-y compensated by head pitch
    ax * ax,
    ay * ay,
  ];
}
const NUM_TERMS = 12;

export class FaceGazeAdapter
  extends TypedEmitter<PerceptionAdapterEvents>
  implements PerceptionAdapter
{
  status: AdapterStatus = 'idle';
  private landmarker: FaceLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId = 0;
  private readonly fx: OneEuroFilter;
  private readonly fy: OneEuroFilter;
  private readonly fixation: FixationDetector;
  private fit: PolyFit | null = null;
  private latestFeatures: GazeFeatures | null = null;

  constructor(opts: FaceGazeAdapterOptions = {}) {
    super();
    const o = { ...DEFAULTS, ...opts };
    this.fx = new OneEuroFilter(o.oneEuro);
    this.fy = new OneEuroFilter(o.oneEuro);
    this.fixation = new FixationDetector(o.fixation);
    this.loadFit();
  }

  async start(stream: MediaStream): Promise<void> {
    if (this.status !== 'idle') return;
    this.status = 'starting';
    this.emit('status', this.status);
    try {
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      if (typeof document !== 'undefined') {
        this.video = document.createElement('video');
        this.video.srcObject = stream;
        this.video.muted = true;
        this.video.playsInline = true;
        await this.video.play().catch(() => undefined);
        const loop = () => {
          this.tick(performance.now());
          this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
      }
      this.status = 'running';
      this.emit('status', this.status);
    } catch (e) {
      this.status = 'error';
      this.emit('status', this.status);
      this.emit('error', e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.landmarker?.close();
    this.landmarker = null;
    this.video = null;
    this.fx.reset();
    this.fy.reset();
    this.status = 'idle';
    this.emit('status', this.status);
  }

  getFeatures(): GazeFeatures | null {
    return this.latestFeatures;
  }

  setCalibration(samples: FaceGazeCalibrationSample[]): void {
    if (samples.length < NUM_TERMS) {
      this.fit = null;
      return;
    }
    const xs = samples.map((s) => expandFeatures(s.features));
    const yx = samples.map((s) => s.screenX);
    const yy = samples.map((s) => s.screenY);
    this.fit = {
      x: ridgeRegression(xs, yx),
      y: ridgeRegression(xs, yy),
      version: FIT_VERSION,
    };
    this.saveFit();
  }

  clearCalibration(): void {
    this.fit = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  get isCalibrated(): boolean {
    return this.fit !== null;
  }

  _tickForTest(ts: number): void {
    this.tick(ts);
  }

  private tick(ts: number): void {
    if (!this.landmarker) return;
    let result: FaceLandmarkerResult;
    try {
      result = this.video
        ? this.landmarker.detectForVideo(this.video, ts)
        : this.landmarker.detectForVideo({} as HTMLVideoElement, ts);
    } catch {
      return;
    }
    const features = extractFeatures(result);
    if (!features) return;
    this.latestFeatures = features;
    if (!this.fit) return;
    const expanded = expandFeatures(features);
    const x = this.fx.filter(dot(this.fit.x, expanded), ts);
    const y = this.fy.filter(dot(this.fit.y, expanded), ts);
    const fixated = this.fixation.update(x, y, ts);
    const reading: GazeReading = {
      kind: 'gaze',
      x,
      y,
      confidence: 0.95,
      fixated,
      ts,
    };
    this.emit('reading', reading);
  }

  private saveFit(): void {
    try {
      if (this.fit) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.fit));
    } catch {
      // ignore
    }
  }

  private loadFit(): void {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as PolyFit;
      if (parsed.version === FIT_VERSION) this.fit = parsed;
    } catch {
      // ignore
    }
  }
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}

function extractFeatures(result: FaceLandmarkerResult): GazeFeatures | null {
  const lms = result.faceLandmarks?.[0];
  if (!lms || lms.length < 478) return null;

  const li = lms[LEFT_IRIS_CENTER]!;
  const ri = lms[RIGHT_IRIS_CENTER]!;
  const leo = lms[LEFT_EYE_OUTER]!;
  const lei = lms[LEFT_EYE_INNER]!;
  const reo = lms[RIGHT_EYE_OUTER]!;
  const rei = lms[RIGHT_EYE_INNER]!;
  const let_ = lms[LEFT_EYE_TOP]!;
  const leb = lms[LEFT_EYE_BOTTOM]!;
  const rt = lms[RIGHT_EYE_TOP]!;
  const rb = lms[RIGHT_EYE_BOTTOM]!;

  const lWidth = lei.x - leo.x || 1e-6;
  const lHeight = leb.y - let_.y || 1e-6;
  const lx = ((li.x - leo.x) / lWidth) * 2 - 1;
  const ly = ((li.y - let_.y) / lHeight) * 2 - 1;

  const rWidth = rei.x - reo.x || 1e-6;
  const rHeight = rb.y - rt.y || 1e-6;
  const rx = ((ri.x - rei.x) / rWidth) * 2 - 1;
  const ry = ((ri.y - rt.y) / rHeight) * 2 - 1;

  // Head pose from the 4x4 column-major transformation matrix.
  // Default to identity (zero rotation, zero translation) if missing.
  let yaw = 0, pitch = 0, roll = 0, tx = 0, ty = 0, tz = 0;
  const m = result.facialTransformationMatrixes?.[0];
  if (m && m.data && m.data.length >= 16) {
    // mediapipe Matrix is column-major: data[col*rows + row]
    const r00 = m.data[0]!; // r00
    const r10 = m.data[1]!; // r10
    const r20 = m.data[2]!; // r20
    const r21 = m.data[6]!; // r21
    const r22 = m.data[10]!; // r22
    // Translation is the last column
    tx = m.data[12]!;
    ty = m.data[13]!;
    tz = m.data[14]!;
    // Euler angles (YXZ convention; works well near upright)
    pitch = Math.atan2(-r21, r22);
    yaw = Math.asin(Math.max(-1, Math.min(1, r20)));
    roll = Math.atan2(-r10, r00);
  }

  return { lx, ly, rx, ry, yaw, pitch, roll, tx, ty, tz };
}

/**
 * Ridge regression: solve (X^T X + λI) β = X^T y. Ridge is required here because
 * with 9 calibration points and 12 features the unregularized normal equations
 * are underdetermined; ridge stabilizes them and prevents overfit.
 */
function ridgeRegression(X: number[][], y: number[]): number[] {
  const lambda = 0.5;
  const n = X[0]?.length ?? 0;
  const xtx = new Array(n * n).fill(0) as number[];
  const xty = new Array(n).fill(0) as number[];
  for (let s = 0; s < X.length; s++) {
    const row = X[s]!;
    const ys = y[s]!;
    for (let i = 0; i < n; i++) {
      xty[i]! += row[i]! * ys;
      for (let j = 0; j < n; j++) {
        xtx[i * n + j]! += row[i]! * row[j]!;
      }
    }
  }
  // Add λI (skip bias term at index 0 — don't penalize the intercept).
  for (let i = 1; i < n; i++) xtx[i * n + i]! += lambda;
  return solveGaussian(xtx, xty, n);
}

/** Gaussian elimination with partial pivoting on an n×n system. */
function solveGaussian(a: number[], b: number[], n: number): number[] {
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    let maxVal = Math.abs(a[i * n + i]!);
    for (let k = i + 1; k < n; k++) {
      const v = Math.abs(a[k * n + i]!);
      if (v > maxVal) { maxVal = v; maxRow = k; }
    }
    if (maxRow !== i) {
      for (let k = 0; k < n; k++) {
        const tmp = a[i * n + k]!;
        a[i * n + k] = a[maxRow * n + k]!;
        a[maxRow * n + k] = tmp;
      }
      const tmp = b[i]!;
      b[i] = b[maxRow]!;
      b[maxRow] = tmp;
    }
    const pivot = a[i * n + i]!;
    if (Math.abs(pivot) < 1e-12) continue;
    for (let k = i + 1; k < n; k++) {
      const factor = a[k * n + i]! / pivot;
      for (let j = i; j < n; j++) a[k * n + j]! -= factor * a[i * n + j]!;
      b[k]! -= factor * b[i]!;
    }
  }
  const x = new Array(n).fill(0) as number[];
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i]!;
    for (let j = i + 1; j < n; j++) sum -= a[i * n + j]! * x[j]!;
    const pivot = a[i * n + i]!;
    x[i] = Math.abs(pivot) < 1e-12 ? 0 : sum / pivot;
  }
  return x;
}
