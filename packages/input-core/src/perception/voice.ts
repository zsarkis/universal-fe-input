import { pipeline } from '@xenova/transformers';
import { TypedEmitter } from '../emitter.js';
import type { VoiceReading } from '../types.js';
import { resolveIntent } from '../intents/grammar.js';
import { EnergyVad } from './vad.js';
import type {
  AdapterStatus,
  PerceptionAdapter,
  PerceptionAdapterEvents,
} from './adapter.js';

export interface VoiceAdapterOptions {
  modelId?: string;
  vadThreshold?: number;
  hangoverMs?: number;
}

type Transcriber = (audio: Float32Array) => Promise<{ text: string }>;

export class VoiceAdapter
  extends TypedEmitter<PerceptionAdapterEvents>
  implements PerceptionAdapter
{
  status: AdapterStatus = 'idle';
  private transcriber: Transcriber | null = null;
  private vad: EnergyVad;
  private buffer: Float32Array[] = [];
  private readonly modelId: string;

  constructor(opts: VoiceAdapterOptions = {}) {
    super();
    this.modelId = opts.modelId ?? 'Xenova/whisper-tiny.en';
    this.vad = new EnergyVad({
      threshold: opts.vadThreshold ?? 0.05,
      hangoverMs: opts.hangoverMs ?? 600,
    });
  }

  async start(_stream: MediaStream): Promise<void> {
    this.status = 'starting';
    this.emit('status', this.status);
    try {
      const tr = (await pipeline(
        'automatic-speech-recognition',
        this.modelId,
      )) as unknown;
      this.transcriber = tr as Transcriber;
      this.status = 'running';
      this.emit('status', this.status);
    } catch (e) {
      this.status = 'error';
      this.emit('status', this.status);
      this.emit('error', e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }

  // Test-only entrypoint that skips MediaStream wiring
  async startWithSamples(): Promise<void> {
    return this.start(undefined as unknown as MediaStream);
  }

  feedSamples(samples: Float32Array, ts: number): void {
    const ev = this.vad.feed(samples, ts);
    this.buffer.push(samples);
    if (ev.event === 'started') {
      this.emit('reading', { kind: 'voice', phase: 'started', ts });
    } else if (ev.event === 'ended') {
      const audio = concat(this.buffer);
      this.buffer = [];
      void this.transcribe(audio, ts);
    }
  }

  private async transcribe(audio: Float32Array, ts: number): Promise<void> {
    if (!this.transcriber) return;
    try {
      const out = await this.transcriber(audio);
      const intent = resolveIntent(out.text);
      const reading: VoiceReading = {
        kind: 'voice',
        phase: 'transcript',
        transcript: out.text,
        intent: intent?.name ?? null,
        confidence: intent?.confidence ?? 0,
        ts,
      };
      this.emit('reading', reading);
    } catch (e) {
      this.emit('error', e instanceof Error ? e : new Error(String(e)));
    }
  }

  stop(): void {
    this.transcriber = null;
    this.buffer = [];
    this.status = 'idle';
    this.emit('status', this.status);
  }
}

function concat(parts: Float32Array[]): Float32Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Float32Array(total);
  let i = 0;
  for (const p of parts) {
    out.set(p, i);
    i += p.length;
  }
  return out;
}
