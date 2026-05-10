import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { TypedEmitter } from '../emitter.js';
import type { HandReading } from '../types.js';
import { classifyHand } from './hand-classifier.js';
import type {
  AdapterStatus,
  PerceptionAdapter,
  PerceptionAdapterEvents,
} from './adapter.js';

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export interface HandAdapterOptions {
  tickIntervalMs?: number;
}

export class HandAdapter
  extends TypedEmitter<PerceptionAdapterEvents>
  implements PerceptionAdapter
{
  status: AdapterStatus = 'idle';
  private landmarker: Awaited<ReturnType<typeof HandLandmarker.createFromOptions>> | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId = 0;
  private gestureSince: { gesture: string; ts: number } | null = null;
  private readonly tickIntervalMs: number;

  constructor(opts: HandAdapterOptions = {}) {
    super();
    this.tickIntervalMs = opts.tickIntervalMs ?? 50;
  }

  async start(stream: MediaStream): Promise<void> {
    if (this.status !== 'idle') return;
    this.status = 'starting';
    this.emit('status', this.status);
    try {
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      this.landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        numHands: 1,
        runningMode: 'VIDEO',
      });
      if (typeof document !== 'undefined') {
        this.video = document.createElement('video');
        this.video.srcObject = stream;
        this.video.muted = true;
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
    this.status = 'idle';
    this.emit('status', this.status);
  }

  _tickForTest(ts: number): void {
    this.tick(ts);
  }

  private tick(ts: number): void {
    if (!this.landmarker) return;
    const result = this.video
      ? this.landmarker.detectForVideo(this.video, ts)
      : this.landmarker.detectForVideo({} as HTMLVideoElement, ts);
    const lm = result.landmarks?.[0];
    const gesture = lm ? classifyHand(lm as { x: number; y: number; z: number }[]) : 'none';
    if (this.gestureSince?.gesture !== gesture) {
      this.gestureSince = { gesture, ts };
    }
    const heldMs = ts - (this.gestureSince?.ts ?? ts);
    const reading: HandReading = {
      kind: 'hand',
      gesture: gesture as HandReading['gesture'],
      heldMs,
      confidence: 0.9,
      ts,
    };
    this.emit('reading', reading);
  }
}
