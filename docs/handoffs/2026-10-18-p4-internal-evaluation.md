# P4 — internal baseline evaluation — 18/10/2026, Asia/Saigon

## Status and scope

Internal evaluation completed for #9; model quality is low. This is not approval
to publish/deploy weights or a claim of verified image rights/scene independence.
Keep #2/#3 open and `p3_ready=false`. API/web still use the existing stub.

Branch: `codex/internal-evaluation`, based on `codex/internal-baseline` at
`e08d1fe0f457f89a257e3a5f5e65495c1fbfbf29` (PR #30). The evaluation PR is separate
from the slide PR #31 and must remain based on #30 until that dependency merges.

Inputs: completed P3 handoff/verification, fixed 30-epoch checkpoint, pinned
internal config and curated manifest. No retraining, source-media edits, split
changes, new dependencies, API/schema changes or weights uploads.

## Implementation and measured results

`ml/src/evaluate.py` adds validation/test CLI stages; the shared `ManifestData`
loader gains requested splits while preserving the train/validation default.
Validation loads only validation media; test checks the validation decision
checksum and checkpoint/config/runtime/method/source identity before loading test.
Class map/preprocessing are reused. Selected-split image/XML hashes, paths,
dimensions and targets are verified. Exact P3 runtime, CPU two threads, finite
weights and strict state loading are required. Outputs refuse nonempty directories.

Final epoch 30 is fixed, not selected as a best epoch. Validation maximizes macro
F1 at IoU 0.5 across 0.05–0.95 in steps of 0.05, ties choosing the higher value.
Selected **0.15**, then evaluated test separately once with that locked value.

| Split | Images / boxes | Macro precision | Macro recall | Macro F1 | AP50 | mAP50:95 |
|---|---:|---:|---:|---:|---:|---:|
| Validation | 98 / 565 | 0.3182 | 0.1560 | 0.1771 | 0.1153 | 0.0495 |
| Test | 75 / 360 | 0.2393 | 0.1975 | 0.2061 | 0.1792 | 0.0820 |

Per-class metrics/confusion/error cases: [model card](../model-card.md).
Test diagnostic counts: 215 missed truths, 5 class errors, 94 localization errors,
106 extra predictions. Counts are not mutually exclusive per physical object.
Class-agnostic confusion matching differs from class-aware PR/F1/AP matching.
Only 2/49 without-mask and 1/12 incorrectly-worn truths are true positives in the
class-aware operating metrics. Do not frame this checkpoint as reliable detection.

AP: 101 recall points, IoU 0.50–0.95 step 0.05, before operating threshold;
score floor 0.001, NMS 0.55, top-k 300/class, max 100 detections/image. This is
defined interpolated AP, not official COCO evaluation with area/crowd rules.
Three zero-area validation boxes were excluded; test had none. Invalid predictions
are rejected. Wall times (14.01 s validation, 11.59 s test) include inference and
metric computation, excluding setup; these are not service-latency benchmarks.

## Artifacts and integrity

Root: `D:\Codex\outputs\face-mask-detection\p4-evaluation`.
Each split contains `predictions.json` (numeric boxes/labels only), `report.json`,
`summary.md`, `f1.svg`; validation also contains `decision.json`. No image media
or weights are copied into P4 outputs or committed to Git.

| Artifact | SHA-256 |
|---|---|
| Input checkpoint (unchanged) | `1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74` |
| Manifest (unchanged) | `a2236fd6bd445de1aa9ea9e52547b01bf2a8ab7e25ba87008e59795c3130a3b3` |
| Validation decision | `6c54c06e333ac51b1b519d5ca899c7df974a868fe1bfb6884d2a87bac2226151` |
| Validation report | `2f4ea281936cd577ce5454d2af99a7dfa7aff075acc072db0bfd8a7d98c867e3` |
| Test report | `9543da41730442679bd9d76aaec21a558f9b413ae5c990ca75dbf767522c5092` |
| Evaluator source | `cc4b09748005421b9e08b5a532decae1140689879526dff4339bfc8762a86515` |

`verify_evaluation.py` / `verification.json` in the output root reconcile split IDs,
truth boxes, prediction limits/coordinates, operating counts, confusion totals,
threshold selection, report/decision/checkpoint/source hashes and SVG validity
without reopening media or running inference. Full per-file checksums are recorded.

## Verification

Environment: existing P3 Python 3.12.14 venv, Torch 2.9.0+cpu, TorchVision
0.24.0+cpu, NumPy 2.3.3, Pillow 11.3.0; Windows 11, two CPU threads.
Exact validation/test commands: [ML README](../../ml/README.md).

| Check | Result | Evidence / limit |
|---|---|---|
| `python -m unittest discover -s ml/tests -v` | 37 pass, exit 0 | `ml-tests-retry.log`, 38.82 s; includes 11 evaluator tests |
| `evaluate.py validation ...` then `test ...` | Both exit 0 | 98 validation images before separate 75-image test; reports above |
| `python <output-root>/verify_evaluation.py` | exit 0, verified=true | `verification.json`; weights unchanged |
| `git diff --check` | exit 0 | No whitespace errors |

An earlier full-suite run failed two evaluator flow tests while launching Git:
one exit 1, one Windows `0xc000012d` (commitment limit). Keep `ml-tests.log` as
failure evidence; the unchanged full suite passed on retry. Earlier 36-test run
and the final 11 evaluator tests also passed before real evaluation. No frontend,
API, Docker, hardware-camera, deployment or independent visual error review ran.

## Next step and rollback

P4/#9 has measured internal results, config/split/version, tables/charts, error
analysis and test evidence. Review/merge the evaluation PR through normal CI.
P5 may prepare loading/readiness using fixtures, but deployment/publication of
this checkpoint remains outside the current authorization. Resolve data rights
and source/scene grouping; choose a quality-improvement path before claiming a
usable model. Do not tune further on this test split; a later model iteration
must disclose that these results have already been inspected.

Do not repeat completed P2 audits, train or threshold selection without changed
inputs. Trainer source changed for split support: old checkpoint resume still
requires its original P3 source. Reverting this PR restores prior loader behavior;
leave all existing data, weights and local evidence intact.
