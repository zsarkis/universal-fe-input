import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ninePointTargets } from '@input/core';
import { useEngine } from '../engine/useEngine.js';

export function Calibration() {
  const { engine } = useEngine();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    engine.setCalibrating(true);
    return () => engine.setCalibrating(false);
  }, [engine]);

  const points = ninePointTargets({ width: size.w, height: size.h, marginPct: 10 });
  const point = points[i];

  useEffect(() => {
    const t = setTimeout(() => {
      if (i + 1 >= points.length) nav('/');
      else setI(i + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [i, nav, points.length]);

  if (!point) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950">
      <div className="absolute left-1/2 top-8 -translate-x-1/2 text-sm text-neutral-400">
        Look at the dot ({i + 1}/{points.length})
      </div>
      <div
        className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_24px_8px_rgba(74,144,226,0.5)] animate-pulse"
        style={{ left: point.x, top: point.y }}
      />
    </div>
  );
}
