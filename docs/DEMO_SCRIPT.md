# Demo Script

The 60-90 second flow that the project must execute end-to-end without manual mouse/keyboard input.

## Setup

1. Deploy the worker: see `workers/summarize/DEPLOY.md`.
2. Set `VITE_SUMMARIZE_URL` in `apps/reader/.env` to the worker's URL.
3. Build and serve the reader (`pnpm --filter @apps/reader dev`).
4. Open the deployed URL (or `http://localhost:5173`) in a Chromium-based browser with a working webcam and mic.
5. Click **Start**. Grant camera + mic permissions.
6. Run the 9-point gaze calibration (saying "calibrate" or by visiting `/calibrate`).

## The script

1. **Land on Library.** Look at the first article card ("The Death of the Moth"). The card outlines and scales up — engine state is `HOVERED`.
2. **Pinch and hold ~300ms.** Article opens (single-signal commit, ~150ms perceived).
3. **In Reader.** Look at the bottom 15% of the page. Smooth auto-scroll begins.
4. **Say "summarize."** The voice indicator pulses; the summary side panel slides in with a Claude Haiku 4.5 summary (~250ms after the transcript resolves).
5. **Say "back."** Returns to Library.

## Acceptance criteria for v1

- All five steps execute end-to-end without manual mouse/keyboard fallback.
- All steps respond in under ~300ms perceived latency on the creator's laptop.
- The same script runs end-to-end on at least one other machine (different webcam, different lighting).
- Worker logs (`wrangler tail`) show no rate-limit or spend-cap rejections during a normal demo run.

## Cross-machine testing

Borrow at least one other laptop. Open the deployed reader URL. Run the full script. Note any failures:

- **Gaze drift / inaccuracy:** record whether re-calibration helps. Adjust the slider for `gazeAbortLeaveMs` in Settings if needed.
- **Whisper first-load delay:** the model is ~39MB. The first invocation in a fresh browser session pays this cost; subsequent sessions cache it.
- **Hand detection lighting issues:** MediaPipe degrades in low light or with deeply shadowed hands. Note the lighting condition.

Capture failures in `BACKLOG.md` (create it as needed) — the goal of cross-machine testing is to surface these for v1.1.

## Recording the demo video

Use a screen recorder that also captures the webcam (e.g., Loom, OBS, QuickTime + Cleanshot). Frame the screen capture; the webcam feed isn't needed (it's about the on-screen behavior, not the user's face).

Target 60-90 seconds covering:

- 5 seconds: Library lands, gaze cursor visible.
- 5 seconds: hover a card via gaze, pinch-open.
- 10 seconds: auto-scroll demonstration.
- 15 seconds: summarize via voice.
- 5 seconds: "back" returns to library.
- Optional: a quick Settings flyby showing modality toggles.

Upload to YouTube unlisted or Loom. Embed link in the top-level `README.md` under the "Demo" section.
