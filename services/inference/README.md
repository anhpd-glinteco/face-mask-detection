# Inference service

Python 3.12; install `requirements.txt` (Torch 2.9.0+cpu / TorchVision 0.24.0+cpu).
Run from this directory: `uvicorn app.main:app --port 8000`.

Set `MODEL_PATH` to a local P3-format checkpoint and `MODEL_SHA256` to its full
lowercase SHA-256 before starting the process. Set these in the process environment;
the service does not automatically read the repository `.env` file. Restart to reload.
Weights are checked and cached once per process. Missing/bad weights leave health
200 and readiness/detection 503. Inference failures return 500; no stub fallback.
An empty detection list is only a successful model result.

The adapter checks schema version, config hash, architecture, class map, finite
parameters and strict state loading, with `weights_only=True`. It does not verify
image rights, model quality or permission to deploy. **The current P4 checkpoint
is not approved for publication/deployment and is not used by the P5 tests.**

Input RGB tensor is CHW float32 in [0,1]; the detector handles resizing and
normalization internally and returns coordinates in original-image pixels.
Class IDs 1/2/3 map to with_mask/without_mask/mask_worn_incorrectly; 0 is background.
Score floor 0.001, NMS 0.55, top-k 300/class, max 100 predictions/image.
The API retains score floor 0.001 and raw three-class predictions. The web UI uses the P4 validation-locked 0.15 presentation threshold: below it, detections remain visible as uncertain; at/above it, they meet the threshold. This is not an API filter or model-quality approval.
Response schema remains 1.0; model version is the checkpoint SHA-256. Timings use
the monotonic clock for tensor conversion, model call and output conversion,
excluding upload/decode. No media is persisted or logged.

Tests: `python -m pytest tests -v`. Tests create a seeded random checkpoint in a
temporary directory, inject deterministic predictions and validate responses
against the shared JSON Schema. These are plumbing tests, not quality benchmarks.

Docker: `docker build -t face-mask-inference services/inference` from the repo root.
Run `docker run --rm -p 8000:8000 face-mask-inference` without model configuration:
health must return 200; ready and detect with a valid image must return 503.
For an approved model later, bind-mount its directory read-only and pass MODEL_PATH
(container path) and MODEL_SHA256 using `-e`. Never copy weights into the image.
