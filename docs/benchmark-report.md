# P10 — internal local benchmark — 19/10/2026

Deployment gate: **CLOSED**. Performance on synthetic media cannot override P4's
low accuracy, unverified image rights or unresolved source/scene grouping. This is
an internal engineering measurement, not approval to publish weights or deploy.

## Method and environment

Use the [runner and commands](../scripts/benchmark/README.md). Windows 11,
Intel Core i5-13500H (12 cores / 16 logical processors), 16,794,722,304 bytes RAM;
CPU inference with two Torch threads. Existing Python 3.12 environment, Torch
2.9.0+cpu / TorchVision 0.24.0+cpu; local Node 24.19.0 (CI Node 22), Chromium
156.0.8078.4, desktop viewport 1440×1000. Package versions, commit and invocation are
recorded with the raw run. Background desktop processes remain present; this is
not an isolated host or cloud-capacity benchmark.

Checkpoint: existing P4 epoch-30 artifact, SHA-256
`1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.
No training, threshold or API/schema change. No dataset media is used for these
performance requests: 320×240 generated PNG and existing face-free WebM fixture.

Five process-cold starts include imports/model load and readiness polling, without
clearing OS file cache. The fifth process receives 100 sequential requests,
including the first inference. Browser production web uses the actual API for
image upload and at least 60 seconds each of looping video and synthetic webcam.
Only the camera source and local fixture delivery are simulated.

Nearest-rank percentiles use successful attempts; errors retain their denominator
and raw records. Browser HTTP timing excludes capture/display. Sampler latency
includes capture and API. Capture-to-display is an instrumented estimate ending
after snapshot image load and two animation callbacks, not physical display latency.

Memory is sampled every second as summed Windows working sets of the owned
API/web process trees. Shared pages may be counted twice; these are not private
bytes. Per-PID lifetime peaks are also retained. CDP reports page JS heap only,
excluding other Chromium processes. Video loop seeking can reset UI counters;
whole-phase HTTP/display counts determine aggregate FPS, and sampled skip counts
are a lower bound. Stop cancellations are explicit, separate from unexpected errors.

## Final measurement

Run 3 uses tooling commit `c8b7798` (benchmark implementation `75407f9`).
Raw files are under the evidence root's `run-3` directory.

| Measurement | Attempts / successes | p50 | p95 | Result |
|---|---:|---:|---:|---|
| Process-cold readiness | 5 / 5 | 3,565.95 ms | 6,188.84 ms | All ≤ 30 s |
| Warm API HTTP including validation | 100 / 100 | 41.93 ms | 59.48 ms | p95 ≤ 1 s; 0% errors |

Warm elapsed time: 6.5615 seconds; 15.24 successful requests/s including raw-data
writes. Five cold durations: 6,188.84; 3,581.59; 3,555.64; 3,565.95; 3,559.26 ms.
HTTP time and backend preprocess/inference/postprocess timings are distinct in
`warm.json`. One image size/content is not a representative workload distribution.

| Browser flow | Successful / completed | Duration | HTTP p50 / p95 | Displayed FPS | Capture-to-display p50 / p95 |
|---|---:|---:|---:|---:|---:|
| Image | 1 / 1 | Single upload | 40.65 / 40.65 ms | — | Not instrumented |
| Video | 299 / 299 | 60.80 s | 38.56 / 61.23 ms | 4.92 | 74.30 / 101.40 ms |
| Synthetic webcam | 303 / 303 | 60.76 s | 38.40 / 53.47 ms | 4.99 | 73.50 / 92.80 ms |

One additional webcam request was intentionally aborted on stop and remains in
raw data; there were no unexpected request failures or browser page errors.
Both streaming HTTP p95 values meet the 1 s budget on this workload. The image
sample size is only one, so its p95 is not a meaningful distribution estimate.
Display sample counts are 299 / 303. Sampled skipped-opportunity lower bounds are
3 / 0; final UI counters are video 23 processed / 1 skipped and webcam 303 / 0.
Video's final counters cover only the last loop segment.

Backend component p50/p95 over 100 warm requests: preprocess 0.50/0.92 ms,
inference 35.17/49.84 ms, postprocess 0.22/0.40 ms. These exclude HTTP upload/decode.

Across 278 memory records, no sampling errors occurred. Maximum sampled API tree
working set was **346.47 MiB**, web server tree **102.35 MiB**. Maximum sampled
page JS heap was **8.55 MiB**; this does not measure total browser memory. Cold
processes have few samples and 1 s polling can miss short-lived peaks. No memory
budget was defined, so these figures are descriptive rather than a pass/fail gate.

All defined local latency/error budgets pass. **Overall deployment remains blocked.**

## Evidence and decision

Raw evidence root:
`D:\Codex\outputs\face-mask-detection\p10-internal-benchmark`.
Run 1 is exploratory and overlapped local validation. Run 2 predates the memory
correction: both sampled only the Python launcher, so their API memory must not
be used. They remain available for audit; the corrected final run is reported below.

Budget: warm HTTP p95 ≤ 1,000 ms; process-cold readiness ≤ 30,000 ms;
unexpected valid-input error rate ≤ 1%. Successful local performance checks do
not establish generalization, physical-camera readiness or public-host performance.

Public preview HTTPS and deployment/rollback validation on a hosted environment
remain outstanding for #22; #20/#23 retain the missing preview/deployment evidence.
No merge or deployment is performed. Local rollback is to stop benchmark-owned
processes and revert the P10 tooling/docs commits; P4 artifacts and P9 remain intact.
