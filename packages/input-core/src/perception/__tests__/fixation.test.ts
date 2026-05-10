import { describe, it, expect } from 'vitest';
import { FixationDetector } from '../fixation.js';

describe('FixationDetector', () => {
  it('reports false until a sample stays within radius for dwell window', () => {
    const f = new FixationDetector({ radiusPx: 30, dwellMs: 100 });
    expect(f.update(0, 0, 0)).toBe(false);
    expect(f.update(5, 5, 50)).toBe(false);
    expect(f.update(5, 5, 110)).toBe(true);
  });

  it('resets when sample leaves radius', () => {
    const f = new FixationDetector({ radiusPx: 30, dwellMs: 100 });
    f.update(0, 0, 0);
    f.update(0, 0, 100);
    expect(f.update(200, 200, 110)).toBe(false);
    expect(f.update(200, 200, 200)).toBe(false);
    expect(f.update(200, 200, 220)).toBe(true);
  });
});
