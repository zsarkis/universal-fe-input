import type { IntentName } from '../types.js';

interface IntentPattern {
  name: IntentName;
  patterns: RegExp[];
}

const RULES: IntentPattern[] = [
  { name: 'open', patterns: [/\bopen\b/] },
  { name: 'select', patterns: [/\bselect\b/, /\bchoose\b/] },
  { name: 'close', patterns: [/\bclose\b/, /\bdismiss\b/] },
  { name: 'back', patterns: [/\bback\b/, /\breturn\b/] },
  { name: 'scroll_down', patterns: [/\bscroll\s*down\b/, /\bscrolldown\b/] },
  { name: 'scroll_up', patterns: [/\bscroll\s*up\b/, /\bscrollup\b/] },
  { name: 'top', patterns: [/\btop\b/] },
  { name: 'bottom', patterns: [/\bbottom\b/] },
  { name: 'next', patterns: [/\bnext\b/] },
  { name: 'previous', patterns: [/\bprevious\b/, /\bprev\b/] },
  { name: 'summarize', patterns: [/\bsummariz/, /\bsummary\b/, /\btl;dr\b/] },
  { name: 'read_aloud', patterns: [/\bread\b.*\baloud\b/, /\bread\s*aloud\b/, /\bspeak\b/] },
  { name: 'stop_reading', patterns: [/\bstop\s*reading\b/, /\bbe\s*quiet\b/, /\bsilence\b/] },
  { name: 'calibrate', patterns: [/\bcalibrat/] },
  { name: 'cancel', patterns: [/\bcancel\b/, /\bnever\s*mind\b/, /\bnevermind\b/, /\babort\b/] },
  { name: 'help', patterns: [/\bhelp\b/, /\bwhat\s*can\s*i\s*say\b/] },
];

export interface IntentMatch {
  name: IntentName;
  confidence: number;
}

export function resolveIntent(transcript: string): IntentMatch | null {
  const t = transcript.trim().toLowerCase();
  if (!t) return null;
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      if (p.test(t)) {
        const confidence = p.source.length <= 8 ? 0.85 : 0.95;
        return { name: rule.name, confidence };
      }
    }
  }
  return null;
}
