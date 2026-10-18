# P8 webcam fixtures — 18/10/2026, Asia/Saigon

## Status and scope

Implemented in commit `8ff5c36` on `codex/p8-webcam-fixtures`, based on P7 `5904b7b`. PR #36 targets the P7 branch and CI passes `web`, `inference`, and `ml`.
User explicitly requested implementation of the P8 plan, chose fixture-first
verification and counting skipped sampling opportunities. Plan schema 3:
`D:\Codex\outputs\face-mask-detection\p8-webcam-fixtures\plan.json`, SHA256
`ac4c7baf8f7e70927be5eaab17a289d303f916b17223228a2a7bf2b1c616a0cb`.
Mode: change, internal surface; target 18/10/2026, estimate 1–3 hours.
Pushed; [PR #36](https://github.com/anhpd-glinteco/face-mask-detection/pull/36) is open. Issues #16/#18 closed with evidence comments. No merge or deployment.

## Behavior and interfaces

- Webcam opens only after Bắt đầu, with `{video:true,audio:false}`. Dừng,
  source-mode change, unmount, track end and capture/API errors abort sampling,
  stop all tracks, clear `srcObject` and revoke snapshot URLs. Permission streams
  arriving after cancellation are stopped without attaching to the UI.
- Secure-context/support, permission/security, missing camera and busy/read
  errors are readable; recovery requires an explicit start. Muted inline preview
  is not mirrored. The numbered overlay/list belongs to a separate analyzed
  snapshot, with timestamp and counts for that frame only.
- Video and webcam use `captureFrame`: original decoded dimensions, JPEG,
  20 MP local capture cap, existing 10 MiB limit, signal cancellation and response
  dimension checks. API/schema 1.0, backend, dependencies and ML artifacts unchanged.
- Sampler targets one opportunity every 200 ms, plus immediate initial capture.
  Capture/encoding/request share one busy lock; cancellation does not release it
  until settlement. Busy opportunities are skipped, not queued. Old generations
  cannot publish a result or increment processed counts.
- Internal `FrameStatistics`/optional `onStatistics` report processed count,
  skipped opportunities, processed FPS and last capture-through-response latency.
  FPS uses `performance.now()` and successful count / current run elapsed time.
  Stop/error freezes values; restart resets the run. Source replacement resets
  video counters. Skipped opportunities are explicitly not lost camera frames;
  latency is not backend inference time, and short-run FPS is not a benchmark.
- Reached page navigation, video workspace, shared capture/sampler/statistics,
  new webcam workspace, their tests and requirement/test/handoff documentation.

## Verification

Evidence: `D:\Codex\outputs\face-mask-detection\p8-webcam-fixtures`.
Commands run in `apps/web` unless stated otherwise.

| Gate | Status | Evidence |
|---|---|---|
| Baseline | PASS | 64/64 tests on clean P7 base; webcam disabled |
| Vitest | PASS | 80/80, `vitest-final.log`; 16 added tests |
| Typecheck / lint / production build | PASS | `typecheck-final.log`, `lint-final.log`, `build-final.log` |
| Production Chromium | PASS | 9 checks, `browser-final.json`, `browser-check.js`, two screenshots |
| GitHub CI | PASS | PR #36, commit `8ff5c36`: `web`, `inference`, `ml` |
| Responsive / overlay | PASS | 1440×1000 and 390×844, DPR1; deltas 0 CSS px, no overflow or mirroring |
| Privacy / affected-scope self-review | PASS | No audio/storage/logging/new dependency; captured JPEG payloads, abort/track/URL cleanup reviewed and tested |
| React Doctor | PASS diagnostic | 9 files including untracked; one URL warning classified false positive, see below |
| Independent review | BLOCKED | Runtime exposes priority agent tiers; Standard cannot be confirmed; no agent dispatched |
| Figma / SEO / deployment | NOT_APPLICABLE | Internal functional change; no design authority or launch |

Unit coverage includes permission errors/retry, unavailable/insecure camera,
late permission streams after stop/unmount, live track end, video/play errors,
camera API failure, abort and stale result cleanup. Existing video capture,
dimension/size/cancel/timeout tests exercise the extracted helper. Fake-clock
sampler tests check exact busy-opportunity count, latency, FPS, freeze/reset,
restart lock and stale success/error behavior.

Browser checks cover image regression; repeated webcam JPEG sampling on both
viewports; stop and frozen statistics; denied permission/retry; track end;
503 cleanup/retry; delayed API with skipped opportunities and no overlap;
mode-switch stale response rejection; local-video statistics; camera→image
cleanup. Fifteen API fixture requests, zero JavaScript errors. The fake
getUserMedia implementation returns a real MediaStream from face-free synthetic
WebM via `HTMLVideoElement.captureStream`; permission errors are injected.
This does not test the operating system camera permission prompt.

Production reproduction requires build-time `NEXT_PUBLIC_INFERENCE_API_URL`:
`$env:NEXT_PUBLIC_INFERENCE_API_URL='http://localhost:8000'; npm run build`,
then `npm run start -- --port 3104`. The Playwright script intercepts that API;
no inference server is needed. Tool file access required a temporary copy of
script/media/screenshots inside repo `.playwright-mcp/p8`; final evidence is on
D: at the path above and the temporary directory was removed. For another run,
copy fixtures/script into the tool's allowed root and adjust its two paths.

## Failures, review and next step

- First tests: five failures because `DOMException` from the test realm was not
  recognized by `instanceof Error`; fixed by reading the checked object's `name`.
  Typecheck found three unsupported Testing Library `exact` options; removed.
  First failures retained. One repair cycle used; final tests/types/build pass.
- An initial repair command used repo-relative paths from `apps/web`, so wrote
  nothing; corrected from repo root. No unrelated file edits resulted.
- First browser run lacked build-time API URL: zero requests and a readable API
  error. Rebuilt with explicit fixture API URL; the same browser assertions pass.
  `browser-first-failure.json/png` preserve that environment failure.
- React Doctor initially scanned tracked changes only. Final run adds
  `--include-untracked`; URL warning at WebcamWorkspace's `createObjectURL` is a
  false positive: previous URLs are revoked in onResult and the current URL in
  shared release, including stop/error/unmount. Unit and browser cleanup prove it.
- Adapter sync was dry-run only: missing profile/contract would create unrelated
  adapter state. No intended contract or role/config files changed. Evidence and
  scratchpad follow P6/P7's external artifact convention.
- Producer `/root`, inline work; initial/repair/diagnostic counters 1/1/0.
  Self-review is not independent review. Source and evidence hashes are recorded
  separately; obtain independent review before merging.
- Next: review P8, then P9 integration/Compose/E2E gaps. No physical camera,
  real model, 60-second benchmark, Firefox/WebKit, DPR2, Docker, CI or deployment
  verified here. Internal weights remain unapproved for publication/deployment.
- Rollback only P8 web/docs changes; preserve P7, data, weights and evidence.
