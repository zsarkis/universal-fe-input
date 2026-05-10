import { pipeline, env as transformersEnv } from '@xenova/transformers';
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
  vad: EnergyVad;
  private buffer: Float32Array[] = [];
  private readonly modelId: string;
  private audioContext: AudioContext | null = null;

  constructor(opts: VoiceAdapterOptions = {}) {
    super();
    this.modelId = opts.modelId ?? 'Xenova/whisper-tiny.en';
    this.vad = new EnergyVad({
      // 0.01 picks up normal speech at typical mic levels; 0.05 was too high
      // and meant VAD never tripped in dev.
      threshold: opts.vadThreshold ?? 0.01,
      hangoverMs: opts.hangoverMs ?? 600,
    });
  }

  async start(stream: MediaStream): Promise<void> {
    if (this.status !== 'idle') return;
    this.status = 'starting';
    this.emit('status', this.status);
    try {
      // Force transformers.js to fetch from Hugging Face's CDN. Without this,
      // it falls back to local-relative paths that the dev server resolves to
      // index.html (HTML), which then fails JSON.parse.
      transformersEnv.allowLocalModels = false;
      transformersEnv.allowRemoteModels = true;
      transformersEnv.useBrowserCache = false; // avoid sticky bad-cache from prior failed attempts
      const tr = (await pipeline(
        'automatic-speech-recognition',
        this.modelId,
      )) as unknown;
      this.transcriber = tr as Transcriber;
      this.status = 'running';
      this.emit('status', this.status);
      if (typeof window !== 'undefined' && stream) {
        const ac = new AudioContext({ sampleRate: 16000 });
        const src = ac.createMediaStreamSource(stream);
        await ac.audioWorklet.addModule(
          URL.createObjectURL(
            new Blob(
              [
                `class P extends AudioWorkletProcessor {
                   process(inputs) {
                     const ch = inputs[0]?.[0];
                     if (ch) this.port.postMessage(ch.slice());
                     return true;
                   }
                 }
                 registerProcessor('p', P);`,
              ],
              { type: 'application/javascript' },
            ),
          ),
        );
        const node = new AudioWorkletNode(ac, 'p');
        src.connect(node);
        node.port.onmessage = (ev) => {
          this.feedSamples(new Float32Array(ev.data), performance.now());
        };
        this.audioContext = ac;
      }
    } catch (e) {
      this.status = 'error';
      this.emit('status', this.status);
      this.emit('error', e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }

  feedSamples(samples: Float32Array, ts: number): void {
    const ev = this.vad.feed(samples, ts);
    if (ev.event === 'started') {
      // Reset and capture from the start of this utterance only.
      this.buffer = [samples];
      this.emit('reading', { kind: 'voice', phase: 'started', ts });
      return;
    }
    if (ev.event === 'ended') {
      this.buffer.push(samples);
      const audio = concat(this.buffer);
      this.buffer = [];
      void this.transcribe(audio, ts);
      return;
    }
    // Only buffer while we're inside an utterance — discard silence.
    if (this.vad.lastRms >= 0.005 || this.buffer.length > 0) {
      this.buffer.push(samples);
    }
    // Hard cap so we never exceed Whisper's 30s window even if VAD never fires ended.
    const MAX_CHUNKS = 1500; // ~30s at 16kHz / 128 samples per chunk
    if (this.buffer.length > MAX_CHUNKS) this.buffer.shift();
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
    this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;
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
