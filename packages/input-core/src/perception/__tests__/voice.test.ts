import { describe, it, expect, vi } from 'vitest';

const { transcribe, pipeline } = vi.hoisted(() => ({
  transcribe: vi.fn(),
  pipeline: vi.fn(),
}));

vi.mock('@xenova/transformers', () => ({
  pipeline,
}));

import { VoiceAdapter } from '../voice.js';

describe('VoiceAdapter', () => {
  it('emits voice "started" on VAD start, "transcript" on VAD end', async () => {
    pipeline.mockResolvedValue(transcribe);
    transcribe.mockResolvedValue({ text: 'open' });
    const a = new VoiceAdapter({ vadThreshold: 0.05, hangoverMs: 100 });
    const readings: unknown[] = [];
    a.on('reading', (r) => readings.push(r));
    await a.startWithSamples();
    a.feedSamples(new Float32Array(160).fill(0.5), 0);
    a.feedSamples(new Float32Array(160).fill(0), 200);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(readings.some((r) => (r as { phase?: string }).phase === 'started')).toBe(true);
    expect(
      readings.some(
        (r) =>
          (r as { phase?: string }).phase === 'transcript' &&
          (r as { intent?: string }).intent === 'open',
      ),
    ).toBe(true);
  });
});
