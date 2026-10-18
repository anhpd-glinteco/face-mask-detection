# P7 video fixtures — 18/10/2026, Asia/Saigon

## Status

Local-video frontend and serial sampling implemented on `codex/p7-video-fixtures`,
based on P6 commit `c297e26`. P6 PR #34 and P5 PR #33 are unchanged. Issues #15
and #17 are completed and closed with evidence links in their comments; PR #35
is open and targets `codex/p6-image-fixtures`. Commit `6159a26` contains the
implementation and handoff. Webcam is P8 and remains disabled. Issue #18 stays
open for per-frame statistics, webcam and its full smoke coverage.

User approved the plan with “oke” in this chat. Plan artifact:
`D:\Codex\outputs\face-mask-detection\p7-video-fixtures\plan.json`, SHA256
`d90772ec8e76590698a66695bc1bcafce4b3ab97b282f3ca7c1847d36f8107c2`.
Mode: change; target 18/10/2026; initial estimate 1–3 hours. Sources: P7 in plan,
UC02, ADR 0001, P6 handoff. No Figma, redesign or public-launch gate.

## Changes and compatibility

- Video mode accepts a nonempty browser-supported `video/*` file and uses native
  play/pause/seek controls. Only captured JPEG frames reach the existing detect
  API; the original video stays local. Unsupported/corrupt media reports an error.
- The sampler holds one busy lock through capture encoding and request settlement.
  After settlement it waits 200 ms before the next frame; there is no queue.
  Pause, seek, end, source/mode change and unmount abort/invalidate old work.
  Restart cannot bypass the lock while old encoding/API work is unsettled.
- Results render on a separate captured snapshot with video timestamp and the
  existing numbered Canvas/list. Counts belong only to that frame. Dimension
  mismatch is rejected. No boxes are painted on a later live frame.
- Capture is capped at 20 MP for browser memory; JPEG payloads keep the existing
  10 MiB limit. This is a local capture cap, not a claim about server pixel limits.
  No transcoding is provided; codec/rotation behavior follows browser decoding.
- Errors stop sampling, retain the readable error and require explicit retry.
  The image API error mapping is moved unchanged into a shared helper. Image
  requests are also aborted/invalidated on mode switch. Source/snapshot URLs are
  revoked on replacement, deactivation and unmount.
- Reached: page/mode navigation, image preview replace-button label, new video
  workspace/sampler, shared error helper, CSS and tests. Public API/schema 1.0,
  backend, dependencies, CI and ML/data artifacts are unchanged.

## Verification

Commands run from `apps/web`; all final checks exited 0. Evidence directory:
`D:\Codex\outputs\face-mask-detection\p7-video-fixtures`.

| Gate | Status | Evidence / limitation |
|---|---|---|
| Baseline Vitest | PASS | 48 tests before changes; Video was disabled |
| Final Vitest | PASS | 64 tests, `vitest-final.log`; mocked decode/Canvas/API |
| Typecheck / lint / production build | PASS | `typecheck-final.log`, `lint-final.log`, `build-final.log` |
| Production Chromium | PASS | 10 checks, `browser-final.json`, script and screenshots |
| Geometry / responsive / text results | PASS | Landscape/portrait at 1440×1000 and 390×844, DPR1; all image/Canvas deltas 0 CSS px; no horizontal overflow |
| Real timeout / explicit retry | PASS | 30-second stalled response while video plays at 0.1×; no automatic retry; recovery succeeds |
| Privacy / security changed-scope review | PASS | Multipart contains JPEG frame only; no full-video upload, persistence, payload logs, secret or new dependency |
| React Doctor | PASS diagnostic | 8 changed files; two URL warnings reviewed as false positives: ref-backed URLs are revoked in lifecycle paths and tests cover them |
| Independent review | BLOCKED | Standard tier cannot be confirmed; available agent tier is priority; no agent dispatched |
| Figma / SEO / deployment | NOT_APPLICABLE | Internal change, no launch or design-authority task |

Unit checks cover pending encoding, rapid stop/start, stale success/error,
pause/seek/end/replacement/mode/unmount, timer/URL cleanup, 503/timeout retry,
capture failure, dimension mismatch, capture limits and image-mode regression.
Browser checks also confirm repeated sampling, delayed-response backpressure,
corrupt video, mode cleanup, actual JPEG requests and zero JavaScript errors.
The browser emits the pre-existing missing-favicon 404; it is not a JS error.

Initial lint failed on ref initialization/render and synchronous state resets in
an effect. Repair moves sampler setup to mount effect and resets state only on
active-prop transition; final lint passes. A later test used Playwright's `exact`
option in Testing Library; corrected before final typecheck/build. First lint
and typecheck failures remain in evidence. Browser harness initially measured
before Canvas resize; it now waits for decode/layout. Its mismatch fixture also
had out-of-bounds boxes and was correctly rejected by the API client first;
the fixture now uses empty detections to isolate dimensions. Retained failure:
`browser-failure-before-harness-fix.json`. Product behavior was not weakened.

## Next / limitations / rollback

- Obtain independent review before merge. P8 can reuse the sampler for webcam;
  processed FPS/latency presentation and real 60-second benchmarks remain ahead.
- No real weights/model, API process, camera, Docker, Firefox/WebKit, rotated
  video fixture, DPR2 video run, deployment or remote CI was checked here.
- P2 rights/scene flags, `p3_ready=false`, internal weights and splits are unchanged.
  Fixture checks do not establish model quality or deployment permission.
- Existing global font resolves to Times New Roman in this browser (font variable
  is on body, root font declaration references it); outside this video task.
- Frontend-workflow adapter init was dry-run only: it proposed unrelated role/config
  files. Existing repo adapter/config was left untouched; task state is in the
  evidence directory, following the previous P6 artifact convention.
- Parent performed all work inline; initial/repair/diagnostic counts 1/1/0.
  Self-review completed; independent review remains blocked. Source/evidence
  fingerprints and producer `/root` are recorded in `evidence-results.json`.
- PR #35 CI is running. No merge/deploy. Real-model and independent review
  evidence remain outstanding.
- Roll back only this session's web/docs diff. Preserve P6 changes, dataset,
  weights and evidence. Source remains at its original D: repository path.
