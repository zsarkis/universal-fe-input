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
  private readonly targets: TargetRegistry;
  private readonly config: FusionConfig;

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
    }
  }

  private onHand(_r: HandReading): void {
    // implemented in later tasks
  }

  private onVoice(_r: VoiceReading): void {
    // implemented in later tasks
  }

  private transition(to: FusionState, targetId?: string): void {
    const from = this.state;
    if (from === to) return;
    this.state = to;
    if (to === 'HOVERED' && targetId) this.hoveredTargetId = targetId;
    if (to === 'IDLE') this.hoveredTargetId = null;
    this.emit('state', { from, to, targetId });
  }
}
