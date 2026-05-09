# Universal FE Input — Design Spec

**Date:** 2026-05-09
**Status:** Draft, pending implementation plan
**Working dir:** `/Users/zachsarkis/Documents/repos/universal-fe-input`

## 1. Project framing

A multimodal input system that fuses webcam-based **gaze tracking**, **hand-gesture recognition**, and **voice intent** into a single intent stream that drives a web app. Shipped as two artifacts:

- `@input/core` — a framework-agnostic TypeScript library that wraps perception adapters and exposes a fusion state machine.
- `apps/reader` — a hands-free article reader that consumes the engine and serves as the primary showcase.

This is a **portfolio/resume project**. Optimization targets, in order: demoable end-to-end, finishable in ~4 weeks, technically interesting in the fusion layer specifically. The "universal" framing comes from the engine being a reusable package, not from claiming to drive any application on any OS.

### Primary user story

> "My hands are dirty (cooking, mechanic work, presenting). My eyes work, my voice works. I want to read an article and navigate without touching my laptop."

### Non-goals

- Accessibility-grade assistive technology. The system is built for hands-free productivity / power-user augmentation; a11y is a happy side effect, not a design driver.
- OS-wide cursor control. Considered as a stretch only (see §11).
- Mobile / touch.
- Multi-user, accounts, sync, persistence beyond `localStorage`.

## 2. Architecture

```
universal-fe-input/                    pnpm + turbo monorepo
├── packages/
│   └── input-core/                    @input/core — the engine
│       ├── perception/                MediaPipe + WebGazer + Whisper adapters
│       ├── fusion/                    state machine combining signals
│       ├── intents/                   typed intent dispatcher
│       ├── calibration/               first-run calibration logic (UI-agnostic)
│       └── index.ts                   public API
├── apps/
│   └── reader/                        the showcase web app
│       ├── routes/                    library, reader, calibration, settings
│       └── components/                gaze cursor, voice indicator, focus highlights
├── workers/
│   └── summarize/                     Cloudflare Worker proxy for LLM summarization
└── docs/superpowers/specs/
```

The engine package is the load-bearing artifact: it has its own README, types, tests, and could be consumed by a second app without modification.

### Data flow per frame

```
camera frame ──┐
               ├─► perception (parallel, in Web Worker)
microphone ────┘     ├─ gaze module    → {x, y, confidence, fixated, ts}
                     ├─ hand module    → {gesture, held_ms, confidence, ts}
                     └─ voice module   → {speechStarted | transcript+intent, ts}
                              │
                              ▼
                     fusion state machine
                              │
                              ▼
                     intent dispatcher  (typed event emitter)
                              │
                              ▼
                     reader app handlers
```

The fusion layer is the only piece that knows about all three modalities at once. Adapters are independent and have no shared state.

## 3. Fusion state machine

### Principle

No single noisy modality is enough to fire an action. Voice transcripts mis-recognize, gaze drifts, accidental gestures happen. Two signals must agree — except for **deliberate gestures** (held pinches), which are intentional enough to commit alone.

### States

```
    IDLE ──gaze settles on target──► HOVERED
                                        │
                          ┌─────────────┴──────────────┐
                          │                            │
              voice intent fires                pinch held > commitPinchMs
                          │                            │
                          ▼                            │
                       ARMED                           │
                          │                            │
                          │  voice transcript          │
                          │   resolves to a known      │
                          │   intent                   │
                          │                            │
                          ▼                            ▼
                                COMMITTED ──► fires intent, returns to IDLE

    Abort signals (any post-IDLE state):
      - gaze leaves target for > gazeAbortLeaveMs (150ms)
      - voice intent "cancel"
      - open_palm gesture (the universal abort)
      - arm timeout (armTimeoutMs, default 800ms)

Parallel rail states (do not pass through HOVERED):
    DICTATING       voice-only intents (scroll, summarize, etc.) — no gaze target needed
    CALIBRATING     engine suspends intent emission
```

The right branch is the **single-signal commit path** for deliberate gestures: HOVERED gives implicit gaze context, but no separate ARMED step is required because the held pinch *is* the deliberation. The left branch is the **two-signal path** for voice, where the noisier modality requires a confirming transcript before committing.

### Latency strategy

The state machine does not block waiting for a second signal. Three optimizations keep perceived latency under ~300ms:

1. **Hover dwell tuned to ~80ms** (anti-flicker only; smoothing handles the noise).
2. **Speculative pre-resolution.** When the voice adapter emits `speechStarted`, the fusion layer pre-resolves the gaze target. By the time the transcript arrives, the target is already chosen.
3. **Single-signal commits for unambiguous gestures.** A held pinch (>250ms) on a clear gaze target is deliberate by definition — it commits without needing a separate confirmation. The strict two-signal rule remains for voice (which is noisier).

### Tunable parameters

All live in a `FusionConfig` object, persisted to `localStorage`, exposed via Settings.

| Parameter | Default | Purpose |
|---|---|---|
| `hoverDwellMs` | 80 | Time gaze must settle before HOVERED |
| `armTimeoutMs` | 800 | Window for second signal before ARMED → IDLE |
| `commitPinchMs` | 250 | Held pinch duration to count as deliberate |
| `gazeConfidenceMin` | 0.6 | Reject gaze readings below this |
| `gazeAbortLeaveMs` | 150 | Time off-target before abort |

### Behavior table

| User does | Path | Result |
|---|---|---|
| Looks at link, says "open" | IDLE → HOVERED → ARMED → COMMITTED | link opens (~250ms) |
| Looks at link, holds pinch 300ms | IDLE → HOVERED → COMMITTED (single-signal commit) | link opens (~150ms) |
| Says "scroll down" | IDLE → DICTATING → IDLE | page scrolls (~200ms) |
| Glances at sidebar accidentally | HOVERED → IDLE (abort) | nothing |
| Says "open" looking nowhere | DICTATING with no target → IDLE | nothing |
| Looks at link, says "open", looks away during arm | ARMED → IDLE (abort) | nothing |

## 4. Perception adapters

All three adapters implement the same interface:

```ts
interface PerceptionAdapter<TReading> {
  start(stream: MediaStream): Promise<void>;
  stop(): void;
  on(event: 'reading' | 'error', cb: Function): void;
  status: 'idle' | 'starting' | 'running' | 'error';
}
```

### Gaze — `WebGazerGazeAdapter`

- **Library:** WebGazer.js + custom 1€ filter on top.
- **Pipeline:** raw coords → 1€ low-lag low-pass filter → fixation detector → reading.
- **Reading:** `{ x, y, confidence, fixated, ts }`.
- **Calibration:** 9-point dot-tracking on first run; result persisted to `localStorage`. Re-calibration via voice ("calibrate") or settings.
- **Failure modes:** low-confidence readings (`< 0.6`) are dropped by fusion, not surfaced to the user as errors.

### Hand — `MediaPipeHandAdapter`

- **Library:** MediaPipe Tasks Vision (`HandLandmarker`).
- **Gesture set (v1):** `pinch` (thumb-tip + index-tip distance below threshold), `open_palm` (all fingers extended; used as universal "cancel"), `none`.
- **Reading:** `{ gesture, held_ms, confidence, ts }`.
- **Classifier:** rule-based on landmark positions, ~50 lines. ML deferred — not warranted for two gestures.

### Voice — `WhisperVoiceAdapter`

- **Library:** `@xenova/transformers` running `whisper-tiny.en` in-browser via WebAssembly (WebGPU when available). Web Speech API as fallback.
- **Pipeline:** mic stream → energy-based VAD → on speech-end, transcribe last chunk → keyword/regex intent classifier → reading.
- **Special event:** `speechStarted` fires the moment VAD detects speech, used by fusion for gaze pre-resolution.
- **Reading:** `{ transcript, intent: IntentName | null, confidence, ts }`.

### Intent vocabulary (v1, fixed)

```
Targeted:  open, select, close, back
Spatial:   scroll down, scroll up, top, bottom, next, previous
Reader:    summarize, read aloud, stop reading
Meta:      calibrate, cancel, help
```

15 intents total. Resolved by a fuzzy keyword grammar — no LLM in the hot path. The grammar tolerates Whisper transcription errors via per-intent regex with synonym lists.

### Explicitly out of scope for adapters

- Custom-trained models for any modality.
- LLM-based fuzzy intent resolution (e.g., "the article about climate").
- Multi-hand support.
- Head pose, facial expressions, or other face-mesh-derived signals.

## 5. Reader app

### Screens

1. **Library** — grid of 3-5 bundled long-form articles. Cards are large (gaze-friendly).
2. **Reader** — single article, large type, generous line height, scroll progress bar. 90% of demo time happens here.
3. **Calibration** — first-run flow, accessible anytime via "calibrate" voice intent or corner button.
4. **Settings** — modality toggles, fusion timing sliders, debug overlay toggle.

### Affordances designed for fusion input

- **Gaze cursor** — small soft dot at smoothed gaze position. Pulses when fixated, brightens when ARMED. The single most important visual element in the demo.
- **Focused element highlight** — soft outline + subtle scale on HOVERED. ARMED state shows a 200ms progress sweep filling the outline (visible-undo window — look away or say "cancel" to abort).
- **Voice indicator** — bottom-corner mic icon. State: idle → listening → transcribing → recognized. Last transcript shown as 1.5s caption.
- **Hand gesture readout** — small icon showing current gesture in real time. Toggleable; on by default for demos.
- **Auto-scroll zones** — top and bottom 15% of reader pane. Fixate there → smooth scroll.
- **Voice command help** — saying "help" overlays a translucent cheat sheet of all 15 intents.

### Tech stack

- **Framework:** React + Vite.
- **Routing:** React Router (small surface; choice not load-bearing).
- **Styling:** Tailwind.
- **State:** Zustand for app state. Engine has its own internal event-emitter state.
- **Articles:** 3-5 public-domain long-form pieces bundled at build time. No URL ingestion in v1.

### Demo script (the v1 quality bar)

The 60-second flow that must work end-to-end with <300ms perceived latency:

1. Land on Library. Look at "The Death of the Moth" — card highlights. Pinch — opens.
2. In Reader. Look at the bottom of the page — page scrolls smoothly down.
3. Say "summarize." A panel slides in with a live-generated summary.
4. Look at a footnote link — it highlights. Say "open" — link opens in a side panel.
5. Say "back" — return to Library.

## 6. Calibration UX

Designed as a polished onboarding moment, not a clinical setup screen. Total ~30-45s.

1. **9-point gaze calibration** — dots pulse one at a time, ~1.5s each, regressor fit at the end.
2. **Mic check** — "say *calibrate*" — confirms mic permission and Whisper is loaded.
3. **Hand check** — "show me a pinch" — confirms MediaPipe sees a hand.
4. **Fusion sanity check** — "look at the dot, say *go*, pinch" — confirms end-to-end.

Saying "calibrate" anytime re-triggers the flow. Whisper model download (~39MB) starts during onboarding so it's ready when the user finishes calibration.

## 7. Live summarization (the only backend piece)

Live LLM summarization is in scope for v1. The reader's "summarize" intent calls a Cloudflare Worker proxy.

### Why a proxy and not a frontend env var

A `VITE_*` env var is inlined into the JS bundle at build time and is publicly readable from the deployed site. The Worker holds the key as a server-side secret; the browser sends no key.

### Worker spec

- **Platform:** Cloudflare Workers (free tier).
- **Endpoint:** `POST /api/summarize` with `{ text: string }`.
- **Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — cheap, fast, sufficient for summarization.
- **Auth:** none on the public endpoint; rate-limited per IP.
- **Rate limit:** 10 calls / IP / hour, sliding window via Cloudflare KV or Durable Objects.
- **Spend cap:** hard daily cap of $1; once hit, endpoint returns 503 until the next day. Tracked in KV.
- **Secret management:** `wrangler secret put ANTHROPIC_API_KEY`. Never committed.

### BYOK fallback

Settings exposes a "use my own API key" textbox. When set, the frontend stores it in `localStorage` and sends it in a request header to the Worker. The Worker forwards the request to Anthropic using the user-supplied key in place of its own secret, and does not store, log, or persist the key.

## 8. Testing strategy

### Engine — `@input/core` (full coverage)

- **Fusion state machine:** pure-function tests. Scripted reading sequences in, expected state transitions and intent emissions out. Target 100% branch coverage. This is the most important test surface in the project.
- **Intent classifier:** table-driven tests including real-world Whisper transcription error samples.
- **Adapters:** thin wrappers — test the interface contract (status transitions, error emission, cleanup), not library internals. Mock `MediaStream`.
- **Calibration math + 1€ filter:** pure functions, straightforward unit tests.

### Reader — `apps/reader` (light)

- Component tests for non-trivial logic only (gaze cursor smoothing, focus highlight state).
- The actual quality bar is the demo script, run manually before every push to `main`.

### Not tested

- WebGazer / MediaPipe accuracy (treated as a fixed quality the engine tunes around).
- Real-webcam end-to-end in CI.

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Webcam gaze too inaccurate to feel good | High | High | Aggressive 1€ smoothing, generous fixation thresholds, large gaze targets in UI, easy re-calibration. Demo on known-good laptop. |
| Whisper first-load feels slow (~39MB) | Medium | Medium | Show explicit progress during onboarding. Start download in parallel with calibration. |
| Three perception streams melt CPU | Medium | High | Web Worker for perception. Throttle: gaze 30fps, hand 20fps. Use WebGPU for Whisper when available. Profile early; if still hot, drop hand-tracking to "armed-only" mode. |
| Summarize proxy abuse | Medium | Medium | Per-IP rate limit + hard daily spend cap returning 503. |
| Scope sprawl | High | High | This spec is the contract. Anything beyond §11 stretch goals goes in a `BACKLOG.md`. |
| Demo only works on creator's laptop | Medium | High | Test on ≥2 other people's machines (different webcams, different lighting) before declaring v1 done. |

## 10. Project plan (4 weeks)

**Week 1 — Engine foundations**
- Monorepo scaffold (pnpm + turbo).
- `@input/core` skeleton: types, event emitter, `FusionConfig`.
- Fusion state machine with full test coverage *before* any perception.
- Mock perception adapter that scripts readings for state-machine integration tests.

**Week 2 — Real perception**
- WebGazer adapter + 9-point calibration logic.
- MediaPipe hand adapter + pinch / open_palm classifier.
- Whisper adapter via `transformers.js` + intent grammar.
- Each adapter has a standalone development demo page in the engine package.

**Week 3 — Reader app**
- Vite + React + Tailwind scaffold.
- Library + Reader screens with bundled articles.
- Gaze cursor, focus highlights, voice indicator, gesture readout components.
- Wire engine to reader. Run demo script end-to-end. Tune `FusionConfig` defaults.

**Week 4 — Polish + summarization + ship**
- Cloudflare Worker proxy: rate limiting, daily spend cap, BYOK passthrough.
- Live summarize feature + UI panel.
- Cross-machine testing (≥2 other laptops).
- README with architecture overview + embedded demo video.
- Deploy reader to Cloudflare Pages, worker to Cloudflare Workers.

## 11. Stretch goals (v1.1+, only after v1 ships clean)

- **macOS OS-cursor adapter.** Thin Tauri sidecar exposing a local IPC socket; Reader app forwards intents through it to drive the system cursor via Accessibility API. Gated behind a Settings toggle.
- **URL paste + article extraction.** Mercury / Readability-style cleanup, possibly server-side.
- **Additional gestures** — `point` for "show me" affordances if the demo needs them.
- **LLM fuzzy intent resolution** — "open the link about climate" → semantic match against on-page link texts.

## 12. Definition of done for v1

- All 5 steps of the demo script run end-to-end with <300ms perceived latency on the creator's laptop.
- Demo runs end-to-end on at least one other person's machine (different webcam, different lighting).
- `@input/core` README explains the architecture clearly enough that a second app could be built against it.
- Deployed and publicly accessible. Verified that no API key appears in the deployed JS bundle.
- 60-90 second demo video embedded in the project README.
