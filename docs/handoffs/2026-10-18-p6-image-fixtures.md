# P6 image fixtures — 18/10/2026, Asia/Saigon

## Status

Image frontend implementation and fixture checks pass. Issues #12 (overlay)
and #13 (image errors/empty results) meet their issue DoD using combined frontend
and backend unit coverage; these are marked for closure with this PR. Full
frontend/backend integration remains open in #10, #11 and #14. No checkpoint/media was loaded, no deployment/publication, no changes to
P2 rights/scene flags, `p3_ready=false`, dataset splits or training.

Branch: `codex/p6-image-fixtures`, base `e3dfcc8` on
`codex/p5-inference-fixtures` ([parent PR #33](https://github.com/anhpd-glinteco/face-mask-detection/pull/33)).
Changes are local and uncommitted; no P6 PR/push/merge or issue changes made.
Inputs: plan, P5 handoff, requirements/use cases, current frontend/client/tests
and contract. User explicitly chose P6 fixtures and approved implementation.

## Changes and compatibility

- `ImagePreview` draws numbered labels/confidence and original-pixel boxes on
  Canvas, sized to the actual image rectangle. ResizeObserver/window resize
  redraw at device pixel ratio; image letterboxing does not offset boxes.
  Edge labels stay inside the image. Empty results do not mount Canvas.
- The existing result list remains accessible and uses the same labels/numbers.
  Model name/version come from the validated response; no hardcoded readiness
  claim or production fixture mode. No threshold/`uncertain` behavior added.
- The client rejects non-finite/negative, reversed, zero-area or out-of-bounds
  boxes. Page waits for preview dimensions and rejects mismatches before showing
  results. Corrupt preview aborts work and clears detections; replace is offered.
- A 30-second abort deadline covers fetch and body JSON, with timer/listener
  cleanup. Caller cancellation propagates; replacing/unmounting invalidates old
  requests. Timeout and 503 have separate retryable messages; no empty-success
  fallback. Retry also clears previous results.
- Reached: page, preview/result components, shared label map, API client/error
  union, CSS, existing page/client tests and new Canvas tests. Backend, schema
  1.0, CI, config, dependency/lock files are unchanged.

## Verification

Node/npm and exact artifact hashes are in the evidence directory below.
Checks ran from `apps/web`, on Windows; browser checked the production build
with `NEXT_PUBLIC_INFERENCE_API_URL=http://127.0.0.1:8000`, intercepted only in
the test harness. No backend was needed or exercised.

| Command/check | Result | Evidence / limit |
|---|---|---|
| Baseline `npm test -- --maxWorkers=1` | 20 passed, exit 0 | Base implementation; desktop screenshot |
| Final `npm test -- --maxWorkers=1` | 48 passed, exit 0 | `vitest.log`; mocked Canvas/decode/API |
| `npm run typecheck` | PASS, exit 0 | `typecheck.log` |
| `npm run lint` | PASS, exit 0 | `lint.log` |
| `npm run build` | PASS, exit 0 | `build.log` |
| Production browser fixture script | 12 checks PASS | `browser-results.json`, `browser-check.js`, screenshots |
| Extra Chromium DPR2 portrait check | PASS | Backing 634×951 for displayed 317×475.5; screenshot/log |
| Canvas vs image geometry | PASS | Desktop 1440×1000/mobile 390×844, landscape/portrait; each x/y/width/height delta <1 CSS px |
| Real 30-second stalled-request timeout | PASS | Preview retained, alert/retry shown, no Canvas |
| React Doctor, changed scope vs `e3dfcc8` | Diagnostic completed, exit 0 | One page-complexity warning; no behavioral defect established |
| `git diff --check` / security diff review | PASS | No new logs/storage/secrets, HTML injection or dependency |
| Independent review | BLOCKED | Workflow requires confirmed Standard tier; available agent tiers are priority only; no reviewer dispatched |

Coverage includes all three labels, fractional/full-edge boxes, tiny-image text
sizing, empty/multiple detections, invalid responses, dimension mismatch, decode
before/after response, 503/timeout/retry, stale success, late failure on unmount,
deadline during headers/body/combined stages, timer/listener/object URL and
ResizeObserver cleanup. Browser run had zero JavaScript runtime errors.

Evidence: `D:\Codex\outputs\face-mask-detection\p6-image-fixtures`.
`source-sha256.json`, `evidence-results.json` and `artifact-sha256.json` bind
checks/artifacts to source and producer `/root`. The first browser run found
an unnecessary empty Canvas; fixed with a regression test. Another harness run
double-instrumented Canvas on page reuse; corrected with a fresh page/idempotent
instrumentation. A one-off DPR2 snippet syntax error was corrected before the
successful check. Failures are retained in `first-browser-failure.json` and
`harness-history.json`. Initial/repair/diagnostic counts: 1/1/0.

## Next / rollback

- Obtain independent review before merge; runtime fixture checks do not replace it.
- Close #12/#13 with this PR; retain #6/#10/#11/#14 until contract, model and
  end-to-end API evidence reaches their full DoD.
- P5/P6 model integration still requires an approved model/data path. Do not
  reuse P4 weights for deployment or infer model quality from these results.
- P7 can build local video sampling with fixtures: single in-flight request,
  pause/seek/source replacement invalidates old work. Webcam remains P8.
- Docker runtime, real weights/camera, Firefox/WebKit, performance benchmark and
  remote CI were not checked in P6. No package was added for browser testing.
- To repeat browser checks, start the production frontend on port 3101 with the
  build-time URL above, copy `browser-check.js` into the Playwright tool's allowed
  workspace, and invoke `browser_run_code_unsafe` with that filename. The script
  generates face-free PNGs and intercepts responses; it is not a product mode.
- Rollback only this session's frontend/docs changes; preserve all dataset,
  checkpoints and evidence. Source remains in its existing repository location.
