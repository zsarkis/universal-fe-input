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

// Standard 478-point face mesh model.
// Left iris: 468-472. Right iris: 473-477. Centers (we use index 0 of each).
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;
// Eye corner landmarks for normalizing iris position against the eye socket.
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 362;
// Eye top/bottom for vertical normalization.
const LEFT_EYE_TOP = 159;
const LEFT_EYE_BOTTOM = 145;
const RIGHT_EYE_TOP = 386;
const RIGHT_EYE_BOTTOM = 374;

/** A single calibration sample: where the user looked, and the raw iris features at that moment. */
export interface FaceGazeCalibrationSample {
  screenX: number;
  screenY: number;
  features: { lx: number; ly: number; rx: number; ry: number };
}

interface AffineFit {
  // x = ax*lx + bx*rx + cx*ly + dx*ry + ex
  // y = ay*lx + by*rx + cy*ly + dy*ry + ey
  ax: number; bx: number; cx: number; dx: number; ex: number;
  ay: number; by: number; cy: number; dy: number; ey: number;
}

export interface FaceGazeAdapterOptions {
  oneEuro?: { minCutoff: number; beta: number; dCutoff: number };
  fixation?: { radiusPx: number; dwellMs: number };
}

const DEFAULTS: Required<FaceGazeAdapterOptions> = {
  oneEuro: { minCutoff: 0.8, beta: 0.1, dCutoff: 1 },
  fixation: { radiusPx: 60, dwellMs: 100 },
};

const STORAGE_KEY = 'face-gaze-calibration-v1';

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
  private fit: AffineFit | null = null;
  private latestFeatures: { lx: number; ly: number; rx: number; ry: number } | null = null;

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
        outputFacialTransformationMatrixes: false,
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

  /** Latest iris-relative-to-eye features, cached from the most recent tick. */
  getFeatures(): { lx: number; ly: number; rx: number; ry: number } | null {
    return this.latestFeatures;
  }

  /** Fit an affine transform from collected samples. Need at least 5 distinct points. */
  setCalibration(samples: FaceGazeCalibrationSample[]): void {
    if (samples.length < 5) {
      this.fit = null;
      return;
    }
    this.fit = leastSquaresAffine(samples);
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
    const screen = this.fit ? applyFit(this.fit, features) : null;
    if (!screen) return;
    const x = this.fx.filter(screen.x, ts);
    const y = this.fy.filter(screen.y, ts);
    const fixated = this.fixation.update(x, y, ts);
    const reading: GazeReading = {
      kind: 'gaze',
      x,
      y,
      // MediaPipe doesn't expose a per-frame confidence here either, but
      // the model is dramatically more reliable than WebGazer's regression.
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
      if (raw) this.fit = JSON.parse(raw) as AffineFit;
    } catch {
      // ignore
    }
  }
}

function extractFeatures(
  result: FaceLandmarkerResult,
): { lx: number; ly: number; rx: number; ry: number } | null {
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

  // Normalize iris position to [-1, 1] within each eye socket.
  // Left eye: outer (33) is to the LEFT of inner (133) in mirror view.
  const lWidth = lei.x - leo.x || 1e-6;
  const lHeight = leb.y - let_.y || 1e-6;
  const lx = ((li.x - leo.x) / lWidth) * 2 - 1;
  const ly = ((li.y - let_.y) / lHeight) * 2 - 1;

  const rWidth = rei.x - reo.x || 1e-6;
  const rHeight = rb.y - rt.y || 1e-6;
  // For right eye, the "outer" (263) is to the RIGHT of inner (362), so reverse.
  const rx = ((ri.x - rei.x) / rWidth) * 2 - 1;
  const ry = ((ri.y - rt.y) / rHeight) * 2 - 1;

  return { lx, ly, rx, ry };
}

function applyFit(
  fit: AffineFit,
  f: { lx: number; ly: number; rx: number; ry: number },
): { x: number; y: number } {
  const x = fit.ax * f.lx + fit.bx * f.rx + fit.cx * f.ly + fit.dx * f.ry + fit.ex;
  const y = fit.ay * f.lx + fit.by * f.rx + fit.cy * f.ly + fit.dy * f.ry + fit.ey;
  return { x, y };
}

/**
 * Solve two independent 5-parameter linear regressions (one for x, one for y)
 * using normal equations. With 5+ samples this is well-conditioned in practice.
 */
function leastSquaresAffine(samples: FaceGazeCalibrationSample[]): AffineFit {
  const N = samples.length;
  // Design matrix X is N x 5: [lx, rx, ly, ry, 1]
  // We solve (X^T X) β = X^T y separately for screenX and screenY.
  const xtx = new Array(25).fill(0) as number[];
  const xty_x = new Array(5).fill(0) as number[];
  const xty_y = new Array(5).fill(0) as number[];

  for (const s of samples) {
    const row = [s.features.lx, s.features.rx, s.features.ly, s.features.ry, 1];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        xtx[i * 5 + j]! += row[i]! * row[j]!;
      }
      xty_x[i]! += row[i]! * s.screenX;
      xty_y[i]! += row[i]! * s.screenY;
    }
  }

  const bx = solve5x5(xtx.slice(), xty_x.slice());
  const by = solve5x5(xtx.slice(), xty_y.slice());

  void N;
  return {
    ax: bx[0]!, bx: bx[1]!, cx: bx[2]!, dx: bx[3]!, ex: bx[4]!,
    ay: by[0]!, by: by[1]!, cy: by[2]!, dy: by[3]!, ey: by[4]!,
  };
}

/** Gaussian elimination on a 5x5 system. Mutates the inputs. */
function solve5x5(a: number[], b: number[]): number[] {
  const n = 5;
  for (let i = 0; i < n; i++) {
    // Partial pivoting.
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
    if (Math.abs(pivot) < 1e-12) {
      // Degenerate; return zeros for this row's contribution.
      continue;
    }
    for (let k = i + 1; k < n; k++) {
      const factor = a[k * n + i]! / pivot;
      for (let j = i; j < n; j++) {
        a[k * n + j]! -= factor * a[i * n + j]!;
      }
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
