# P9 integration fixtures — 18/10/2026, Asia/Saigon

## Status and scope

Branch `codex/p9-integration-fixtures`, based on P8 `eb69899` / PR #36.
The user selected fixture-first P9 and explicitly requested implementation.
No real checkpoint, camera hardware, merge or deployment is included.
Evidence: `D:\Codex\outputs\face-mask-detection\p9-integration-fixtures`.

## Changes

- Repository Playwright runner builds production with the API URL and owns port
  3109; desktop 1440×1000 and mobile 390×844 Chromium DPR1 projects run image,
  video and webcam regression fixtures. Camera uses synthetic video captureStream.
- P8's face-free 320×240 WebM is committed as a fixed fixture; PNG is generated
  in canvas. No dataset or real-camera media is included. Fixture checksum is in
  external `fixture-sha256.txt`.
- Image tests cover overlay/resize, empty results, invalid responses and 503 retry.
  Stream checks cover JPEG-only uploads, no overlapping requests, skipped busy
  opportunities, statistics, camera denial/retry/end/cleanup, stale responses on
  mode switch and video pause. Per-test attachments identify completed scenarios.
- Docker web uses `npm ci`, build-time API ARG/ENV and a web HTTP healthcheck.
  Compose retains inference `/health`, not readiness, as its startup condition.
  Both build contexts exclude local dependencies/cache/env/weights. No runtime
  stub or API/schema change; missing model remains a 503.
- CI adds separate production E2E and Compose smoke jobs with failure traces,
  screenshots/report and startup/state logs; Compose teardown runs on failure.
  Compose test does not intercept API requests: it checks HTTP statuses, CORS and
  an actual browser image upload. Docs include commands and teardown.
- Root `AGENTS.md` now carries this P9 wrap-up behavior forward as the default for
  later implementation sessions in this repository.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Frontend unit | PASS, 80 tests | `unit-final.log` |
| Typecheck / lint | PASS | `typecheck-final.log`, `lint-final.log` |
| Production build + Chromium | PASS, 4 tests / two viewports | `e2e-repair.log`, CI `e2e` artifact |
| Backend | PASS, 24 tests | Python 3.12, p5-venv, `python -m pytest tests -v`; existing Starlette/httpx deprecation warning |
| Compose configuration | PASS | `docker compose config --quiet` |
| Local Docker runtime | BLOCKED | CLI/Compose installed; engine pipe unavailable even after starting Docker Desktop; `compose-build.log` |
| GitHub CI | PASS, all 5 jobs | [Run 39112763957](https://github.com/anhpd-glinteco/face-mask-detection/actions/runs/39112763957), code commit `25734c8`: web, inference, ML, E2E, Compose |
| Compose runtime (CI Linux) | PASS | Both images build and services healthy; web/health 200, ready/detect 503, CORS allow/deny and actual browser upload; teardown passes. `ci-final/compose-results` |
| Independent review | Not performed | No reviewer/subagent dispatched |

Failures retained in `e2e-first.log`, `e2e-second.log`, `e2e-third.log`:
initial `import.meta` under CommonJS runner, browser installation not yet complete,
then ambiguous Next.js route-announcer `role=alert`. Tests now resolve fixture
paths from the documented working directory and filter application alerts by
their error text. No product code change was needed. The final run passes.

Draft [PR #37](https://github.com/anhpd-glinteco/face-mask-detection/pull/37)
targets the P8 branch. Initial CI run `39112546139` on `655f03b` passed web,
inference and ML. Docker build/startup also passed and both containers were
cleaned up after failure. Its Compose smoke exposed use of nonexistent
`request.options`; corrected to `request.fetch` with method OPTIONS.
Desktop stream geometry also sampled a newly replaced snapshot before decode/
ResizeObserver; the test now polls decoded snapshot alignment at the same <1 px
tolerance, without retrying the test or changing product behavior.
The repaired local production E2E run passes all four tests (`e2e-repair.log`).
Failed CI logs, trace/screenshots and Compose startup logs are retained under
external `ci-first-e2e` / `ci-first-compose` and `ci-*-first-failure.log`.

Playwright initially downloaded its managed Chromium/FFmpeg to the default cache
on C: (`C:\Users\ASUS\AppData\Local\ms-playwright`); deliverables remain on D:.
The test README documents `PLAYWRIGHT_BROWSERS_PATH` for future D: installations.

## Remaining work and rollback

#19/#21 completed with checked DoD and links to PR #37 / passing CI. The issue
evidence explicitly distinguishes fixtures/missing-model plumbing from real-model
quality, physical camera and deployment readiness. PR remains a draft for review.
Do not infer trained-model integration or model readiness from fixture/health
checks. Current P4 weights remain unapproved for publication/deployment.
Physical camera, Firefox/WebKit, model quality and 60-second benchmarks are untested.
Next: obtain independent review before merging the PR stack; P10 preview and
benchmarks still require a separate model/deployment decision. Raw CI artifacts,
job metadata and initial-failure evidence are saved externally on D:.
Rollback only the P9 test/CI/Docker/docs changes; preserve P8 and ML artifacts.
