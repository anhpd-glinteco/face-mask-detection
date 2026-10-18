# P10 local benchmark

Run on Windows from the repository root with the existing inference Python 3.12
environment and installed web dependencies/Playwright Chromium. Ports 8000/3110
must be free. No new dependency or public hosting is required.

```powershell
& D:\Codex\work\face-mask-detection\p5-venv\Scripts\python.exe -m unittest discover -s scripts/benchmark -v
& D:\Codex\work\face-mask-detection\p5-venv\Scripts\python.exe scripts/benchmark/run.py --checkpoint D:\Codex\outputs\face-mask-detection\p3-internal\baseline-v2\checkpoint.pt --sha256 1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74 --output D:\Codex\outputs\face-mask-detection\p10-internal-benchmark\run-2
```

Output must be empty. Failure evidence is preserved; use a new directory for each
rerun. The runner owns and terminates only processes it starts. A checksum mismatch
stops before launching services; model readiness failure stops without a stub.
Production web builds with `http://localhost:8000` as the browser API URL.

Method: five new API processes, measured from immediately before process launch to
the first successful readiness poll (100 ms interval, 60 s deadline, 2 s HTTP timeout).
This includes imports/model loading; it does not clear OS caches or simulate cloud
scale-to-zero. The fifth process receives 100 sequential 320x240 synthetic PNGs;
the first inference is retained. HTTP latency includes response parsing/validation;
server component timings are separate. Throughput uses total elapsed time including
raw-data writing, so it is conservative. No training, threshold tuning or quality
evaluation occurs.

The existing synthetic 320x240 WebM loops for at least 60 seconds per video/webcam
phase. Only getUserMedia is replaced for webcam; detect requests use the real API.
Browser HTTP latency is request-to-requestfinished, excluding capture/rendering.
Sampler statistics record capture-through-API latency and processed/skipped counts.
Snapshot load plus two animation callbacks approximates capture-to-display latency;
it is not physical display latency. Sampling/observation itself adds overhead.
Intentional cancellation on stop is recorded separately from unexpected failures.

Percentiles use nearest rank on successful attempts; error-rate denominators retain
failed attempts. Raw failures/timeouts remain in JSON/logs and aborts are explicit.
Memory samples every second use Windows working/peak working set for each API/web
server PID, excluding descendants. CDP JSHeapUsedSize is page JS heap only, not total
Chromium memory. Memory sampling errors are retained rather than replaced with zero.
Raw browser JSON includes numeric detection responses, never media payloads.

Artifacts: environment/packages, per-process logs, cold/warm requests and summaries,
browser requests/statistics/display samples, memory samples and completion status.
Keep all media/weights local and out of Git. Deployment gate remains CLOSED due to
P4 quality, unverified image rights and unresolved scene grouping; local performance
cannot certify public deployment, physical camera performance or representative data.
