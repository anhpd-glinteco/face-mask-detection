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

