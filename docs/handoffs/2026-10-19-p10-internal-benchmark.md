# P10 — internal local benchmark — 19/10/2026, Asia/Saigon

## Scope and artifacts

Branch `codex/p10-internal-benchmark`, based on P9 `3d2f0cf`.
Draft [PR #38](https://github.com/anhpd-glinteco/face-mask-detection/pull/38)
targets `codex/p9-integration-fixtures`; no merge or deployment.
The user authorized local benchmarking of the current P4 checkpoint and selected
synthetic webcam input. This does not authorize public weights/media or deployment.

The runner adds five process-cold starts, 100 sequential warm API requests and
production-browser image/video/webcam checks against the actual API. Only webcam
media and local fixture delivery are simulated. Shared JSON Schema and model
checksum validate API responses. Memory includes the Windows Python launcher and
worker tree, not merely the launcher. No product code, model, threshold, API/schema,
dataset, split, new dependency or CI weight download changes.

Evidence: `D:\Codex\outputs\face-mask-detection\p10-internal-benchmark`.
Final run: `run-3`, source commit `c8b7798`, implementation `75407f9`.
Checkpoint remains at its original local P3 path and SHA-256
`1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.
Raw JSON contains numeric detection responses, never uploaded media or weights.
See [report](../benchmark-report.md) and [commands/method](../../scripts/benchmark/README.md).

Final run exits 0 with `complete=true`: cold p95 6,188.84 ms (5/5), warm HTTP
p95 59.48 ms (100/100), zero unexpected errors. Video 299 completions / 60.80 s
(4.92 displayed FPS), synthetic webcam 303 / 60.76 s (4.99 FPS), plus one explicit
stop abort. No page errors. Sampled working-set maxima: API tree 346.47 MiB,
web tree 102.35 MiB; page JS heap 8.55 MiB. All local latency/error budgets pass;
no memory budget or real-model accuracy acceptance is implied.

## Verification

- Benchmark self-checks: 3 unittest tests pass, exit 0; nearest-rank percentiles,
  error denominators, readiness success/timeout/transport error and owned descendants.
- Backend: 24 pytest tests pass, exit 0, 4.92 s; existing Starlette/httpx warning.
- Frontend: 80 tests in 6 files pass, exit 0; typecheck/lint pass. Initial lint
  failed on four CommonJS imports; changed the harness to ES modules.
- Production build passes; per-run build/API/web/browser logs are preserved.
- Tooling CI [39151034422](https://github.com/anhpd-glinteco/face-mask-detection/actions/runs/39151034422):
  web, inference (including new benchmark tests), ML, E2E and Compose all pass.
- Independent review, physical camera, Firefox/WebKit and public HTTPS were not run.

Run 1 overlapped validation. Runs 1/2 only sampled the venv launcher for API memory;
their low memory numbers are invalid for inference. The corrected run sums owned
process-tree working sets and preserves per-PID counters. Both exploratory runs
remain intact; do not substitute their memory into the final report.
Existing Playwright browser binaries remain in the prior C: cache; generated
deliverables are on D:.

## Gate and remaining work

Deployment gate stays **CLOSED** regardless of local performance: low P4 quality,
unverified rights and unresolved scene/source grouping. Keep #2/#3 and
`p3_ready=false` unchanged. No retraining or re-evaluation on test data occurred.
P10 is complete for the selected internal-local scope; public preview and full
deployment acceptance remain outstanding. #20/#22/#23 stay open with evidence
and missing preview/host requirements recorded, rather than claiming their full DoD.

Next: P11 regression/documentation can reuse this evidence; a usable public model
and hosted preview require separate resolution of the data/model/deployment gates.
Rollback only P10 tooling/docs/CI self-check additions, preserving P9 and P4 files.
The runner terminates its owned service processes after completion or failure.

Final session verification (remote branch/head, draft PR/base, all CI jobs, open
issue states, clean working tree and released ports) is saved at the evidence
root as `final-state.json` after the final push. PR #38 remains pending review;
consult that snapshot for the final documentation-head CI rather than treating
the earlier tooling run as evidence for a different commit.
