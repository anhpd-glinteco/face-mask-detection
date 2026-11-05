# Detection presentation and retained snapshots — 05/11/2026

Branch fix/detection-presentation starts from frontend feat/detection-uncertainty at a341b6b. Backend, API schema, raw predictions and checkpoint are unchanged. Display threshold remains 0.15, applied before rounding. The candidate model's evaluation threshold 0.25 remains a separate experiment setting.

## Changes

- Central upload area is a native button using the existing input, including Enter/Space activation. The E2E upload helper now exercises a real file chooser.
- Shared visibleDetections logic orders accepted predictions first, followed by weak predictions only when expanded. List numbers and canvas numbers use this same order.
- Primary count describes accepted detections in the frame. All-weak responses show a distinct message. The uncertainty group starts collapsed and controls both rows and boxes.
- Manual webcam Stop releases tracks and aborts sampling while retaining the latest completed snapshot and statistics. Restart clears the old snapshot and URL. Late permission streams and requests are rejected by the existing generation guard.
- Video pause/ended retains the completed snapshot. Seeking, source/mode changes and unmount clear/release it. Existing error behavior is retained.
- Frozen snapshots show the stopped-state heading and original frame timestamp.

## Verification

87 unit tests PASS, plus a targeted 14-test video rerun after strengthening the ended-event assertion. Typecheck and lint PASS. Production Webpack build PASS.

8 browser tests PASS across desktop/mobile. Coverage includes central/lower chooser, Enter/Space, 100 raw predictions with exactly 2 accepted rows/boxes by default and 100 when expanded, aligned overlays, API errors, permission fixtures, stale results, stop/pause and mode-switch cleanup.

Native runtime uses the real epoch-10 COCO fine-tuned checkpoint (7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e) on API 8220, with frontend 3111. Native image/video/physical-webcam rehearsal PASS_WITH_LIMITATIONS. Both streams ran over 60 seconds. Video had 299 successful requests with HTTP p95 175.68 ms; webcam had 220 including restart with p95 204.48 ms. The native harness explicitly asserts that the stopped webcam retains its final snapshot. No camera face media was saved.

Evidence root is D:/Codex/outputs/face-mask-detection/detection-presentation. Browser logs/results, build log and native acceptance JSON are retained there. The reused native harness had a hardcoded old frontend source label; its correction is explicitly recorded as metadata without changing measurements.

The dependency junction requires the local Webpack build. CI retains its configured normal build with installed dependencies.

## Limits and publication

The specific Start-button failure in the Codex embedded browser remains unverified. Standalone Chromium fixtures and physical-camera checks do not establish that embedded-browser issue is resolved. Physical unplug remains NOT_RUN. The user confirmed in this chat after the new rehearsal that the camera LED turned off. The raw automation receipt retains its combined unplug/LED NOT_RUN item; this human observation is recorded separately.

This change filters presentation. It does not provide identity tracking or improve model accuracy. Model/data deployment gate remains CLOSED. Broader regression/device issues remain open.

The source worktree serves http://localhost:3111 with its compiled API URL http://localhost:8220. Reload existing tabs after publication. Draft PR targets feat/detection-uncertainty. Final remote head, CI checks and working-tree state are recorded in the evidence root's final-state.json.
