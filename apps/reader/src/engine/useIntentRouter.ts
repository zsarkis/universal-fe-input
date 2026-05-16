import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEngine } from './useEngine.js';
import { useUi } from '../store/ui.js';

const SCROLL_TARGET_FRACTION = 0.25;

function scrollToNeighborParagraph(direction: 1 | -1) {
  const paragraphs = Array.from(document.querySelectorAll<HTMLElement>('article p'));
  if (paragraphs.length === 0) return;
  const anchor = window.innerHeight * SCROLL_TARGET_FRACTION;
  const tops = paragraphs.map((p) => p.getBoundingClientRect().top);
  let idx: number;
  if (direction === 1) {
    idx = tops.findIndex((t) => t > anchor + 1);
    if (idx === -1) idx = paragraphs.length - 1;
  } else {
    const reversed = [...tops].reverse().findIndex((t) => t < anchor - 1);
    idx = reversed === -1 ? 0 : paragraphs.length - 1 - reversed;
  }
  const target = paragraphs[idx];
  if (!target) return;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - anchor;
  window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
}

function bookmarkKey(pathname: string): string | null {
  const match = pathname.match(/^\/read\/(.+)$/);
  return match ? `bookmark:${match[1]}` : null;
}

export function useIntentRouter() {
  const { engine } = useEngine();
  const nav = useNavigate();
  const loc = useLocation();

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
        case 'next_paragraph':
          scrollToNeighborParagraph(1);
          break;
        case 'previous_paragraph':
          scrollToNeighborParagraph(-1);
          break;
        case 'bookmark': {
          const key = bookmarkKey(loc.pathname);
          if (key) {
            localStorage.setItem(key, String(window.scrollY));
            useUi.getState().showToast('Bookmarked');
          }
          break;
        }
      }
    });
  }, [engine, nav, loc.pathname]);
}
