import { describe, it, expect } from 'vitest';
import { resolveIntent } from '../grammar.js';

describe('resolveIntent', () => {
  const cases: Array<[string, ReturnType<typeof resolveIntent>]> = [
    ['open', { name: 'open', confidence: 0 }],
    ['Open this', { name: 'open', confidence: 0 }],
    ['select', { name: 'select', confidence: 0 }],
    ['close', { name: 'close', confidence: 0 }],
    ['back', { name: 'back', confidence: 0 }],
    ['go back', { name: 'back', confidence: 0 }],
    ['scroll down', { name: 'scroll_down', confidence: 0 }],
    ['scroll up', { name: 'scroll_up', confidence: 0 }],
    ['top', { name: 'top', confidence: 0 }],
    ['go to top', { name: 'top', confidence: 0 }],
    ['bottom', { name: 'bottom', confidence: 0 }],
    ['next', { name: 'next', confidence: 0 }],
    ['previous', { name: 'previous', confidence: 0 }],
    ['previous one', { name: 'previous', confidence: 0 }],
    ['summarize', { name: 'summarize', confidence: 0 }],
    ['summarize this', { name: 'summarize', confidence: 0 }],
    ['read aloud', { name: 'read_aloud', confidence: 0 }],
    ['read it aloud', { name: 'read_aloud', confidence: 0 }],
    ['stop reading', { name: 'stop_reading', confidence: 0 }],
    ['calibrate', { name: 'calibrate', confidence: 0 }],
    ['cancel', { name: 'cancel', confidence: 0 }],
    ['nevermind', { name: 'cancel', confidence: 0 }],
    ['help', { name: 'help', confidence: 0 }],
    ['what can I say', { name: 'help', confidence: 0 }],
    // Whisper-style noise
    ['  Open. ', { name: 'open', confidence: 0 }],
    ['scrolldown', { name: 'scroll_down', confidence: 0 }],
    // Unknown
    ['blueberry', null],
    ['', null],
  ];

  for (const [input, expected] of cases) {
    it(`resolves "${input}" → ${expected ? expected.name : 'null'}`, () => {
      const result = resolveIntent(input);
      if (expected === null) {
        expect(result).toBeNull();
      } else {
        expect(result?.name).toBe(expected.name);
      }
    });
  }

  it('attaches confidence in (0, 1]', () => {
    const r = resolveIntent('open');
    expect(r?.confidence).toBeGreaterThan(0);
    expect(r?.confidence).toBeLessThanOrEqual(1);
  });
});
