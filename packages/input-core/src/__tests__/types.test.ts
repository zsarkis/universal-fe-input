import { describe, it, expectTypeOf } from 'vitest';
import type {
  GazeReading,
  HandReading,
  VoiceReading,
  Gesture,
  IntentName,
  PerceptionReading,
} from '../types.js';

describe('types', () => {
  it('gaze reading shape', () => {
    const r: GazeReading = { kind: 'gaze', x: 0, y: 0, confidence: 1, fixated: true, ts: 0 };
    expectTypeOf(r.kind).toEqualTypeOf<'gaze'>();
  });
  it('hand reading shape', () => {
    const r: HandReading = { kind: 'hand', gesture: 'pinch', heldMs: 0, confidence: 1, ts: 0 };
    expectTypeOf<Gesture>().toEqualTypeOf<'pinch' | 'open_palm' | 'none'>();
  });
  it('voice reading shape (transcript form)', () => {
    const r: VoiceReading = {
      kind: 'voice',
      phase: 'transcript',
      transcript: 'open',
      intent: 'open',
      confidence: 0.9,
      ts: 0,
    };
    expectTypeOf<IntentName>().toMatchTypeOf<'open' | 'cancel' | 'scroll_down'>();
  });
  it('voice reading shape (speech-started form)', () => {
    const r: VoiceReading = { kind: 'voice', phase: 'started', ts: 0 };
    expectTypeOf(r.phase).toEqualTypeOf<'started' | 'transcript'>();
  });
  it('PerceptionReading is the discriminated union', () => {
    const r: PerceptionReading = { kind: 'gaze', x: 0, y: 0, confidence: 1, fixated: true, ts: 0 };
    expectTypeOf<PerceptionReading['kind']>().toEqualTypeOf<'gaze' | 'hand' | 'voice'>();
  });
});
