# ML workspace

Notebook exploration belongs in `notebooks/`; reusable training/evaluation code in `src/`; versioned configuration in `configs/`; generated metric summaries in `reports/`.

Do not commit datasets, runs or model weights. Publish a checksum and documented release location only after dataset/model licenses are approved.

## P2 audit and split

Use Python with Pillow already installed (the inference requirements include it).
No Torch/model download is needed for data audit. From the repository root:

```powershell
& D:\Codex\work\face-mask-detection\p0-venv\Scripts\python.exe -m unittest discover -s ml/tests -v
& D:\Codex\work\face-mask-detection\p0-venv\Scripts\python.exe ml/src/prepare_dataset.py --dataset D:\Codex\work\face-mask-detection\p2\dataset-v1 --output D:\Codex\outputs\face-mask-detection\p2\manifest.json
```

The source dataset must have `images/` and `annotations/*.xml`. Optional `--groups`
accepts a reviewed CSV with `image,group` columns; `--seed` defaults to 42.
Outputs must be outside the source dataset. The tool never modifies source media
or annotations. Its JSON contains all split records and audit findings; exit 2
means review is required, not a successful training-ready split. Parse/configuration
failures exit 2 without replacing an earlier output: always check the exit code.

The current raw dataset intentionally fails audit: 11 invalid annotations and 5
conflicting duplicate pairs. No trainer is implemented in P2. `configs/baseline.json`
specifies the P3 experiment, not a runnable training command or measured model.
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
total). No trainer, API, frontend, baseline or dependency change is included.

