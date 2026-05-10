// Best-effort daily spend cap. KV has no compare-and-swap, so concurrent
// requests can both pass `reserveSpend` and both call `recordSpend`,
// briefly exceeding the cap. Acceptable for a portfolio deploy with a $1/day
// cap; for production, replace KV with a Durable Object counter.
const day = (now: number) => new Date(now).toISOString().slice(0, 10);

export async function reserveSpend(
  kv: KVNamespace,
  estimateUsd: number,
  capUsd: number,
  now: number,
): Promise<{ ok: boolean; spentUsd: number }> {
  const key = `spend:${day(now)}`;
  const spent = Number((await kv.get(key)) ?? 0);
  if (spent + estimateUsd > capUsd) return { ok: false, spentUsd: spent };
  return { ok: true, spentUsd: spent };
}

export async function recordSpend(kv: KVNamespace, usd: number, now: number): Promise<void> {
  const key = `spend:${day(now)}`;
  const spent = Number((await kv.get(key)) ?? 0);
  await kv.put(key, String(spent + usd), { expirationTtl: 60 * 60 * 48 });
}
