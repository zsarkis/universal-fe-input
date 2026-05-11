import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ninePointTargets, type FaceGazeCalibrationSample } from '@input/core';
import { useEngine } from '../engine/useEngine.js';
import { sharedGaze } from '../engine/usePerception.js';

// Per-dot timing: 500ms to settle, then 1000ms of sample collection.
const SETTLE_MS = 500;
const SAMPLE_MS = 1000;
const SAMPLE_INTERVAL_MS = 50;

export function Calibration() {
  const { engine } = useEngine();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'settle' | 'sampling'>('settle');
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const collected = useRef<FaceGazeCalibrationSample[]>([]);

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

  const points = ninePointTargets({ width: size.w, height: size.h, marginPct: 10 });
  const point = points[i];

  // Settle phase → sampling phase, then advance.
  useEffect(() => {
    if (!point) return;
    setPhase('settle');
    const settleTimer = setTimeout(() => setPhase('sampling'), SETTLE_MS);
    return () => clearTimeout(settleTimer);
  }, [i, point]);

  useEffect(() => {
    if (!point || phase !== 'sampling') return;
    const sampleTimer = setInterval(() => {
      const features = sharedGaze.getFeatures();
      if (features) {
        collected.current.push({ screenX: point.x, screenY: point.y, features });
      }
    }, SAMPLE_INTERVAL_MS);
    const advance = setTimeout(() => {
      clearInterval(sampleTimer);
      if (i + 1 >= points.length) {
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
  }, [i, phase, nav, point, points.length]);

  if (!point) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950">
      <div className="absolute left-1/2 top-8 -translate-x-1/2 text-sm text-neutral-400">
        Look at the dot ({i + 1}/{points.length}) — {phase === 'settle' ? 'get ready' : 'hold still'}
      </div>
      <div
        className={`absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_24px_8px_rgba(74,144,226,0.5)] ${
          phase === 'sampling' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
        }`}
        style={{ left: point.x, top: point.y }}
      />
    </div>
  );
}
