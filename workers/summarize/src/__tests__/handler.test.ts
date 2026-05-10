import { describe, it, expect, vi } from 'vitest';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create };
  },
}));

import handler from '../index.js';

class FakeKV {
  map = new Map<string, string>();
  async get(k: string) { return this.map.get(k) ?? null; }
  async put(k: string, v: string) { this.map.set(k, v); }
}

const env = () => ({
  ANTHROPIC_API_KEY: 'k',
  RATE: new FakeKV() as unknown as KVNamespace,
  DAILY_SPEND_CAP_USD: '1.0',
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://x/api/summarize', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1', ...headers },
  });

describe('handler', () => {
  it('returns summary on success', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'short summary' }] });
    const res = await handler.fetch(post({ text: 'hello world' }), env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { summary: string };
    expect(body.summary).toBe('short summary');
  });

  it('rate-limits after 10 calls/IP/hour', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const e = env();
    for (let i = 0; i < 10; i++) {
      const r = await handler.fetch(post({ text: 'x' }), e);
      expect(r.status).toBe(200);
    }
    const r = await handler.fetch(post({ text: 'x' }), e);
    expect(r.status).toBe(429);
  });

  it('forwards user-supplied API key when present', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = await handler.fetch(
      post({ text: 'x' }, { 'x-anthropic-api-key': 'user-key' }),
      env(),
    );
    expect(res.status).toBe(200);
  });

  it('rejects oversize input', async () => {
    const big = 'a'.repeat(60_000);
    const res = await handler.fetch(post({ text: big }), env());
    expect(res.status).toBe(413);
  });
});
