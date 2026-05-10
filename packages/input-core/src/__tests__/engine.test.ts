import { describe, it, expect, vi } from 'vitest';
import { createInputEngine } from '../engine.js';
import type { Intent } from '../types.js';
import type { GazeReading } from '../types.js';

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

describe('createInputEngine — lastGaze', () => {
  it('captures the most recent gaze reading', () => {
    const e = createInputEngine();
    expect(e.lastGaze).toBeNull();
    const r1: GazeReading = { kind: 'gaze', x: 10, y: 10, confidence: 1, fixated: true, ts: 0 };
    e.feed(r1);
    expect(e.lastGaze).toBe(r1);
    const r2: GazeReading = { kind: 'gaze', x: 20, y: 20, confidence: 1, fixated: true, ts: 100 };
    e.feed(r2);
    expect(e.lastGaze).toBe(r2);
  });

  it('non-gaze readings do not overwrite lastGaze', () => {
    const e = createInputEngine();
    const g: GazeReading = { kind: 'gaze', x: 10, y: 10, confidence: 1, fixated: true, ts: 0 };
    e.feed(g);
    e.feed({ kind: 'hand', gesture: 'pinch', heldMs: 0, confidence: 1, ts: 100 });
    expect(e.lastGaze).toBe(g);
  });
});
