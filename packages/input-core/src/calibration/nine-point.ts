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
