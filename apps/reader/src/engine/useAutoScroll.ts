import { useEffect, useRef } from 'react';
import { useEngine } from './useEngine.js';

const ZONE = 0.15;
const SCROLL_PX_PER_FRAME = 4;

export function useAutoScroll() {
  const { engine } = useEngine();
  const rafRef = useRef(0);
  useEffect(() => {
    const tick = () => {
      const g = engine.lastGaze;
      if (g && g.fixated && g.confidence >= 0.6) {
        const top = window.innerHeight * ZONE;
        const bottom = window.innerHeight * (1 - ZONE);
        if (g.y < top) window.scrollBy(0, -SCROLL_PX_PER_FRAME);
        else if (g.y > bottom) window.scrollBy(0, SCROLL_PX_PER_FRAME);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine]);
}
