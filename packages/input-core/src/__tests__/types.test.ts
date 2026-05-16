import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  DEFAULT_FUSION_CONFIG,
  type GazeReading,
  type HandReading,
  type VoiceReading,
  type Gesture,
  type IntentName,
  type PerceptionReading,
  type Intent,
  type FusionConfig,
  type FusionState,
  type Target,
} from '../index.js';

describe('types', () => {
  it('DEFAULT_FUSION_CONFIG ships with the expected defaults', () => {
    const cfg: FusionConfig = DEFAULT_FUSION_CONFIG;
    expect(cfg.hoverDwellMs).toBe(80);
    expect(cfg.armTimeoutMs).toBe(800);
    expect(cfg.commitPinchMs).toBe(250);
    expect(cfg.gazeConfidenceMin).toBe(0.6);
    expect(cfg.gazeAbortLeaveMs).toBe(150);
  });

  it('Gesture is the closed three-member set', () => {
    expectTypeOf<Gesture>().toEqualTypeOf<'pinch' | 'open_palm' | 'none'>();
  });

  it('IntentName covers the documented intents', () => {
    type Expected =
      | 'open' | 'select' | 'close' | 'back'
      | 'scroll_down' | 'scroll_up' | 'top' | 'bottom'
      | 'next' | 'previous' | 'next_paragraph' | 'previous_paragraph'
      | 'bookmark'
      | 'summarize' | 'read_aloud' | 'stop_reading'
      | 'calibrate' | 'cancel' | 'help';
    expectTypeOf<IntentName>().toEqualTypeOf<Expected>();
  });

  it('FusionState covers the five engine states', () => {
    expectTypeOf<FusionState>().toEqualTypeOf<
      'IDLE' | 'HOVERED' | 'ARMED' | 'DICTATING' | 'CALIBRATING'
    >();
  });

  it('GazeReading shape', () => {
    const r: GazeReading = { kind: 'gaze', x: 0, y: 0, confidence: 1, fixated: true, ts: 0 };
    expectTypeOf(r).toMatchTypeOf<{ kind: 'gaze' }>();
    expect(r.kind).toBe('gaze');
  });

  it('HandReading shape', () => {
    const r: HandReading = { kind: 'hand', gesture: 'pinch', heldMs: 0, confidence: 1, ts: 0 };
    expectTypeOf(r).toMatchTypeOf<{ kind: 'hand'; gesture: Gesture }>();
    expect(r.gesture).toBe('pinch');
  });

  it('VoiceReading is a discriminated union over phase', () => {
    const started: VoiceReading = { kind: 'voice', phase: 'started', ts: 0 };
    const transcript: VoiceReading = {
      kind: 'voice',
      phase: 'transcript',
      transcript: 'open',
      intent: 'open',
      confidence: 0.9,
      ts: 0,
    };
    expect(started.phase).toBe('started');
    expect(transcript.phase).toBe('transcript');
    if (transcript.phase === 'transcript') {
      // narrowing should expose the transcript-only fields
      expectTypeOf(transcript.transcript).toEqualTypeOf<string>();
      expectTypeOf(transcript.intent).toEqualTypeOf<IntentName | null>();
    }
  });

  it('PerceptionReading is the discriminated union of gaze, hand, voice', () => {
    expectTypeOf<PerceptionReading['kind']>().toEqualTypeOf<'gaze' | 'hand' | 'voice'>();
  });

  it('Intent has a required name and ts, optional targetId and meta', () => {
    const i: Intent = { name: 'open', ts: 0 };
    expect(i.name).toBe('open');
    const i2: Intent = { name: 'select', targetId: 'a', ts: 0, meta: { foo: 'bar' } };
    expect(i2.targetId).toBe('a');
  });

  it('Target rect shape', () => {
    const t: Target = { id: 'a', rect: { x: 0, y: 0, width: 10, height: 10 } };
    expect(t.rect.width).toBe(10);
  });
});
