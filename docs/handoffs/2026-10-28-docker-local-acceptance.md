# Docker local acceptance — 28/10/2026

Issue #45; branch `fix/docker-local-acceptance`; draft PR #51 targets `feat/detection-uncertainty`.
Evidence: `D:\Codex\outputs\face-mask-detection\docker-local-acceptance-2026-10-28`.

## Results

- Before launch: no Docker processes observed; WSL docker-desktop and bank-th4 Stopped. No listeners observed on 3000/8000. Initial CLI connection failed because dockerDesktopLinuxEngine pipe was absent. This alone did not identify a startup fault.
- Normal non-elevated hidden launch of Docker Desktop reproduced the fault. Fresh backend log at 2026-10-28 11:43:10 UTC (18:43:10 Asia/Saigon) reports: `initializing Inference manager ... dockerInference ... The file cannot be accessed by the system` and invalid filename syntax, followed by backend crash.
- Docker Desktop 4.79.0; CLI 29.5.3; Compose v5.1.4. `docker info` timed out at 20 seconds; only that CLI probe was terminated.
- dockerInference is a zero-length reparse point; read-only `fsutil reparsepoint query` returns error 1920. No socket rename/deletion or settings change attempted.
- `docker compose -p fmd-acceptance-20261028 config --quiet`: PASS, exit 0 (static validation only).
- Compose build/startup, HTTP checks and browser smoke: NOT_RUN/BLOCKED by unavailable engine. No task containers/network were created; no teardown required. The 24/10 default missing-model container PASS remains historical evidence, not a PASS for this run.

## Diagnosis and next action

Failure is localized to Desktop host inference-manager socket initialization before Linux engine availability. The underlying reason Windows rejects this reparse point remains unproven; do not infer corrupt storage or a model/application defect.

Official Docker guidance: https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/ and https://docs.docker.com/reference/cli/docker/desktop/diagnose/ . Local `docker desktop diagnose` was invoked without `--upload`; its result is recorded below. Diagnostics can use Docker-managed temporary storage on C; task evidence is on D.

Next safe step: review local diagnostics with Docker support guidance and propose a specific repair before any elevated operation, reboot, socket deletion, reset or distro/storage changes. Do not upload diagnostics without authorization. No verified durable repair is currently available from this investigation.

## Scope and gates

No product/API/dependency/test changes. No reset, reboot, elevation, WSL shutdown, distro unregister, Docker upgrade or storage deletion. Model-loaded containers, camera, model quality and hosted deployment NOT_RUN; deployment gate CLOSED. Keep #45/#24/#25 OPEN. Preserve unrelated main-worktree AGENTS.md changes.

## Local diagnostics outcome

Local diagnostics produced no stdout/stderr or bundle path after 116 seconds; CLI terminated. No upload requested; collection completeness unverified.

