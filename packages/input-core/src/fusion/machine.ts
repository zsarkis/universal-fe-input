import { TypedEmitter } from '../emitter.js';
import type { TargetRegistry } from '../targets.js';
import type {
  FusionConfig,
  FusionState,
  GazeReading,
  HandReading,
  Intent,
  PerceptionReading,
  VoiceReading,
} from '../types.js';

export type FusionEvents = {
  state: { from: FusionState; to: FusionState; targetId?: string };
  intent: Intent;
};

export interface FusionDeps {
  targets: TargetRegistry;
  config: FusionConfig;
}

export class FusionMachine extends TypedEmitter<FusionEvents> {
  state: FusionState = 'IDLE';
  hoveredTargetId: string | null = null;
  armedTargetId: string | null = null;
  private armedAt: number | null = null;
  private lastTickTs = 0;
  private readonly targets: TargetRegistry;
  private readonly config: FusionConfig;
  private gazeLeftAt: number | null = null;

  constructor(deps: FusionDeps) {
    super();
    this.targets = deps.targets;
    this.config = deps.config;
  }

  feed(reading: PerceptionReading): void {
    if (reading.kind === 'gaze') this.onGaze(reading);
    else if (reading.kind === 'hand') this.onHand(reading);
    else if (reading.kind === 'voice') this.onVoice(reading);
  }

  private onGaze(r: GazeReading): void {
    if (r.confidence < this.config.gazeConfidenceMin) return;
    const target = r.fixated ? this.targets.hit(r.x, r.y) : null;

    if (this.state === 'IDLE' && target) {
      this.transition('HOVERED', target.id);
      this.gazeLeftAt = null;
      return;
    }

    if (this.state === 'HOVERED') {
      if (target && target.id === this.hoveredTargetId) {
        this.gazeLeftAt = null;
      } else {
        if (this.gazeLeftAt === null) this.gazeLeftAt = r.ts;
        else if (r.ts - this.gazeLeftAt >= this.config.gazeAbortLeaveMs) {
          this.transition('IDLE');
          this.gazeLeftAt = null;
        }
      }
    }
  }

  private onHand(r: HandReading): void {
    if (r.gesture === 'open_palm' && this.state !== 'IDLE') {
      this.transition('IDLE');
      return;
    }
    if (
      r.gesture === 'pinch' &&
      r.heldMs >= this.config.commitPinchMs &&
      this.state === 'HOVERED' &&
      this.hoveredTargetId
    ) {
      const targetId = this.hoveredTargetId;
      this.emit('intent', { name: 'select', targetId, ts: r.ts });
      this.transition('IDLE');
    }
  }

  private onVoice(r: VoiceReading): void {
    if (r.phase === 'started') {
      if (this.state === 'HOVERED' && this.hoveredTargetId) {
        this.armedTargetId = this.hoveredTargetId;
        this.armedAt = r.ts;
        this.transition('ARMED');
      } else if (this.state === 'IDLE') {
        this.transition('DICTATING');
        this.armedAt = r.ts;
      }
      return;
    }

    // r.phase === 'transcript'
    if (r.intent === 'cancel') {
      this.armedTargetId = null;
      this.armedAt = null;
      this.transition('IDLE');
      return;
    }

    if (this.state === 'ARMED' && r.intent) {
      const targetId = this.armedTargetId ?? undefined;
      this.emit('intent', { name: r.intent, targetId, ts: r.ts });
      this.armedTargetId = null;
      this.armedAt = null;
      this.transition('IDLE');
      return;
    }

    if (this.state === 'DICTATING' && r.intent) {
      this.emit('intent', { name: r.intent, ts: r.ts });
      this.armedAt = null;
      this.transition('IDLE');
      return;
    }
    // Null intent: leave state unchanged; armTimeout will sweep us to IDLE.
  }

  tick(now: number): void {
    this.lastTickTs = now;
    if ((this.state === 'ARMED' || this.state === 'DICTATING') && this.armedAt !== null) {
      if (now - this.armedAt >= this.config.armTimeoutMs) {
        this.armedTargetId = null;
        this.armedAt = null;
        this.transition('IDLE');
      }
    }
  }

  private transition(to: FusionState, targetId?: string): void {
    const from = this.state;
    if (from === to) return;
    this.state = to;
    if (to === 'HOVERED' && targetId) this.hoveredTargetId = targetId;
    if (to === 'IDLE') {
      this.hoveredTargetId = null;
      this.armedTargetId = null;
      this.armedAt = null;
    }
    this.emit('state', { from, to, targetId });
  }
}
