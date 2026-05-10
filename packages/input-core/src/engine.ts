import { TargetRegistry } from './targets.js';
import { FusionMachine, type FusionEvents } from './fusion/machine.js';
import {
  DEFAULT_FUSION_CONFIG,
  type FusionConfig,
  type GazeReading,
  type Intent,
  type PerceptionReading,
} from './types.js';

export interface InputEngine {
  targets: TargetRegistry;
  machine: FusionMachine;
  config: FusionConfig;
  readonly lastGaze: GazeReading | null;
  feed(reading: PerceptionReading): void;
  tick(now: number): void;
  onIntent(cb: (i: Intent) => void): () => void;
  onState(cb: (e: FusionEvents['state']) => void): () => void;
  setCalibrating(on: boolean): void;
}

export function createInputEngine(config: FusionConfig = DEFAULT_FUSION_CONFIG): InputEngine {
  const targets = new TargetRegistry();
  const machine = new FusionMachine({ targets, config });
  let lastGaze: GazeReading | null = null;
  return {
    targets,
    machine,
    config,
    get lastGaze() {
      return lastGaze;
    },
    feed: (r) => {
      if (r.kind === 'gaze') lastGaze = r;
      machine.feed(r);
    },
    tick: (now) => machine.tick(now),
    onIntent: (cb) => machine.on('intent', cb),
    onState: (cb) => machine.on('state', cb),
    setCalibrating: (on) => machine.setCalibrating(on),
  };
}
