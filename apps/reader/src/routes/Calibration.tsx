import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extendedCalibrationTargets, type FaceGazeCalibrationSample } from '@input/core';
import { useEngine } from '../engine/useEngine.js';
import { sharedGaze } from '../engine/usePerception.js';

// Per-dot timing: settle longer so the user's gaze has stabilized on the new
// dot before we start trusting samples; then collect for SAMPLE_MS.
const SETTLE_MS = 700;
const SAMPLE_MS = 1000;
const SAMPLE_INTERVAL_MS = 50;
// Discard the first N samples of each dot — saccade tails and post-saccade
// over/undershoot mean the first few hundred ms of "sampling" is still junk.
const DROP_FIRST_SAMPLES = 5;

type Phase = 'intro' | 'settle' | 'sampling';

export function Calibration() {
  const { engine } = useEngine();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const collected = useRef<FaceGazeCalibrationSample[]>([]);
  // Live gaze readout so the user can see what's being recorded.
  const [gazePos, setGazePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    engine.setCalibrating(true);
    collected.current = [];
    return () => engine.setCalibrating(false);
  }, [engine]);

  // Poll the engine for the last gaze reading; only meaningful once the
  // adapter has been calibrated (otherwise lastGaze stays null because the
  // adapter only emits readings when calibrated).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const g = engine.lastGaze;
      if (g) setGazePos({ x: g.x, y: g.y });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  const points = extendedCalibrationTargets({
    width: size.w,
    height: size.h,
    marginPct: 10,
  });
  const point = points[i];

  const totalPoints = points.length;
  const pointX = point?.x ?? 0;
  const pointY = point?.y ?? 0;
  const havePoint = !!point;
  const totalSeconds = Math.ceil((totalPoints * (SETTLE_MS + SAMPLE_MS)) / 1000);

  // After user starts, kick off the settle→sample cycle for each dot.
  const started = phase !== 'intro';
  useEffect(() => {
    if (!started || !havePoint) return;
    setPhase('settle');
    const settleTimer = setTimeout(() => setPhase('sampling'), SETTLE_MS);
    return () => clearTimeout(settleTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, havePoint, started]);

  // Sampling phase: collect features for SAMPLE_MS, then advance or finish.
  useEffect(() => {
    if (!havePoint || phase !== 'sampling') return;
    let samplesThisDot = 0;
    const sampleTimer = setInterval(() => {
      const features = sharedGaze.getFeatures();
      if (!features) return;
      samplesThisDot++;
      if (samplesThisDot <= DROP_FIRST_SAMPLES) return; // discard saccade-tail noise
      collected.current.push({ screenX: pointX, screenY: pointY, features });
    }, SAMPLE_INTERVAL_MS);
    const advance = setTimeout(() => {
      clearInterval(sampleTimer);
      if (i + 1 >= totalPoints) {
        sharedGaze.setCalibration(collected.current);
        nav('/');
      } else {
        setI(i + 1);
      }
    }, SAMPLE_MS);
    return () => {
      clearInterval(sampleTimer);
      clearTimeout(advance);
    };
  }, [i, phase, nav, havePoint, pointX, pointY, totalPoints]);

  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-950 p-8">
        <div className="max-w-md text-center">
          <h1 className="text-3xl">Gaze calibration</h1>
          <p className="mt-4 text-neutral-300">
            We'll show you {totalPoints} dots, one at a time, in different spots around the screen.
            Look directly at each dot while it pulses green — about a second each.
            Try to hold your head still; only move your eyes.
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            Takes about {totalSeconds} seconds.
          </p>
          <button
            onClick={() => setPhase('settle')}
            className="mt-8 rounded-full bg-blue-500 px-6 py-3 text-lg shadow-xl hover:bg-blue-400"
          >
            Start calibration
          </button>
          <button
            onClick={() => nav('/')}
            className="mt-3 block w-full text-sm text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!point) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950">
      <div className="absolute left-1/2 top-8 -translate-x-1/2 text-sm text-neutral-400">
        Look at the dot ({i + 1}/{points.length}) — {phase === 'settle' ? 'get ready' : 'hold still'}
      </div>

      {/* Target dot */}
      <div
        className={`absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_24px_8px_rgba(74,144,226,0.5)] ${
          phase === 'sampling' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
        }`}
        style={{ left: point.x, top: point.y }}
      />

      {/* Live gaze readout — visible during calibration so you can see how
          the system is interpreting your eyes in real time. Only renders
          once we have an existing calibration to project from (i.e. on a
          re-calibration); on first-time calibration there's nothing to show. */}
      {gazePos && (
        <div
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pink-400/70"
          style={{ left: gazePos.x, top: gazePos.y, width: 24, height: 24 }}
        />
      )}
    </div>
  );
}
