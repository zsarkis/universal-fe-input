import { useEffect, useId, useRef } from 'react';
import { useEngine } from './useEngine.js';

export function useGazeTarget<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const id = useId();
  const { engine, hoveredTargetId } = useEngine();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      engine.targets.register({
        id,
        rect: { x: r.left, y: r.top, width: r.width, height: r.height },
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update);
      engine.targets.unregister(id);
    };
  }, [engine, id]);

  return { ref, id, hovered: hoveredTargetId === id };
}
