export interface VadOptions {
  threshold: number;
  hangoverMs: number;
}

export type VadEvent = 'started' | 'ended' | null;

export class EnergyVad {
  private speaking = false;
  private lastVoiceTs = 0;
  constructor(private readonly opts: VadOptions) {}

  feed(samples: Float32Array, ts: number): { event: VadEvent } {
    let sum = 0;
    for (const s of samples) sum += s * s;
    const rms = samples.length ? Math.sqrt(sum / samples.length) : 0;
    if (rms >= this.opts.threshold) {
      this.lastVoiceTs = ts;
      if (!this.speaking) {
        this.speaking = true;
        return { event: 'started' };
      }
      return { event: null };
    }
    if (this.speaking && ts - this.lastVoiceTs >= this.opts.hangoverMs) {
      this.speaking = false;
      return { event: 'ended' };
    }
    return { event: null };
  }
}
