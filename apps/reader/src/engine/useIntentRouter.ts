import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEngine } from './useEngine.js';
import { useUi } from '../store/ui.js';

export function useIntentRouter() {
  const { engine } = useEngine();
  const nav = useNavigate();

  useEffect(() => {
    return engine.onIntent((i) => {
      switch (i.name) {
        case 'select':
        case 'open':
          if (i.targetId) {
            const el = document.querySelector<HTMLElement>(`[data-target-id="${CSS.escape(i.targetId)}"]`);
            (el as HTMLAnchorElement | null)?.click();
          }
          break;
        case 'back':
          nav(-1);
          break;
        case 'calibrate':
          nav('/calibrate');
          break;
        case 'help':
          useUi.getState().setHelp(true);
          break;
        case 'summarize':
          useUi.getState().setSummary(true);
          break;
        case 'scroll_down':
          window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
          break;
        case 'scroll_up':
          window.scrollBy({ top: -window.innerHeight * 0.6, behavior: 'smooth' });
          break;
        case 'top':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'bottom':
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          break;
      }
    });
  }, [engine, nav]);
}
