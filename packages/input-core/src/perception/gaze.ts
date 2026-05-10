import { TypedEmitter } from '../emitter.js';
import type { GazeReading } from '../types.js';
import { OneEuroFilter } from './one-euro.js';
import { FixationDetector } from './fixation.js';
import type {
  AdapterStatus,
  PerceptionAdapter,
  PerceptionAdapterEvents,
} from './adapter.js';

export interface GazeAdapterOptions {
  oneEuro?: { minCutoff: number; beta: number; dCutoff: number };
  fixation?: { radiusPx: number; dwellMs: number };
}

const DEFAULTS: Required<GazeAdapterOptions> = {
  oneEuro: { minCutoff: 1, beta: 0.05, dCutoff: 1 },
  fixation: { radiusPx: 40, dwellMs: 80 },
};

export class GazeAdapter
  extends TypedEmitter<PerceptionAdapterEvents>
  implements PerceptionAdapter
{
  status: AdapterStatus = 'idle';
  private readonly fx: OneEuroFilter;
  private readonly fy: OneEuroFilter;
  private readonly fixation: FixationDetector;
  private wg: typeof import('webgazer').default | null = null;

  constructor(opts: GazeAdapterOptions = {}) {
    super();
    const o = { ...DEFAULTS, ...opts };
    this.fx = new OneEuroFilter(o.oneEuro);
    this.fy = new OneEuroFilter(o.oneEuro);
    this.fixation = new FixationDetector(o.fixation);
  }

  async start(_stream: MediaStream): Promise<void> {
    if (this.status !== 'idle') return;
    this.status = 'starting';
    this.emit('status', this.status);
    try {
      if (!this.wg) {
        this.wg = (await import('webgazer')).default;
      }
      this.wg
        .setRegression('ridge')
        .showVideoPreview(false)
        .showPredictionPoints(false)
        .saveDataAcrossSessions(true)
        .setGazeListener((data: { x: number; y: number } | null, ts: number) => {
          if (!data) return;
          const x = this.fx.filter(data.x, ts);
          const y = this.fy.filter(data.y, ts);
          const fixated = this.fixation.update(x, y, ts);
          const reading: GazeReading = {
            kind: 'gaze',
            x,
            y,
            confidence: 0.9,
            fixated,
            ts,
          };
          this.emit('reading', reading);
        });
      await this.wg.begin();
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
    this.wg?.end();
    this.fx.reset();
    this.fy.reset();
    this.status = 'idle';
    this.emit('status', this.status);
  }
}
