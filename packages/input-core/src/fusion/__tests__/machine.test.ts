import { describe, it, expect, vi } from 'vitest';
import { FusionMachine } from '../machine.js';
import { TargetRegistry } from '../../targets.js';
import { DEFAULT_FUSION_CONFIG, type GazeReading } from '../../types.js';

const gaze = (x: number, y: number, confidence = 1, fixated = false, ts = 0): GazeReading => ({
  kind: 'gaze',
  x,
  y,
  confidence,
  fixated,
  ts,
});

describe('FusionMachine — IDLE → HOVERED', () => {
  it('starts IDLE', () => {
    const m = new FusionMachine({ targets: new TargetRegistry(), config: DEFAULT_FUSION_CONFIG });
    expect(m.state).toBe('IDLE');
  });

  it('moves to HOVERED when gaze fixates on a target', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 1, true, 100));
    expect(m.state).toBe('HOVERED');
    expect(m.hoveredTargetId).toBe('a');
  });

  it('ignores low-confidence gaze readings', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 0.3, true, 100));
    expect(m.state).toBe('IDLE');
  });

  it('stays IDLE when fixated outside any target', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(500, 500, 1, true, 100));
    expect(m.state).toBe('IDLE');
  });

  it('emits a state-change event on transition', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const cb = vi.fn();
    m.on('state', cb);
    m.feed(gaze(50, 50, 1, true, 100));
    expect(cb).toHaveBeenCalledWith({ from: 'IDLE', to: 'HOVERED', targetId: 'a' });
  });
});

describe('FusionMachine — HOVERED abort on gaze leave', () => {
  it('returns to IDLE when gaze leaves the target for longer than gazeAbortLeaveMs', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, gazeAbortLeaveMs: 100 };
    const m = new FusionMachine({ targets, config });

    m.feed(gaze(50, 50, 1, true, 0));
    expect(m.state).toBe('HOVERED');

    m.feed(gaze(500, 500, 1, true, 50));
    expect(m.state).toBe('HOVERED'); // grace window not yet elapsed

    m.feed(gaze(500, 500, 1, true, 200));
    expect(m.state).toBe('IDLE');
  });

  it('does not abort if gaze returns to the target within the grace window', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, gazeAbortLeaveMs: 100 };
    const m = new FusionMachine({ targets, config });

    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(gaze(500, 500, 1, true, 50));
    m.feed(gaze(60, 60, 1, true, 80));
    expect(m.state).toBe('HOVERED');
  });
});

import type { HandReading } from '../../types.js';

const hand = (gesture: HandReading['gesture'], heldMs: number, ts: number, confidence = 1): HandReading => ({
  kind: 'hand',
  gesture,
  heldMs,
  confidence,
  ts,
});

describe('FusionMachine — single-signal pinch commit', () => {
  it('commits to "select" when pinch held > commitPinchMs while HOVERED', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, commitPinchMs: 250 };
    const m = new FusionMachine({ targets, config });
    const intents: Array<{ name: string; targetId?: string }> = [];
    m.on('intent', (i) => intents.push({ name: i.name, targetId: i.targetId }));

    m.feed(gaze(50, 50, 1, true, 0));
    expect(m.state).toBe('HOVERED');

    m.feed(hand('pinch', 300, 300));
    expect(m.state).toBe('IDLE');
    expect(intents).toEqual([{ name: 'select', targetId: 'a' }]);
  });

  it('does not commit on a brief pinch (< commitPinchMs)', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, commitPinchMs: 250 };
    const m = new FusionMachine({ targets, config });
    const intents: Array<unknown> = [];
    m.on('intent', (i) => intents.push(i));

    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(hand('pinch', 100, 100));
    expect(m.state).toBe('HOVERED');
    expect(intents).toEqual([]);
  });

  it('does not commit on pinch when IDLE (no hovered target)', () => {
    const targets = new TargetRegistry();
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const intents: Array<unknown> = [];
    m.on('intent', (i) => intents.push(i));
    m.feed(hand('pinch', 500, 500));
    expect(m.state).toBe('IDLE');
    expect(intents).toEqual([]);
  });
});

import type { Intent, IntentName, VoiceReading } from '../../types.js';

const voiceStart = (ts: number): VoiceReading => ({ kind: 'voice', phase: 'started', ts });
const voiceTranscript = (
  intent: IntentName | null,
  ts: number,
  transcript = String(intent),
): VoiceReading => ({
  kind: 'voice',
  phase: 'transcript',
  transcript,
  intent,
  confidence: 0.9,
  ts,
});

describe('FusionMachine — two-signal voice path', () => {
  it('HOVERED + voice "started" → ARMED, then transcript "open" → COMMITTED with target', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const intents: Intent[] = [];
    m.on('intent', (i) => intents.push(i));

    m.feed(gaze(50, 50, 1, true, 0));
    expect(m.state).toBe('HOVERED');

    m.feed(voiceStart(50));
    expect(m.state).toBe('ARMED');
    expect(m.armedTargetId).toBe('a'); // pre-resolved from current hover

    m.feed(voiceTranscript('open', 200));
    expect(m.state).toBe('IDLE');
    expect(intents).toEqual([
      expect.objectContaining({ name: 'open', targetId: 'a' }),
    ]);
  });

  it('ARMED times out and aborts after armTimeoutMs', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, armTimeoutMs: 200 };
    const m = new FusionMachine({ targets, config });
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(voiceStart(0));
    expect(m.state).toBe('ARMED');
    m.tick(250);
    expect(m.state).toBe('IDLE');
  });

  it('voice transcript with null intent leaves ARMED and eventually times out', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, armTimeoutMs: 200 };
    const m = new FusionMachine({ targets, config });
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(voiceStart(0));
    m.feed(voiceTranscript(null, 50, 'blueberry'));
    expect(m.state).toBe('ARMED');
    m.tick(300);
    expect(m.state).toBe('IDLE');
  });

  it('voice transcript "cancel" while ARMED aborts', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(voiceStart(0));
    m.feed(voiceTranscript('cancel', 50));
    expect(m.state).toBe('IDLE');
  });
});

describe('FusionMachine — abort signals', () => {
  it('open_palm aborts ARMED', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(voiceStart(0));
    expect(m.state).toBe('ARMED');
    m.feed(hand('open_palm', 0, 50));
    expect(m.state).toBe('IDLE');
  });
});

describe('FusionMachine — DICTATING (voice-only)', () => {
  it('IDLE + voice started → DICTATING + scroll_down transcript → emits scroll_down', () => {
    const targets = new TargetRegistry();
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const intents: Intent[] = [];
    m.on('intent', (i) => intents.push(i));
    m.feed(voiceStart(0));
    expect(m.state).toBe('DICTATING');
    m.feed(voiceTranscript('scroll_down', 100));
    expect(m.state).toBe('IDLE');
    expect(intents).toEqual([expect.objectContaining({ name: 'scroll_down' })]);
    expect(intents[0]?.targetId).toBeUndefined();
  });
});

describe('FusionMachine — CALIBRATING', () => {
  it('setCalibrating(true) freezes the state and suppresses intents', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const intents: Intent[] = [];
    m.on('intent', (i) => intents.push(i));
    m.setCalibrating(true);
    expect(m.state).toBe('CALIBRATING');
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(hand('pinch', 500, 100));
    m.feed(voiceStart(0));
    m.feed(voiceTranscript('open', 100));
    expect(intents).toEqual([]);
    expect(m.state).toBe('CALIBRATING');
  });

  it('setCalibrating(false) returns to IDLE', () => {
    const targets = new TargetRegistry();
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.setCalibrating(true);
    m.setCalibrating(false);
    expect(m.state).toBe('IDLE');
  });
});
