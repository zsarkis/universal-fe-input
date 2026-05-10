export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  limit: number,
  windowMs: number,
  now: number,
): Promise<{ ok: boolean; remaining: number }> {
  const key = `rl:${ip}`;
  const raw = (await kv.get(key)) ?? '[]';
  const arr = JSON.parse(raw) as number[];
  const cutoff = now - windowMs;
  const fresh = arr.filter((t) => t >= cutoff);
  if (fresh.length >= limit) {
    await kv.put(key, JSON.stringify(fresh), { expirationTtl: Math.ceil(windowMs / 1000) });
    return { ok: false, remaining: 0 };
  }
  fresh.push(now);
  await kv.put(key, JSON.stringify(fresh), { expirationTtl: Math.ceil(windowMs / 1000) });
  return { ok: true, remaining: limit - fresh.length };
}
