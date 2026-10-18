# ML workspace

Notebook exploration belongs in `notebooks/`; reusable training/evaluation code in `src/`; versioned configuration in `configs/`; generated metric summaries in `reports/`.

Do not commit datasets, runs or model weights. Publish a checksum and documented release location only after dataset/model licenses are approved.

## P2 audit and split

Use Python with Pillow already installed (the inference requirements include it).
No Torch/model download is needed for data audit. From the repository root:

```powershell
& D:\Codex\work\face-mask-detection\p0-venv\Scripts\python.exe -m unittest discover -s ml/tests -p "test_*dataset.py" -v
& D:\Codex\work\face-mask-detection\p0-venv\Scripts\python.exe ml/src/prepare_dataset.py --dataset D:\Codex\work\face-mask-detection\p2\dataset-v1 --output D:\Codex\outputs\face-mask-detection\p2\manifest.json
```

The source dataset must have `images/` and `annotations/*.xml`. Optional `--groups`
accepts a reviewed CSV with `image,group` columns; `--seed` defaults to 42.
Outputs must be outside the source dataset. The tool never modifies source media
or annotations. Its JSON contains all split records and audit findings; exit 2
means review is required, not a successful training-ready split. Parse/configuration
failures exit 2 without replacing an earlier output: always check the exit code.

The current raw dataset intentionally fails audit: 11 invalid annotations and 5
conflicting duplicate pairs. `configs/baseline.json` specifies the P3 experiment,
not a measured model. The preparatory trainer below accepts synthetic data only;
The default config remains unapproved; the separately scoped internal experiment below is user-authorized.
Read `docs/dataset-card.md` and `docs/adr/0002-cpu-baseline.md` before proceeding.

## Reviewed curated candidate (P2 continuation)

The raw audit above still intentionally exits 2. A separate curated candidate
passes technical audit; rights and scene independence remain unapproved.
`reviews/p2-curation.json` pins 21 sample decisions (11 XML fixes, 10 exclusions)
with source hashes, explicit bbox before/after and visual grouping rationale.
Git preserves the exact bytes of both review files via `.gitattributes` so
automatic line-ending conversion cannot silently change their pinned hashes.
`reviews/p2-scene-groups.csv` contains only matched/candidate groups; unmatched
images remain unresolved, not verified independent scenes.

From the repository root, run the following in order and wait for each process
to finish successfully before starting the next:

```powershell
& D:\Codex\work\face-mask-detection\p0-venv\Scripts\python.exe ml/src/curate_dataset.py --dataset D:\Codex\work\face-mask-detection\p2\dataset-v1 --decisions ml/reviews/p2-curation.json --output D:\Codex\work\face-mask-detection\p2\dataset-curated-v1 --log D:\Codex\outputs\face-mask-detection\p2-review\curation-log.json
& D:\Codex\work\face-mask-detection\p0-venv\Scripts\python.exe ml/src/prepare_dataset.py --dataset D:\Codex\work\face-mask-detection\p2\dataset-curated-v1 --groups ml/reviews/p2-scene-groups.csv --seed 42 --output D:\Codex\outputs\face-mask-detection\p2-review\manifest.json
```

These paths already contain this session's artifacts. For a replay, use a **new**
curated directory and log path; curation refuses existing destinations and paths
inside source data. It verifies review hashes/bboxes before copying, validates
retained samples, and writes a completion log with all source/output file hashes.
A failed copy can leave an incomplete new directory: do not use it without a
successful curation exit, completion log and subsequent audit exit 0. No rollback
deletes source or earlier outputs. No labels or image bytes are changed.

Result: 843 images / 3,970 boxes, train/validation/test 670/98/75; two identical
seed-42 manifests. The CSV covers 281 images; 562 remain unresolved.
See `reports/p2-curated-audit.json` and `docs/handoffs/2026-10-17-p2-review.md`.
The existing CI discovery also runs three synthetic curation tests (12 ML tests
total at that handoff). That curation change included no trainer, API, frontend,
baseline or dependency changes.

## Synthetic trainer preparation (full P2 verification remains incomplete)

`src/train.py` exercises the scratch SSDLite320 training loop, SGD/StepLR and
epoch-boundary checkpoint/resume using generated RGB images, never dataset files.
Both pretrained-weight arguments are explicitly `None`; there is no weight
download, mAP or best-model selection in synthetic mode. Real-data inputs are rejected in synthetic mode.
Synthetic results are not model-quality measurements or P3 completion.

Use a **separate Python 3.12 CPU environment**; do not install Torch in the backend
or P0 audit environment. The verified Windows setup uses uv with its interpreter
and cache on D (run from repository root):

```powershell
$env:UV_PYTHON_INSTALL_DIR = 'D:\Codex\work\python'
$env:UV_CACHE_DIR = 'D:\Codex\work\uv-cache'
uv python install 3.12
uv venv --python 3.12 D:\Codex\work\face-mask-detection\p3-venv
uv pip install --python D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe -r ml/requirements.txt
uv pip check --python D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe
& D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe -m unittest discover -s ml/tests -v
```

Dependencies are separate and pinned: Torch 2.9.0+cpu, TorchVision 0.24.0+cpu,
NumPy 2.3.3 and Pillow 11.3.0. The CI `ml` job runs all ML tests, including the
real CPU detector on synthetic inputs; a missing Torch installation fails rather
than skips. The inference job retains the 12 dataset tests without requiring Torch.

Run smoke into a **new** directory outside the repository (the example directory
below already contains evidence from 17/10/2026; choose a new suffix for replay):

```powershell
$env:OMP_NUM_THREADS = '2'
$env:MKL_NUM_THREADS = '2'
& D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe ml/src/train.py --synthetic-smoke --config ml/configs/baseline.json --output D:\Codex\outputs\face-mask-detection\p3-synthetic\smoke-v1
```

The baseline smoke config runs one epoch: five training batches and two inference
batches, each containing two images. Each 64x80 RGB float tensor has three boxes
and labels 1/2/3; the detector performs its own resize and returns original-image
coordinates. Finite loss/gradients/parameters, parameter changes, and inference
boxes/scores/labels are checked. This is deliberately tiny synthetic input, not
a realistic throughput or accuracy benchmark.

`checkpoint.pt` stores model/optimizer/scheduler state, the next epoch, all three
RNG states, complete config/hash, synthetic generator identity, code SHA, trainer
source hash, runtime and per-batch losses/epoch times. The Git SHA identifies the
base commit when changes are uncommitted; the source hash identifies the actual
trainer bytes. `synthetic-report.json` records the checkpoint SHA-256 and
`p3_ready=false`. Checkpoint writes use a temporary sibling file and replacement;
if report writing is interrupted, the checkpoint remains authoritative and resume
regenerates the report. Only local checkpoints created by this trainer should be
resumed; loading uses `weights_only=True`.

```powershell
& D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe ml/src/train.py --synthetic-smoke --config ml/configs/baseline.json --output D:\Codex\outputs\face-mask-detection\p3-synthetic\smoke-v1 --resume D:\Codex\outputs\face-mask-detection\p3-synthetic\smoke-v1\checkpoint.pt
```

Resume requires the same config, synthetic identity and runtime (including CPU
thread count). Set the same environment variables as the original run. Resume
starts at the next saved epoch; an interrupted epoch runs again. Resuming an
already-completed one-epoch smoke only validates/loads the checkpoint and rebuilds
the report. For a multi-epoch synthetic interruption experiment, set `smoke.epochs`
in a separate config **before the initial run**, then use that unchanged config
for resume; `training.epochs` does not control synthetic smoke. Unit tests exercise
an interruption during epoch two and compare against an uninterrupted run.

Synthetic mode rejects dataset paths; one explicit training mode is required. Existing
nonempty output directories cannot be reused without explicit `--resume`.
See [the synthetic handoff](../docs/handoffs/2026-10-17-p3-synthetic.md).


## Internal real-data baseline - 17/10/2026

The user chose an internal experiment on the current curated dataset, acknowledging
unverified image rights and possible scene leakage. This changes the execution
scope, not the evidence: P2 rights/scene verification remains incomplete and
`p3_ready=false`. Do not publish media or weights or deploy this checkpoint.
The default `baseline.json` remains unchanged; `configs/internal-baseline.json`
pins manifest SHA-256 `a2236fd6bd445de1aa9ea9e52547b01bf2a8ab7e25ba87008e59795c3130a3b3`.

Use the existing P3 Python environment and set `OMP_NUM_THREADS=2` and
`MKL_NUM_THREADS=2` as above. From the repository root:

```powershell
& D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe ml/src/train.py --real-smoke --config ml/configs/internal-baseline.json --dataset D:\Codex\work\face-mask-detection\p2\dataset-curated-v1 --manifest D:\Codex\outputs\face-mask-detection\p2-review\manifest.json --output D:\Codex\outputs\face-mask-detection\p3-internal\smoke-v3
& D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe ml/src/train.py --real-train --config ml/configs/internal-baseline.json --dataset D:\Codex\work\face-mask-detection\p2\dataset-curated-v1 --manifest D:\Codex\outputs\face-mask-detection\p2-review\manifest.json --output D:\Codex\outputs\face-mask-detection\p3-internal\baseline-v2
```

Run smoke successfully before baseline. Use new output directories for replay;
resume uses the exact same command plus `--resume <output>\checkpoint.pt`.
The manifest, mode, config, runtime/thread count and trainer source must match.
No synthetic checkpoint can be resumed in real mode. An interrupted epoch reruns.

Before training, verify train/validation image and XML hashes, dimensions, targets,
unique records and group separation. Images become RGB float tensors in [0,1];
manifest pixel xyxy boxes are unchanged, with resize handled by the detector.
Train shuffles reproducibly; batch size 2 drops an odd singleton tail for BatchNorm
(the current 670-image train split has no tail). Validation is ordered and uses
inference mode. Test media is never opened by this trainer.

Real smoke runs 5 train batches and 2 validation prediction checks for one epoch.
Baseline runs all 670 train images / 335 batches and all 98 validation images per
epoch for 30 epochs, using the existing scratch CPU SGD/StepLR settings. Validation
checks finite outputs and coordinates, counting/excluding clipped zero-area boxes: it does not compute loss, mAP or select
a best model. `checkpoint.pt` retains the final completed epoch, optimizer/scheduler,
RNG, config, manifest identity and per-batch loss/timing history. `real-report.json`
contains its checksum, split counts and limitations. Logs/weights stay on D outside
Git; artifacts are for internal use only. P4 evaluation and deployment are separate.

## P4 internal evaluation — 18/10/2026

Use the same P3 environment and two CPU threads. Evaluation loads the fixed final
epoch 30, never trains, and never chooses a best epoch. Each command needs an empty
output directory outside source/data. From the repository root:

```powershell
$env:OMP_NUM_THREADS = '2'
$env:MKL_NUM_THREADS = '2'
$checkpoint = 'D:\Codex\outputs\face-mask-detection\p3-internal\baseline-v2\checkpoint.pt'
$checkpointHash = '1671b05ee0762ac9c1ebd5501a703b357ea2aa043e61ce029b70ae5f85c2ef74'
$dataset = 'D:\Codex\work\face-mask-detection\p2\dataset-curated-v1'
$manifest = 'D:\Codex\outputs\face-mask-detection\p2-review\manifest.json'
$evaluationOutput = 'D:\Codex\outputs\face-mask-detection\p4-evaluation'
& D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe ml/src/evaluate.py validation --checkpoint $checkpoint --checkpoint-sha256 $checkpointHash --dataset $dataset --manifest $manifest --output "$evaluationOutput\validation"
if ($LASTEXITCODE -ne 0) { throw 'Validation failed; do not run test.' }
$decision = "$evaluationOutput\validation\decision.json"
$decisionHash = (Get-FileHash -LiteralPath $decision -Algorithm SHA256).Hash.ToLowerInvariant()
& D:\Codex\work\face-mask-detection\p3-venv\Scripts\python.exe ml/src/evaluate.py test --checkpoint $checkpoint --checkpoint-sha256 $checkpointHash --dataset $dataset --manifest $manifest --decision $decision --decision-sha256 $decisionHash --output "$evaluationOutput\test"
```

These output directories hold the recorded run; choose a new root to reproduce.
Validation opens only validation media; test requires the sealed decision before
opening test media. Both check manifest, selected-split media/XML hashes, dimensions,
targets, checkpoint/config hashes and the exact P3 runtime. Trainer loading still
defaults to train/validation and never reads test. The loader source changed in P4;
resuming old training still requires its original P3 source, as documented above.

Inference: scratch architecture, strict checkpoint state loading, RGB float [0,1],
original xyxy pixels; detector performs its own 320 resize. Score floor 0.001,
class-wise NMS IoU 0.55, 300 candidates per class before NMS, maximum 100 detections
per image across classes. Invalid predictions fail; clipped zero-area boxes are
counted and excluded without replacing them. Scores are compared as returned,
without rounding. Equal-score ordering follows detector output, then image order.

Select one common threshold from 0.05–0.95 in 0.05 steps by maximum validation
macro F1 at IoU 0.5, ties choosing the higher threshold. All three classes must be
present in validation. Test uses that threshold unchanged. PR/F1/AP use same-class,
confidence-descending greedy one-to-one matching to the best unmatched truth box.
Macro metrics exclude classes with no ground truth (reported N/A for recall/F1/AP).
Precision is zero when no predictions exist. AP uses 101 recall points and IoU
0.50–0.95 in 0.05 steps, before applying the selected operating threshold.
This is a defined AP calculation without COCO area/crowd rules, not official COCO
evaluation. AP remains bounded by the declared score floor, top-k and NMS.

Each stage emits `report.json`, `predictions.json` (numeric boxes/labels, no media),
`summary.md` and `f1.svg`. Validation also emits `decision.json`; test checks its
SHA-256, evaluator source hash, checkpoint, manifest, config, runtime and method.
Confusion rows are truth and columns prediction, with background at index 0;
class-agnostic greedy IoU>=0.5 matching exposes class errors. Unmatched predictions
are localization errors if same-class truth has IoU in [0.1,0.5), otherwise extra
(including duplicates). Unmatched truth is missed. These are diagnostic counts,
not mutually exclusive object outcomes: a poorly localized box can also leave a
miss. Full per-image counts and the ten images with most errors are recorded.

Image rights and scene independence remain unverified, `p3_ready=false`; do not
publish media/weights or deploy this checkpoint. See the P4 handoff for measured
results and the model card for limitations.
