# SSDLite COCO fine-tune — 05/11/2026

Experiment artifacts: `D:/Codex/outputs/face-mask-detection/pretrained-2026-11-05`.
Downloaded weights and manifest: `D:/Codex/downloads/face-mask-detection/pretrained`.
Implementation PR: https://github.com/anhpd-glinteco/face-mask-detection/pull/54.

## Initialization and verification

TorchVision 0.24.0 COCO_V1 SSDLite weights passed the filename hash-prefix check.
The full SHA-256 is pinned in `ml/configs/pretrained-internal.json` and the local
download manifest. Actual-weight verification loaded 428 backbone/regression
tensors and left 48 classification tensors newly initialized. Offline fixture
tests cover checksum/key failures, validation best-epoch selection and resume.
The existing inference adapter loaded the pretrained smoke checkpoint with strict
state loading. Architecture and class IDs remain compatible.

Real curated-data smoke passed five train batches and two validation batches in
7.30 seconds. Initial local suites passed 38 ML and 24 inference tests. An added
best-epoch/offline-resume test also passed. The strengthened test interrupts the
second epoch and resumes without opening initial weights while preserving the
better first-epoch checkpoint. Inference tests also cover offline loading of a
checkpoint whose initialization metadata points to absent COCO weights.

## Training and quality outcome

Completed 30 epochs, 335 batches per epoch. The best checkpoint is epoch 10, SHA-256
`7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e`.
Initialization and split identity are pinned in the experiment config. Training
started at code `cf0d362`; trainer hash matches the current source. Later evaluator
changes preserve the original scratch epoch guard; AP calculations are unchanged.
`training-verification.json` verifies all 30 history rows, best-epoch selection,
initialization checksum and the unchanged P4 baseline checksum.

Recorded epoch time totals 12,813.99 seconds with a median of 399.69 seconds.
Windows entered sleep due to button/lid during epoch 13, whose 1,962.50 seconds
include the interruption. The Python process survived and continued after wake.

Validation mAP50:95 at epochs 1/5/10 was 0.0500/0.0992/0.1460. Later epochs did not
exceed epoch 10. The validation-selected threshold is 0.25, sealed in
`validation/decision.json` before one test evaluation for this experiment.

| Split | Macro precision | Macro recall | Macro F1 | AP50 | mAP50:95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Validation (98 images) | 0.5742 | 0.2586 | 0.3351 | 0.3047 | 0.1460 |
| Test (75 images) | 0.5159 | 0.2696 | 0.3240 | 0.2684 | 0.1333 |

Historical P4 macro F1 was 0.1771 validation / 0.2061 test. The experiment improves
these measurements, but the agreed 0.80 validation macro F1 and per-class
precision/recall targets FAIL. Incorrectly worn masks have validation recall
1/14 and test recall 1/12. Full class metrics, confusion matrices and image-level
errors are in `validation/summary.md` and `test/summary.md` under the artifact root.

## Dedicated native demo

Frontend source is PR #49 at `a341b6b`, checked out separately at
`D:/Codex/work/face-mask-detection/pretrained-demo-2026-11-05`.
It uses installed dependencies via a node_modules junction. Turbopack rejected
the junction outside its filesystem root; the production Webpack build passed.
The compiled client points to `http://localhost:8220`; page is
`http://localhost:3111`. The baseline checkout and program-link documents retain
their P4 configuration because the candidate has not met quality acceptance.

API terminal from the feature checkout's `services/inference` directory:

```powershell
$env:MODEL_PATH='D:/Codex/outputs/face-mask-detection/pretrained-2026-11-05/train/best.pt'
$env:MODEL_SHA256='7f96ce3ad9dc4a312134a6e011310e79699bb042b5237f5517e5282ec5c8504e'
$env:ALLOWED_ORIGINS='http://localhost:3111'
& D:/Codex/work/face-mask-detection/p5-venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8220
```

Web terminal from the dedicated checkout's `apps/web` directory:

```powershell
$env:NEXT_PUBLIC_INFERENCE_API_URL='http://localhost:8220'
npm.cmd run build -- --webpack
npm.cmd run start -- --hostname 127.0.0.1 --port 3111
```

Readiness at `http://localhost:8220/api/v1/ready` must return 200. API score floor
stays 0.001. The existing UI's uncertainty presentation threshold is 0.15, while
the experiment's reported operating metrics use 0.25.

## Manual webcam checklist

Final local checks PASS: 39 ML tests and 25 inference tests. Native rehearsal
`rehearsal/acceptance.json` is PASS_WITH_LIMITATIONS. Image uses synthetic input
against the real checkpoint. Video ran 60.82 seconds, webcam 60.80 seconds on
USB2.0 HD UVC WebCam, 640x480, source configured at 30 FPS.

Video HTTP p95 was 186.96 ms (230 successful requests across the video phase),
webcam HTTP p95 194.36 ms (187 successful requests including restart). The final
continuous webcam sample displayed 3.03 processed FPS. All successful responses
identify the exact selected checkpoint SHA-256. Three video requests were
cancelled while exercising pause/seek/cleanup; all recorded request failures are
ERR_ABORTED. No page errors or sampled UI alerts occurred. Permission denial and
regrant, stop, restart and mode-switch track cleanup PASS. No face media saved.

The user confirmed in this chat on 05/11 that the camera LED turned off after
the test. This is human-reported observation; the raw automated receipt retains
NOT_RUN for its combined physical-unplug/LED item. `acceptance-summary.json`
records the separate user confirmation. Physical unplug remains NOT_RUN for the
integrated camera. The class/lighting/distance matrix below remains NOT_RUN.

Use the selected checkpoint only after its exact SHA-256 and API readiness have
been recorded. Run on localhost. Obtain consent before recording any media.
Numeric observations can be saved without storing faces. For each row, note ten
processed snapshots, correct labels, missed faces, uncertain detections and false
boxes. These observations supplement validation metrics.

| Mask state | Lighting | Approximate distance | Observation |
| --- | --- | --- | --- |
| Correctly worn | Normal front lighting | 0.5 m | NOT_RUN |
| Correctly worn | Normal front lighting | 1 m | NOT_RUN |
| Correctly worn | Dim/backlit | 0.5 m | NOT_RUN |
| Correctly worn | Dim/backlit | 1 m | NOT_RUN |
| No mask | Normal front lighting | 0.5 m | NOT_RUN |
| No mask | Normal front lighting | 1 m | NOT_RUN |
| No mask | Dim/backlit | 0.5 m | NOT_RUN |
| No mask | Dim/backlit | 1 m | NOT_RUN |
| Incorrectly worn | Normal front lighting | 0.5 m | NOT_RUN |
| Incorrectly worn | Normal front lighting | 1 m | NOT_RUN |
| Incorrectly worn | Dim/backlit | 0.5 m | NOT_RUN |
| Incorrectly worn | Dim/backlit | 1 m | NOT_RUN |

Track cleanup was checked automatically; the LED result above comes from the
user. Source FPS differs from processed FPS. These runtime checks establish the
software flow, while the matrix still needs human observations of mask states.

## Limits

The P4 test split was previously inspected. New test results are a comparison on
an already used split. Rights and scene independence remain unresolved. Keep #44
open until its full DoD is met. Deployment gate CLOSED.

## Publication

Branch `feat/pretrained-ssdlite`, draft PR #54, base
`docs/submission-ready-2026-11`. No merge or deployment. #44 stays OPEN because
quality targets and data/review prerequisites remain unmet. #43 stays OPEN for
remaining device acceptance. Remote head, CI checks, issue states and working
tree state are recorded after publication in the artifact root's
`final-state.json`.
