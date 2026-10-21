# Issue #42 — detection uncertainty, 21/10/2026

Branch `feat/detection-uncertainty` starts from `fix/dependency-security` at
`f7ee61a`; worktree `D:\Codex\work\face-mask-detection\issue-42-uncertainty`.
Draft PR targets its immediate predecessor. No merge/deploy; gate **CLOSED**.

## Behavior

One presentation helper compares raw confidence with P4 validation threshold
0.15 before rounding. Below it: keep detection, predicted class and score, show
“Chưa chắc chắn”, purple dashed bbox and list border. At/above it: normal class
presentation. Image/video/webcam share list and overlay components. Total,
meets-threshold and uncertain counts apply to the current image/analysed frame;
FPS/latency remain unchanged. No fourth class, API filter or schema change.
Backend score floor remains 0.001. No checkpoint/data/test-set tuning changes.

## Verification

- RED: three list tests and one overlay test failed for missing uncertainty/counts
  before implementation; logs retained.
- GREEN: 85 frontend tests / 7 files; typecheck and lint PASS, exit 0.
- Boundary .1499/.15/.1501, all-low, mixed three-class and empty cases covered;
  .1499 remains uncertain despite displaying 15%. Overlay redraw/reset covered.
- Production builds and four Chromium desktop/mobile fixture tests PASS; image,
  video and synthetic webcam check uncertainty/counts plus existing media cleanup,
  stale response, backpressure and error behavior.
- Two browser synthetic-image → real API/checkpoint tests PASS, including per-row
  uncertainty policy, schema/checksum/bbox/labels and resized overlay.
- API boundary 413/415/422/schema/checksum PASS; native missing-model smoke PASS.
  The test project named “compose” here uses native processes, not containers.
- Desktop/mobile image and synthetic-webcam screenshots visually inspected.
  Dense overlapping boxes can overlap canvas text; the full list remains readable.

Evidence/command receipts/reproduction driver:
`D:\Codex\outputs\face-mask-detection\issue-42-uncertainty`.
Checkpoint SHA-256:
`1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74`.
Reproduce: `npm ci`, `npm test`, `npm run typecheck`, `npm run lint` in `apps/web`;
run the evidence `acceptance_driver.py web` and `integration` using the existing
`product-acceptance-venv/Scripts/python.exe`. Driver pins paths/checkpoint and
writes receipts, builds, starts/stops only its own servers. Fixture media are
face-free; no real-camera, accuracy, hosted or container acceptance is claimed.

## Limitations and closeout

No independent product review or camera/hosted/quality acceptance; #43/#44/#45
remain separate. Five high dependency tooling advisories remain as documented by
PR #48; dependency lockfile is unchanged. P12 Office outputs are historical and
not regenerated; #26 still requires final content reconciliation/team details
and slide review. Original checkout AGENTS.md is untouched, SHA-256
`b8cce059b0616eab2a249c7c2c15ac4b92939b1982183107a3848edc4e390a52`.

Final remote HEAD/PR/CI/issues and worktree status are recorded in evidence
`final-state.json` after push. Close #42 only after its final-head CI passes;
#24/#25/#26 remain open with the results and remaining work linked.
