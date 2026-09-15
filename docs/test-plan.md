# Test Plan

- Empty/no-face image; multiple people; occlusion; low light; tilted and small faces.
- Corrupt/unsupported/oversized files; fake MIME; API timeout; unavailable model.
- Low-confidence boundaries and invalid/out-of-bounds boxes.
- Video rotation, seeking, pause/resume and source replacement.
- Webcam permission denial, disconnect and clean track shutdown.
- CORS allowlist, upload limits and absence of media payloads in logs.
- Dataset leakage check by video/source/scene.
- Cold/warm latency, error rate and memory recorded before deployment gate.

