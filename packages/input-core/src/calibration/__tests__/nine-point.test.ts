import { describe, it, expect } from 'vitest';
import { ninePointTargets } from '../nine-point.js';

describe('ninePointTargets', () => {
  it('returns 9 points spread across the viewport', () => {
    const pts = ninePointTargets({ width: 1000, height: 800, marginPct: 10 });
    expect(pts.length).toBe(9);
    expect(pts[0]).toEqual({ x: 100, y: 80 });
    expect(pts[4]).toEqual({ x: 500, y: 400 });
    expect(pts[8]).toEqual({ x: 900, y: 720 });
  });
});
