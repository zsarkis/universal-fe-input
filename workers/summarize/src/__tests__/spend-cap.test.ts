import { describe, it, expect } from 'vitest';
import { reserveSpend, recordSpend } from '../spend-cap.js';

class FakeKV {
  map = new Map<string, string>();
  async get(k: string) { return this.map.get(k) ?? null; }
  async put(k: string, v: string) { this.map.set(k, v); }
}

describe('spend cap', () => {
  it('reserveSpend returns ok until cap reached', async () => {
    const kv = new FakeKV();
    const now = Date.now();
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.4, 1.0, now)).ok).toBe(true);
    await recordSpend(kv as unknown as KVNamespace, 0.4, now);
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.4, 1.0, now)).ok).toBe(true);
    await recordSpend(kv as unknown as KVNamespace, 0.4, now);
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.4, 1.0, now)).ok).toBe(false);
  });

  it('separates by UTC day', async () => {
    const kv = new FakeKV();
    const day1 = Date.UTC(2026, 0, 1);
    const day2 = Date.UTC(2026, 0, 2);
    await recordSpend(kv as unknown as KVNamespace, 1.0, day1);
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.5, 1.0, day1)).ok).toBe(false);
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.5, 1.0, day2)).ok).toBe(true);
  });
});
