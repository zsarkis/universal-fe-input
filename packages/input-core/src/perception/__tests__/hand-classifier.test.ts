import { describe, it, expect } from 'vitest';
import { classifyHand } from '../hand-classifier.js';

const point = (x: number, y: number, z = 0) => ({ x, y, z });

describe('classifyHand', () => {
  it('returns "none" for no landmarks', () => {
    expect(classifyHand([])).toBe('none');
  });

  it('returns "pinch" when thumb and index tips are close', () => {
    const lm = Array.from({ length: 21 }, () => point(0.5, 0.5));
    lm[4] = point(0.50, 0.50);
    lm[8] = point(0.51, 0.51);
    expect(classifyHand(lm)).toBe('pinch');
  });

  it('returns "open_palm" when all four non-thumb fingers are extended', () => {
    const lm = Array.from({ length: 21 }, () => point(0.5, 0.5));
    // thumb tip far from index tip → not pinch
    lm[4] = point(0.2, 0.5);
    lm[8] = point(0.5, 0.2); // index tip above mcp
    lm[5] = point(0.5, 0.4);
    lm[12] = point(0.55, 0.2);
    lm[9] = point(0.55, 0.4);
    lm[16] = point(0.6, 0.2);
    lm[13] = point(0.6, 0.4);
    lm[20] = point(0.65, 0.2);
    lm[17] = point(0.65, 0.4);
    expect(classifyHand(lm)).toBe('open_palm');
  });

  it('returns "none" otherwise', () => {
    const lm = Array.from({ length: 21 }, () => point(0.5, 0.5));
    lm[4] = point(0.2, 0.5);
    lm[8] = point(0.4, 0.5);
    expect(classifyHand(lm)).toBe('none');
  });
});
