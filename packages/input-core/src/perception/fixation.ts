export interface FixationOptions {
  radiusPx: number;
  dwellMs: number;
}

export class FixationDetector {
  private anchorX = 0;
  private anchorY = 0;
  private anchorTs: number | null = null;

  constructor(private readonly opts: FixationOptions) {}

  update(x: number, y: number, ts: number): boolean {
    if (this.anchorTs === null) {
      this.anchorX = x;
      this.anchorY = y;
      this.anchorTs = ts;
      return false;
    }
    const dx = x - this.anchorX;
    const dy = y - this.anchorY;
    if (Math.hypot(dx, dy) > this.opts.radiusPx) {
      this.anchorX = x;
      this.anchorY = y;
      this.anchorTs = ts;
      return false;
    }
    return ts - this.anchorTs >= this.opts.dwellMs;
  }
}
