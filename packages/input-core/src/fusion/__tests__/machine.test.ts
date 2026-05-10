import { describe, it, expect, vi } from 'vitest';
import { FusionMachine } from '../machine.js';
import { TargetRegistry } from '../../targets.js';
import { DEFAULT_FUSION_CONFIG, type GazeReading } from '../../types.js';

const gaze = (x: number, y: number, confidence = 1, fixated = false, ts = 0): GazeReading => ({
  kind: 'gaze',
  x,
  y,
  confidence,
  fixated,
  ts,
});

describe('FusionMachine — IDLE → HOVERED', () => {
  it('starts IDLE', () => {
    const m = new FusionMachine({ targets: new TargetRegistry(), config: DEFAULT_FUSION_CONFIG });
    expect(m.state).toBe('IDLE');
  });

  it('moves to HOVERED when gaze fixates on a target', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 1, true, 100));
    expect(m.state).toBe('HOVERED');
    expect(m.hoveredTargetId).toBe('a');
  });

  it('ignores low-confidence gaze readings', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 0.3, true, 100));
    expect(m.state).toBe('IDLE');
  });

  it('stays IDLE when fixated outside any target', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(500, 500, 1, true, 100));
    expect(m.state).toBe('IDLE');
  });

  it('emits a state-change event on transition', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const cb = vi.fn();
    m.on('state', cb);
    m.feed(gaze(50, 50, 1, true, 100));
    expect(cb).toHaveBeenCalledWith({ from: 'IDLE', to: 'HOVERED', targetId: 'a' });
  });
});
