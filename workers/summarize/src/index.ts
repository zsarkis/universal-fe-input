import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit } from './rate-limit.js';
import { reserveSpend, recordSpend } from './spend-cap.js';

export interface Env {
  ANTHROPIC_API_KEY: string;
  RATE: KVNamespace;
  DAILY_SPEND_CAP_USD: string;
}

const RATE_LIMIT_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;
const MAX_INPUT_CHARS = 50_000;
const ESTIMATED_USD_PER_CALL = 0.003;
const MODEL = 'claude-haiku-4-5-20251001';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (req.method !== 'POST' || url.pathname !== '/api/summarize') {
      return cors(new Response('Not Found', { status: 404 }));
    }

    const ip = req.headers.get('cf-connecting-ip') ?? 'unknown';
    const now = Date.now();
    const rl = await checkRateLimit(env.RATE, ip, RATE_LIMIT_PER_HOUR, HOUR_MS, now);
    if (!rl.ok) return cors(new Response('Rate limit exceeded', { status: 429 }));

    let body: { text?: unknown };
    try { body = await req.json(); } catch { return cors(new Response('Bad JSON', { status: 400 })); }
    const text = typeof body.text === 'string' ? body.text : '';
    if (!text) return cors(new Response('Missing text', { status: 400 }));
    if (text.length > MAX_INPUT_CHARS) return cors(new Response('Input too large', { status: 413 }));

    const userKey = req.headers.get('x-anthropic-api-key');
    const usingUserKey = !!userKey;
    if (!usingUserKey) {
      const cap = Number(env.DAILY_SPEND_CAP_USD || '1');
      const sp = await reserveSpend(env.RATE, ESTIMATED_USD_PER_CALL, cap, now);
      if (!sp.ok) return cors(new Response('Daily spend cap reached', { status: 503 }));
    }

    const client = new Anthropic({ apiKey: usingUserKey ? userKey : env.ANTHROPIC_API_KEY });
    let resp;
    try {
      resp = await client.messages.create({
        model: MODEL,
        max_tokens: 400,
        messages: [
          { role: 'user', content: `Summarize the following article in 4–6 short bullets:\n\n${text}` },
        ],
      });
    } catch (e) {
      console.error('Anthropic error:', e);
      return cors(new Response('Upstream error', { status: 502 }));
    }

    if (!usingUserKey) await recordSpend(env.RATE, ESTIMATED_USD_PER_CALL, now);

    const summary = resp.content
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { type: string; text?: string }) => b.text ?? '')
      .join('\n');
    return cors(new Response(JSON.stringify({ summary }), { headers: { 'content-type': 'application/json' } }));
  },
};

function cors(res: Response): Response {
  res.headers.set('access-control-allow-origin', '*');
  res.headers.set('access-control-allow-methods', 'POST, OPTIONS');
  res.headers.set('access-control-allow-headers', 'content-type, x-anthropic-api-key');
  return res;
}
