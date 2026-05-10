import { describe, it, expect } from 'vitest';
import { OneEuroFilter } from '../one-euro.js';

describe('OneEuroFilter', () => {
  it('returns the first sample unchanged', () => {
    const f = new OneEuroFilter({ minCutoff: 1, beta: 0, dCutoff: 1 });
    expect(f.filter(10, 0)).toBe(10);
  });

  it('low-passes step input toward target over time', () => {
    const f = new OneEuroFilter({ minCutoff: 1, beta: 0, dCutoff: 1 });
    f.filter(0, 0);
    const a = f.filter(100, 16);
    const b = f.filter(100, 32);
    const c = f.filter(100, 48);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(100);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c).toBeLessThanOrEqual(100);
  });

  it('reset returns the filter to first-sample behavior', () => {
    const f = new OneEuroFilter({ minCutoff: 1, beta: 0, dCutoff: 1 });
    f.filter(0, 0);
    f.filter(100, 16);
    f.reset();
    expect(f.filter(50, 100)).toBe(50);
  });
});
