# P10 — internal local benchmark — 19/10/2026

Deployment gate: **CLOSED**. Performance on synthetic media cannot override P4's
low accuracy, unverified image rights or unresolved source/scene grouping. This is
an internal engineering measurement, not approval to publish weights or deploy.

## Method and environment

Use the [runner and commands](../scripts/benchmark/README.md). Windows 11,
Intel Core i5-13500H (12 cores / 16 logical processors), 16,794,722,304 bytes RAM;
CPU inference with two Torch threads. Existing Python 3.12 environment, Torch
2.9.0+cpu / TorchVision 0.24.0+cpu. Package versions, commit and invocation are
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
