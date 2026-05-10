import { describe, it, expect } from 'vitest';
import { TargetRegistry } from '../targets.js';

describe('TargetRegistry', () => {
  it('returns null when no target hits', () => {
    const r = new TargetRegistry();
    expect(r.hit(10, 10)).toBeNull();
  });

  it('returns the target containing the point', () => {
    const r = new TargetRegistry();
    r.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    expect(r.hit(50, 50)?.id).toBe('a');
  });

  it('returns the topmost (last-registered) target on overlap', () => {
    const r = new TargetRegistry();
    r.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    r.register({ id: 'b', rect: { x: 50, y: 50, width: 100, height: 100 } });
    expect(r.hit(60, 60)?.id).toBe('b');
  });

  it('unregister removes a target', () => {
    const r = new TargetRegistry();
    r.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    r.unregister('a');
    expect(r.hit(50, 50)).toBeNull();
  });

  it('register replaces an existing target with the same id', () => {
    const r = new TargetRegistry();
    r.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    r.register({ id: 'a', rect: { x: 200, y: 200, width: 100, height: 100 } });
    expect(r.hit(50, 50)).toBeNull();
    expect(r.hit(250, 250)?.id).toBe('a');
  });
});
