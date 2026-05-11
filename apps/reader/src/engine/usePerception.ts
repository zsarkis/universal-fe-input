import { useEffect, useRef, useState } from 'react';
import { FaceGazeAdapter, HandAdapter, VoiceAdapter } from '@input/core';
import { useEngine } from './useEngine.js';
import { useSettings } from '../store/settings.js';

// Module-level singletons so non-Perception components (e.g. Calibration)
// can reach the gaze adapter for setCalibration().
export const sharedGaze = new FaceGazeAdapter();
const sharedHand = new HandAdapter();
const sharedVoice = new VoiceAdapter();

export interface PerceptionHandle {
  start(): Promise<void>;
  stop(): void;
  lastGesture: string;
  lastTranscript: string | null;
  micRms: number;
  micThreshold: number;
  gaze: FaceGazeAdapter;
}

export function usePerception(): PerceptionHandle & { ready: boolean } {
  const { engine } = useEngine();
  const gaze = useRef(sharedGaze);
  const hand = useRef(sharedHand);
  const voice = useRef(sharedVoice);
  const [ready, setReady] = useState(false);
  const gestureRef = useRef('none');
  const transcriptRef = useRef<string | null>(null);

  useEffect(() => {
    const offs = [
      gaze.current.on('reading', (r) => engine.feed(r)),
      hand.current.on('reading', (r) => {
        if (r.kind === 'hand') gestureRef.current = r.gesture;
        engine.feed(r);
      }),
      voice.current.on('reading', (r) => {
        if (r.kind === 'voice' && r.phase === 'transcript') transcriptRef.current = r.transcript;
        engine.feed(r);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [engine]);

  return {
    ready,
    get lastGesture() { return gestureRef.current; },
    get lastTranscript() { return transcriptRef.current; },
    get micRms() { return voice.current.vad.lastRms; },
    get micThreshold() { return 0.01; },
    get gaze() { return gaze.current; },
    async start() {
      const s = useSettings.getState();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: s.enableGaze || s.enableHand,
        audio: s.enableVoice,
      });
      // Run adapters in parallel but don't let one failure block the others.
      // Set `ready` immediately so debug overlays render even if (e.g.) Whisper
      // is still downloading its model.
      setReady(true);
      const wrap = (name: string, p: Promise<void>) =>
        p.catch((e) => console.error(`[usePerception] ${name} failed:`, e));
      const tasks: Promise<unknown>[] = [];
      if (s.enableGaze) tasks.push(wrap('gaze', gaze.current.start(stream)));
      if (s.enableHand) tasks.push(wrap('hand', hand.current.start(stream)));
      if (s.enableVoice) tasks.push(wrap('voice', voice.current.start(stream)));
      await Promise.all(tasks);
    },
    stop() {
      gaze.current.stop();
      hand.current.stop();
      voice.current.stop();
      setReady(false);
    },
  };
}
