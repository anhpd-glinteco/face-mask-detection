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

