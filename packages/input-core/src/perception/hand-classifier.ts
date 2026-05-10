import type { Gesture } from '../types.js';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

const PINCH_DISTANCE = 0.06;

export function classifyHand(lm: NormalizedLandmark[]): Gesture {
  if (lm.length < 21) return 'none';
  const thumb = lm[4]!;
  const index = lm[8]!;
  const dist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  if (dist < PINCH_DISTANCE) return 'pinch';

  // open_palm: all four non-thumb fingertips above their MCPs (y smaller because origin top-left)
  const extended = (tip: NormalizedLandmark, mcp: NormalizedLandmark) => tip.y < mcp.y;
  if (
    extended(lm[8]!, lm[5]!) &&
    extended(lm[12]!, lm[9]!) &&
    extended(lm[16]!, lm[13]!) &&
    extended(lm[20]!, lm[17]!)
  ) {
    return 'open_palm';
  }
  return 'none';
}
