# Test Plan

- Empty/no-face image; multiple people; occlusion; low light; tilted and small faces.
- Corrupt/unsupported/oversized files; fake MIME; API timeout; unavailable model.
- Low-confidence boundaries and invalid/out-of-bounds boxes.
- Video rotation, seeking, pause/resume and source replacement.
- Webcam permission denial, disconnect and clean track shutdown.
- CORS allowlist, upload limits and absence of media payloads in logs.
- Dataset leakage check by video/source/scene.
- Cold/warm latency, error rate and memory recorded before deployment gate.

P2 data checks: `python -m unittest discover -s ml/tests -v` from repo root.
Covers invalid/out-of-bounds/degenerate bbox, malformed XML, corrupt images,
dimensions, path traversal, class alias, scene CSV validation, exact/conflicting/
near duplicates, transitive grouping, orphan images, split counts and repeatability.
Real dataset audit intentionally exits 2; see `docs/handoffs/2026-10-17-p2.md`.

P2 continuation: raw audit still exits 2; reviewed curated candidate exits 0.
Three additional curation tests cover checksum/bbox mismatch rejection, refusal
to overwrite or write inside source, paired image/XML exclusion, exact bbox
updates, unchanged copies and preservation of source bytes. All 12 ML tests pass.
Real curated verification checks byte-identical repeat manifests, class coverage,
exact/dHash/reviewed-scene grouping, totals reconciled against exclusions, and all
1,706 original source files against both pre/post hashes and the pinned archive.
See `ml/reports/p2-curated-audit.json`; no assertion of complete scene independence
or train/deploy rights follows from technical audit exit 0.

P4 evaluation: known-answer fixtures cover perfect detection, duplicate/false
positives, missing detections, wrong classes, absent ground-truth classes,
IoU=0.5 boundary, 101-point AP, best-unmatched-truth matching, threshold tie rules,
zero-area exclusion, invalid predictions and the 100-detection limit. End-to-end
fixture evaluation removes train/test media during validation and verifies only
the selected split is opened. Test rejects missing/modified decisions and
checkpoint/method identity mismatches before loading data. Corrupt selected media
and runtime mismatches fail. Existing trainer/synthetic/data tests still run.
See [P4 handoff](handoffs/2026-10-18-p4-internal-evaluation.md) for real evaluation
results, test logs and environment limits; these are separate from deployment QA.

P6 image fixtures: `npm test -- --maxWorkers=1` from `apps/web` passes 48 tests.
Client tests reject invalid/degenerate/out-of-bounds/non-finite boxes, accept
fractional/full-edge boxes, distinguish 503 and timeout, enforce one 30-second
deadline through headers/body, forward cancellation and clean timers/listeners.
Page tests wait for decoded dimensions, reject mismatches, handle preview errors,
retry, drop stale results and release requests/object URLs. Canvas tests cover
three numbered labels, original-to-rendered coordinate scaling, resize/DPR2,
portrait/edge labels, one-pixel inputs, empty results and observer cleanup.

Production Chromium fixture checks cover landscape/portrait at 1440×1000 and
390×844 (DPR1), plus portrait at DPR2. Canvas/image geometry deltas are <1 CSS px;
labels stay in bounds. Empty, invalid, dimension mismatch, 503, retry, source
replacement/stale response, real 30-second timeout and corrupt PNG checks pass.
Synthetic PNGs contain no faces; test harness intercepts API calls. Evidence and
reproduction script: `D:\Codex\outputs\face-mask-detection\p6-image-fixtures`.
See [P6 handoff](handoffs/2026-10-18-p6-image-fixtures.md): these checks do not
prove model quality, real API integration, Docker, camera or deployment readiness.

P7 video fixtures: 64 frontend tests pass, including serial capture/request locking,
stale-result suppression across pause/seek/end/replacement/mode/unmount, timer/URL
cleanup, capture limits/failure, 503/timeout retry and image-mode cancellation.
Production Chromium passes 10 checks with synthetic face-free WebM video and
intercepted API responses: landscape/portrait desktop/mobile DPR1 geometry,
timestamp and accessible list, repeated sampling, no backlog during delayed
response, stale pause response, 503/error-stop/retry, dimension mismatch, corrupt
codec, mode cleanup and an actual 30-second timeout/retry. All geometry deltas are
0 CSS px. No full video appears in request multipart; only JPEG frames.
Evidence: `D:\Codex\outputs\face-mask-detection\p7-video-fixtures`.
See [P7 handoff](handoffs/2026-10-18-p7-video-fixtures.md) for reproduction,
failure history and limits. Real model/camera, rotated-video fixtures and
performance benchmarks remain unverified; independent review is blocked.

