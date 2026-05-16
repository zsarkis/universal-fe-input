# Demo Script

The 60-90 second flow that the project must execute end-to-end without manual mouse/keyboard input.

The framing is **big-target fusion**: gaze provides *region* (which large card am I attending to?) and voice provides *intent* (what action?). Webcam-only gaze on commodity hardware is ~50–150px / 1–3° accurate — the script is designed to work *well* inside that envelope, not to fight it.

## Setup

1. Deploy the worker: see `workers/summarize/DEPLOY.md`.
2. Set `VITE_SUMMARIZE_URL` in `apps/reader/.env` to the worker's URL.
3. Build and serve the reader (`pnpm --filter @apps/reader dev`).
4. Open the deployed URL (or `http://localhost:5173`) in a Chromium-based browser with a working webcam and mic.
5. Click **Start**. Grant camera + mic permissions.
6. Run the 9-point gaze calibration (saying "calibrate" or by visiting `/calibrate`).

## The script

1. **Land on Library.** The library shows a single column of large article cards (~700×220px). Look at the first card ("The Death of the Moth"). The card outlines and scales up — engine state is `HOVERED`. Gaze accuracy only needs to land *somewhere on the card*, which is trivially within tolerance.
2. **Pinch and hold ~300ms** (or say "open"). Article opens (single-signal commit, ~150ms perceived).
3. **In Reader.** Look at the bottom 15% of the page. Smooth auto-scroll begins. Look back to the middle of the page — scrolling stops. This is a region-level gaze cue, not a target-level one.
4. **Say "next paragraph."** The page steps to the next paragraph. (Useful when auto-scroll is too fast or you want to re-read.) No gaze targeting needed.
5. **Say "bookmark."** A toast confirms; the current scroll position is saved. (Returning to this article later restores the position.)
6. **Say "summarize."** The voice indicator pulses; the summary side panel slides in with a Claude Haiku 4.5 summary (~250ms after the transcript resolves).
7. **Say "back."** Returns to Library.

Everything in this script is either a big-card gaze action, a region-level gaze cue, or a pure-voice intent. There are no precise-link targets.

## Acceptance criteria for v1

- All seven steps execute end-to-end without manual mouse/keyboard fallback.
- Steps respond in under ~300ms perceived latency on the creator's laptop.
- The same script runs end-to-end on at least one other machine (different webcam, different lighting).
- Worker logs (`wrangler tail`) show no rate-limit or spend-cap rejections during a normal demo run.

## Cross-machine testing

Borrow at least one other laptop. Open the deployed reader URL. Run the full script. Note any failures:

- **Gaze drift / inaccuracy:** because the script only uses big-card gaze and region-level scroll affordances, drift up to ~150px should be fully tolerable. If a card hover misses, re-calibrate. If it still misses, that's a regression worth filing.
- **Whisper first-load delay:** the model is ~39MB. The first invocation in a fresh browser session pays this cost; subsequent sessions cache it.
- **Hand detection lighting issues:** MediaPipe degrades in low light or with deeply shadowed hands. Note the lighting condition. (Pinch is optional — every commit in this script also has a voice path.)

Capture failures in `BACKLOG.md` (create it as needed) — the goal of cross-machine testing is to surface these for v1.1.

## Recording the demo video

Use a screen recorder that also captures the webcam (e.g., Loom, OBS, QuickTime + Cleanshot). Frame the screen capture; the webcam feed isn't needed (it's about the on-screen behavior, not the user's face).

Target 60-90 seconds covering:

- 5 seconds: Library lands, gaze cursor visible on a big card.
- 5 seconds: hover a card via gaze, pinch (or say "open") to open.
- 10 seconds: scroll-region demonstration + "next paragraph."
- 5 seconds: "bookmark" with toast confirmation.
- 15 seconds: "summarize" with side panel reveal.
- 5 seconds: "back" returns to library.
- Optional: a quick Settings flyby showing modality toggles.

Upload to YouTube unlisted or Loom. Embed link in the top-level `README.md` under the "Demo" section.

## What this demo is *not* showing

This is deliberate. The story is the multimodal fusion architecture, not precise gaze targeting:

- **Precise link clicking** (footnotes, inline links, small buttons). Webcam-only gaze cannot hit a 20px link reliably. Use the keyboard for that, or wait on issue #2.
- **Sub-150px gaze targets** anywhere in the UI. The Library has been deliberately moved to a 1-column big-card grid; the Reader has no in-prose link targets.

The fusion engine itself (state machine, perception adapters, intent grammar, 88+ tests) is the centerpiece; the UX is calibrated to demo that engine working well, not to demo around the limits of webcam gaze.
