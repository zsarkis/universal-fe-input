export interface NinePointOptions {
  width: number;
  height: number;
  marginPct: number;
}

export interface Point {
  x: number;
  y: number;
}

export function ninePointTargets(opts: NinePointOptions): Point[] {
  const mx = (opts.marginPct / 100) * opts.width;
  const my = (opts.marginPct / 100) * opts.height;
  const xs = [mx, opts.width / 2, opts.width - mx];
  const ys = [my, opts.height / 2, opts.height - my];
  const out: Point[] = [];
  for (const y of ys) for (const x of xs) out.push({ x, y });
  return out;
}

/**
 * Extended calibration grid: the standard 9-point grid plus 4 mid-edge
 * points. The mid-edge points improve the polynomial fit near the screen
 * edges, which is where iris-only gaze regressors tend to be weakest.
 */
export function extendedCalibrationTargets(opts: NinePointOptions): Point[] {
  const mx = (opts.marginPct / 100) * opts.width;
  const my = (opts.marginPct / 100) * opts.height;
  const cx = opts.width / 2;
  const cy = opts.height / 2;
  // Mid-edge points sit halfway between the corner and the center.
  const lx = (mx + cx) / 2;
  const rx = (opts.width - mx + cx) / 2;
  const ty = (my + cy) / 2;
  const by = (opts.height - my + cy) / 2;
  return [
    ...ninePointTargets(opts),
    { x: lx, y: ty }, // upper-left-mid
    { x: rx, y: ty }, // upper-right-mid
    { x: lx, y: by }, // lower-left-mid
    { x: rx, y: by }, // lower-right-mid
  ];
}
