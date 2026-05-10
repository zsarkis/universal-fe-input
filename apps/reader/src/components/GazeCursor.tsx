import { useEffect, useState } from 'react';
import { useEngine } from '../engine/useEngine.js';

export function GazeCursor() {
  const { engine, state } = useEngine();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const g = engine.lastGaze;
      if (g) setPos({ x: g.x, y: g.y });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  if (!pos) return null;
  const armed = state === 'ARMED' || state === 'HOVERED';
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left: pos.x,
        top: pos.y,
        width: armed ? 18 : 12,
        height: armed ? 18 : 12,
        background: armed ? 'rgba(74,144,226,0.85)' : 'rgba(255,255,255,0.55)',
        boxShadow: armed ? '0 0 16px 4px rgba(74,144,226,0.7)' : '0 0 8px rgba(255,255,255,0.4)',
        transition: 'width 80ms ease, height 80ms ease, background 80ms ease',
      }}
    />
  );
}
