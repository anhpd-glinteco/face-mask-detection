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

