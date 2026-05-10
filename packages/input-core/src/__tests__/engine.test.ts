import { describe, it, expect, vi } from 'vitest';
import { createInputEngine } from '../engine.js';
import type { Intent } from '../types.js';

describe('createInputEngine', () => {
  it('exposes targets, machine, config, on/off intent + state', () => {
    const e = createInputEngine();
    expect(e.targets).toBeDefined();
    expect(e.machine.state).toBe('IDLE');
    expect(e.config.hoverDwellMs).toBeGreaterThan(0);
  });

  it('forwards intents emitted by the machine', () => {
    const e = createInputEngine();
    const cb = vi.fn();
    e.onIntent(cb);
    e.targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    e.feed({ kind: 'gaze', x: 50, y: 50, confidence: 1, fixated: true, ts: 0 });
    e.feed({ kind: 'hand', gesture: 'pinch', heldMs: 300, confidence: 1, ts: 300 });
    expect(cb).toHaveBeenCalledTimes(1);
    const arg = cb.mock.calls[0]?.[0] as Intent;
    expect(arg.name).toBe('select');
  });
});
