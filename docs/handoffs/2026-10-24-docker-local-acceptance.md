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
