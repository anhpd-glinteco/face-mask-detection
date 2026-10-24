# Docker local acceptance — 24/10/2026

Issue #45; branch `fix/docker-local-acceptance`, base `feat/detection-uncertainty`
at `a341b6b`. Evidence: `D:\Codex\outputs\face-mask-detection\docker-local-acceptance-2026-10-24`.

## Results

- Docker CLI 29.5.3, Compose v5.1.4; Desktop startup log identifies 4.79.0.
- Started Docker Desktop normally (hidden launch), without elevation. Fresh log at
  08:45:48 UTC reproduces startup failure in inference-manager before Linux engine.
- `docker info`: TIMEOUT after 20 seconds; client process terminated, engine not verified.
- `dockerInference` is a zero-length reparse point. `fsutil reparsepoint query`
  returns error 1920. Attempt to rename only that socket to a dated stale name
  also fails with “The file cannot be accessed by the system”; no rename occurred.
- Settings copied before diagnosis; no settings changed. No reset, storage deletion,
  distro unregister, Docker upgrade, elevation or WSL shutdown attempted.
- WSL docker-desktop and bank-th4 were Stopped. Ports 3000/8000 had no listeners
  at preflight. No Compose containers were created, so no teardown was necessary.
- `docker compose -p fmd-acceptance-20261024 config --quiet`: exit 0 (static only).
- Python AF_UNIX control check was inconclusive: installed Python has no AF_UNIX
  attribute; it failed before creating a socket. This does not establish an OS-wide fault.

## Gates and next step

#45 remains OPEN/BLOCKED. Compose build/startup, HTTP health/readiness/detect and
`E2E_COMPOSE=1` browser smoke are NOT_RUN, blocked by engine startup. CI is separate
Linux-hosted evidence and cannot replace local Windows acceptance.

Do not delete the socket or reset Docker to try fixes. Next diagnostic step is
Docker support review of fresh startup/error/reparse logs; any proposed elevated
repair, reboot or destructive action requires a concrete proposal and approval.
Existing upstream reports describe similar errors, but do not establish this
machine's root cause:
https://github.com/docker/desktop-feedback/issues/531
https://github.com/docker/desktop-feedback/issues/625

No product/API/config/test changes; existing Compose and browser smoke need no
modification until the engine runs. #24/#25 retain local container gaps. #43 camera,
#44 model quality and #2/#3 data rights/grouping remain open. Deployment gate CLOSED.

## Session wrap-up

Task-only documentation committed and pushed; draft PR targets the immediate
predecessor. Final remote/CI/issue states and checksums are saved in the evidence
folder. Main worktree's existing AGENTS.md modification remains untouched.

Draft PR: https://github.com/anhpd-glinteco/face-mask-detection/pull/51. Issues #45/#24/#25 updated with fresh evidence; remain OPEN. CI is checked separately at final HEAD in final-state.json; local runtime remains BLOCKED regardless of CI.

## Manual-start retest — supersedes runtime BLOCKED above

User manually opened Docker Desktop and requested a retest. `docker info` now
exits 0: Linux engine reachable, 7.576 GiB memory. No host configuration or socket
repair was performed. This proves recovery for this session; it does not establish
why manual startup succeeded or prove automatic startup is reliable.

- `docker compose -p fmd-acceptance-20261024 up --build --wait --wait-timeout 120`:
  exit 0; both services built and healthy. Dependencies downloaded into Docker's
  existing storage on C; source and evidence remain on D.
- Existing `E2E_COMPOSE=1 npm run test:e2e`: 1 test PASS, exit 0. Real browser calls
  container API without route interception: web/health 200, ready/detect 503;
  trusted/untrusted CORS checks and missing-model alert PASS.
- Separate browser capture reused uploadImage; inspected `missing-model-ui.png`:
  readable error and retry control, no clipping at 1440x1000. Synthetic no-face PNG.
- Collected runtime logs/state; `docker compose ... down` exit 0; task containers
  and network removed. Images/cache preserved, Docker Desktop left running.
- npm ci exit 0. Container npm reported 4 vulnerabilities (2 moderate, 1 high,
  1 critical); no remediation or exploitability assessment in this task.

Runtime acceptance is now PASS for the default missing-model configuration.
Keep #45 OPEN for unresolved/reproducible startup failure and durable recovery;
#24/#25 retain their other acceptance gaps. Model-loaded containers, real camera,
model quality and hosted deployment are NOT_RUN; deployment gate CLOSED.
Receipts: manual-start-docker-info*.log, compose-startup.log, compose-runtime.log,
compose-state.json, browser-smoke.log, playwright-report, missing-model-ui.png,
compose-teardown.log. Prior failure logs retained as history.
