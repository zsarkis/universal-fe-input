import { useEffect, useState } from 'react';
import { useEngine } from '../engine/useEngine.js';

export function GazeCursor() {
  const { engine, state } = useEngine();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const off = engine.machine.on('state', () => {});
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    // Until WebGazer is wired in Task 3.13, fall back to mouse for development
    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      off();
    };
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
