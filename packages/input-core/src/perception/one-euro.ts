export interface OneEuroOptions {
  minCutoff: number;
  beta: number;
  dCutoff: number;
}

export class OneEuroFilter {
  private prev: number | null = null;
  private prevDeriv = 0;
  private prevTs = 0;
  constructor(private readonly opts: OneEuroOptions) {}

  filter(value: number, ts: number): number {
    if (this.prev === null) {
      this.prev = value;
      this.prevTs = ts;
      return value;
    }
    const dt = Math.max((ts - this.prevTs) / 1000, 1e-6);
    const deriv = (value - this.prev) / dt;
    const aD = alpha(this.opts.dCutoff, dt);
    const filteredDeriv = aD * deriv + (1 - aD) * this.prevDeriv;
    const cutoff = this.opts.minCutoff + this.opts.beta * Math.abs(filteredDeriv);
    const a = alpha(cutoff, dt);
    const filtered = a * value + (1 - a) * this.prev;
    this.prev = filtered;
    this.prevDeriv = filteredDeriv;
    this.prevTs = ts;
    return filtered;
  }

  reset(): void {
    this.prev = null;
    this.prevDeriv = 0;
    this.prevTs = 0;
  }
}

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}
