import { describe, it, expect } from 'vitest';
import { EnergyVad } from '../vad.js';

describe('EnergyVad', () => {
  it('reports speech-start when energy crosses threshold', () => {
    const v = new EnergyVad({ threshold: 0.05, hangoverMs: 100 });
    expect(v.feed(new Float32Array([0, 0, 0]), 0)).toEqual({ event: null });
    const loud = new Float32Array(160).fill(0.5);
    expect(v.feed(loud, 16)).toEqual({ event: 'started' });
  });

  it('reports speech-end after hangover', () => {
    const v = new EnergyVad({ threshold: 0.05, hangoverMs: 100 });
    v.feed(new Float32Array(160).fill(0.5), 0);
    expect(v.feed(new Float32Array(160).fill(0), 50).event).toBeNull();
    expect(v.feed(new Float32Array(160).fill(0), 200).event).toBe('ended');
  });
});
