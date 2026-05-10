import { useEffect, useRef, useState } from 'react';
import { GazeAdapter, HandAdapter, VoiceAdapter } from '@input/core';
import { useEngine } from './useEngine.js';
import { useSettings } from '../store/settings.js';

export interface PerceptionHandle {
  start(): Promise<void>;
  stop(): void;
  lastGesture: string;
  lastTranscript: string | null;
}

export function usePerception(): PerceptionHandle & { ready: boolean } {
  const { engine } = useEngine();
  const gaze = useRef(new GazeAdapter());
  const hand = useRef(new HandAdapter());
  const voice = useRef(new VoiceAdapter());
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
    async start() {
      const s = useSettings.getState();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: s.enableGaze || s.enableHand,
        audio: s.enableVoice,
      });
      const tasks: Promise<void>[] = [];
      if (s.enableGaze) tasks.push(gaze.current.start(stream));
      if (s.enableHand) tasks.push(hand.current.start(stream));
      if (s.enableVoice) tasks.push(voice.current.start(stream));
      await Promise.all(tasks);
      setReady(true);
    },
    stop() {
      gaze.current.stop();
      hand.current.stop();
      voice.current.stop();
      setReady(false);
    },
  };
}
