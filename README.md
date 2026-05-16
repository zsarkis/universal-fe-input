# Universal FE Input

A multimodal input system that fuses webcam-based **gaze tracking**, **hand-gesture recognition**, and **voice intent** into a single intent stream that drives a hands-free article reader.

The design idea: **gaze provides the region, voice provides the intent.** Webcam gaze on commodity hardware is roughly accurate enough to pick a big card or page region; voice is precise enough to say what to do with it. The fusion state machine combines those signals into committed intents.

> Look at a card. Pinch (or say "open"). Look at the bottom of the page to scroll. Say "summarize," "next paragraph," "bookmark," "back."

## Demo

[60s demo video — placeholder, embed once recorded]

## Why this is interesting

- **`@input/core`** — a framework-agnostic TypeScript engine. A state machine fuses three noisy perception streams (gaze, hand, voice) into reliable intents. 88 tests, 100% branch coverage on the fusion machine.
- **`apps/reader`** — the showcase: a hands-free article reader built on the engine via a small set of React hooks (`useEngine`, `useGazeTarget`, `useAutoScroll`, `useIntentRouter`, `usePerception`).
- **`workers/summarize`** — a Cloudflare Worker proxy that calls Claude Haiku 4.5 for live summarization. Rate-limited per IP, hard daily spend cap, supports bring-your-own-key.

The interesting story is the fusion layer. Each modality on its own is noisy: gaze drifts (~50–150px on commodity webcams), voice mis-recognizes, gestures fire accidentally. The fusion state machine combines signals so an action only commits when two signals agree (or when one signal is unambiguous on its own — like a deliberately held pinch). The reader UX is intentionally built around big targets and region-level gaze cues so the engine's strengths show; precise link targeting is out of scope (see issue #2).

## Architecture

Detailed design and rationale: [`docs/superpowers/specs/2026-05-09-universal-fe-input-design.md`](docs/superpowers/specs/2026-05-09-universal-fe-input-design.md)

Implementation plan (task-by-task): [`docs/superpowers/plans/2026-05-09-universal-fe-input.md`](docs/superpowers/plans/2026-05-09-universal-fe-input.md)

```
universal-fe-input/
├── packages/input-core/    @input/core — engine library (perception adapters, fusion, intents)
├── apps/reader/            React + Vite reader app (Library, Reader, Calibration, Settings)
├── workers/summarize/      Cloudflare Worker for live LLM summarization
└── docs/superpowers/       design spec, implementation plan
```

## Tech stack

- **Engine:** TypeScript, MediaPipe Tasks Vision (hand landmarks), WebGazer.js (gaze), `@xenova/transformers` (Whisper, browser-local).
- **Reader:** React 18, Vite, Tailwind, Zustand, React Router.
- **Worker:** Cloudflare Workers, Anthropic SDK (Claude Haiku 4.5).
- **Build:** pnpm + turbo monorepo.

## Run locally

Requires Node 20+, pnpm 9+ (corepack handles this), and a working webcam + microphone.

```bash
pnpm install
pnpm --filter @input/core build       # reader depends on core
pnpm --filter @apps/reader dev
```

Open `http://localhost:5173`, click **Start**, grant webcam + microphone permissions.

The reader works fully offline except for live summarization (which calls a Cloudflare Worker — see [`workers/summarize/DEPLOY.md`](workers/summarize/DEPLOY.md) to deploy your own, or set `VITE_SUMMARIZE_URL` to point at an already-deployed instance).

## Status

This is a portfolio/resume project, not a shipping product. v1 is complete: the demo script in [`docs/superpowers/specs/2026-05-09-universal-fe-input-design.md`](docs/superpowers/specs/2026-05-09-universal-fe-input-design.md) (§5) runs end-to-end with sub-300ms perceived latency.

Stretch goals (not implemented in v1):
- macOS OS-cursor adapter via a Tauri sidecar.
- URL paste + article extraction (Mercury-style).
- LLM-driven fuzzy intent resolution ("open the link about climate").

## Tests

```bash
pnpm test                                # all workspaces
pnpm --filter @input/core test           # 88 tests, mostly fusion + perception
pnpm --filter @workers/summarize test    # 8 tests, handler + rate limit + spend cap
```

Reader UI verification is manual — see the demo script in the design spec.

## License

MIT (or your preference — set when publishing).
