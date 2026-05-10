import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../rate-limit.js';

class FakeKV {
  private map = new Map<string, string>();
  async get(k: string) { return this.map.get(k) ?? null; }
  async put(k: string, v: string) { this.map.set(k, v); }
}

describe('checkRateLimit', () => {
  it('allows up to N within the window', async () => {
    const kv = new FakeKV();
    for (let i = 0; i < 10; i++) {
      const r = await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 10, 3600 * 1000, i);
      expect(r.ok).toBe(true);
    }
    const r = await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 10, 3600 * 1000, 10);
    expect(r.ok).toBe(false);
  });

  it('expires entries outside the window', async () => {
    const kv = new FakeKV();
    await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 1, 1000, 0);
    const blocked = await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 1, 1000, 500);
    expect(blocked.ok).toBe(false);
    const allowed = await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 1, 1000, 2000);
    expect(allowed.ok).toBe(true);
  });
});
