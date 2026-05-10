# Deploying the summarize worker

Manual one-time setup. Requires:

- A Cloudflare account (free tier is fine)
- An Anthropic API key with access to Claude Haiku 4.5
- `pnpm install` already run from the repo root

All commands below assume your shell is in this directory: `workers/summarize/`.

## 1. Create a KV namespace

This namespace stores per-IP rate-limit timestamps and per-day spend totals.

```bash
pnpm exec wrangler kv:namespace create RATE
```

Wrangler prints something like:

```
{ binding = "RATE", id = "abcd1234abcd1234abcd1234abcd1234" }
```

Copy that `id` value into `wrangler.toml`, replacing the `REPLACE_WITH_KV_ID` placeholder:

```toml
[[kv_namespaces]]
binding = "RATE"
id = "abcd1234abcd1234abcd1234abcd1234"
```

Commit the change.

## 2. Set the Anthropic secret

```bash
pnpm exec wrangler secret put ANTHROPIC_API_KEY
```

Paste your `sk-ant-...` key when prompted. The key is encrypted at Cloudflare and never appears in source or logs.

## 3. Deploy

```bash
pnpm --filter @workers/summarize deploy
```

Wrangler builds the worker and uploads it. On success, it prints the deployed URL, typically:

```
https://universal-fe-input-summarize.<your-subdomain>.workers.dev
```

## 4. Smoke test

```bash
curl -X POST https://universal-fe-input-summarize.<your-subdomain>.workers.dev/api/summarize \
  -H 'content-type: application/json' \
  -d '{"text":"hello world"}'
```

Expected: a 200 response with `{"summary":"..."}`. Check Cloudflare's worker logs (`wrangler tail`) for any errors.

## 5. Point the reader at the deployed URL

Set `VITE_SUMMARIZE_URL` in `apps/reader/.env` to your deployed endpoint:

```
VITE_SUMMARIZE_URL=https://universal-fe-input-summarize.<your-subdomain>.workers.dev/api/summarize
```

Rebuild the reader (`pnpm --filter @apps/reader build`) and redeploy if it's also live.

## Caps and limits

The worker has these guardrails (configured in `wrangler.toml` and `src/index.ts`):

- Per-IP rate limit: 10 calls / hour (sliding window).
- Daily spend cap: `$1.0/day` (`DAILY_SPEND_CAP_USD` env var). Best-effort under concurrency — see `src/spend-cap.ts` for the TOCTOU caveat.
- Estimated cost per call: ~$0.003 (used to project the cap).
- Max input size: 50,000 characters per request.

Adjust these values in source if your usage profile differs. The cap protects against runaway cost from misuse or buggy clients.

## Rotating the secret

To rotate the Anthropic key:

```bash
pnpm exec wrangler secret put ANTHROPIC_API_KEY
```

Wrangler overwrites the existing value. The next request picks up the new key without a redeploy.

## BYOK (bring your own key)

If a user supplies their own Anthropic key via the reader's Settings, the request includes an `x-anthropic-api-key` header. The worker forwards that key to Anthropic instead of using its own secret, and skips the spend cap (it's the user's bill). Rate limiting still applies per IP.
