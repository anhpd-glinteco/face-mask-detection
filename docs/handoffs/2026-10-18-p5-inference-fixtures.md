# P5 foundation — 18/10/2026, Asia/Saigon

## Status

Adapter/readiness foundation verified with synthetic fixtures. This is not
completed real-model integration: keep #10 open. No P4 checkpoint or dataset
media was loaded; no deployment, publication, retraining or split changes.
Rights/scene verification (#2/#3) and `p3_ready=false` are unchanged.

Branch: `codex/p5-inference-fixtures`, base `codex/internal-evaluation` at
`541112216771931b4c46b5ea85591d7ab78dd3f6` (PR #32). Keep this PR stacked on
#32 until the parent chain merges; do not merge automatically.
Implementation commit: `2283cfc`; [PR #33](https://github.com/anhpd-glinteco/face-mask-detection/pull/33).

## Changes

Service-local SSDLite CPU adapter verifies checkpoint SHA-256, config digest,
architecture/class map, finite state and strict loading; no pretrained download.
FastAPI lifespan loads once per process and releases its reference on shutdown.
Missing/bad model: health 200, ready and valid-image detection 503. Inference/output
failures: safe 500. Existing invalid-upload status codes remain unchanged.

Response schema 1.0 is unchanged. Model version is checkpoint SHA-256. RGB float
CHW preprocessing, original-image coordinates, real stage timings, score floor
0.001/NMS 0.55/top-k 300/max 100; no operating threshold 0.15. Background is not
returned; class IDs 1–3 retain the P3 mapping. Zero-area boxes are discarded;
invalid predictions are rejected. No media/path/checkpoint logging added.

Reached callers/tests/config: API endpoints, new detector module, API/adapter
tests, shared JSON Schema validation, frontend 503 mapping and retry UI tests,
requirements, environment example, README and handoff index. Existing CI and
Docker both install the updated inference requirements; no new CI job is needed.

## Verification

Local Python 3.12.14, Torch 2.9.0+cpu, TorchVision 0.24.0+cpu; isolated venv
`D:\Codex\work\face-mask-detection\p5-venv`. Synthetic temporary checkpoint is
under `D:\Codex\work\face-mask-detection\p5-pytest-temp`; no weights are committed.

| Check | Result | Limit |
|---|---|---|
| `python -m pytest tests -v` from service, PYTHONPATH=., basetemp on D | 24 passed, exit 0 | One upstream Starlette/httpx deprecation warning |
| Real Torch random-state load + forward, two image sizes | Pass | Plumbing only, no quality claims |
| Corrupt/missing/checksum/metadata/state/NaN rejection; lifecycle/cache; schema; output bounds | Pass | Synthetic fixtures only |
| `npm test -- --maxWorkers=1` | 20 passed, exit 0 | Includes retry UI for 503 |
| `npm run typecheck`, `npm run lint`, `npm run build` | All exit 0 | Build uses current local environment |
| `git diff --check`, `docker compose config --quiet` | Exit 0 | Static checks |
| Docker runtime smoke | Not run | Docker daemon unavailable (named pipe absent) |

Evidence directory: `D:\Codex\outputs\face-mask-detection\p5-inference-fixtures`;
`inference-tests.log` records the full Python run. PR and remote CI results are
recorded there after push. No service performance benchmark was run.

## Next / rollback

Review the stacked PR, run Docker smoke when the daemon is available, then
choose the approved model/data path before real-weight integration. Do not close
#6/#10 solely from these fixtures. Follow `services/inference/README.md` for
MODEL_PATH/MODEL_SHA256; process restart is required to reload weights.

Intentional compatibility change: deployments without weights no longer report
ready or return empty successful detections. Frontend shows its existing retryable
service error. Revert this PR to restore the prior stub; leave all existing data,
weights and evidence intact.
