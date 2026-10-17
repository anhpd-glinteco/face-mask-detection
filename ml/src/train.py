"""Synthetic-only trainer preparation. P2 approval is still required for real data."""

import argparse
import hashlib
import json
import math
import os
import pickle
from pathlib import Path
import platform
import random
import subprocess
import tempfile
import time

import numpy as np
import PIL
import torch
import torchvision
from torchvision.models.detection import ssdlite320_mobilenet_v3_large


ROOT = Path(__file__).resolve().parents[2]
SYNTHETIC_DATA = "synthetic-rgb-64x80-three-boxes-v1"
CLASS_MAP = {"0": "__background__", "1": "with_mask", "2": "without_mask", "3": "mask_worn_incorrectly"}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def validate_config(config):
    model, training, smoke = config["model"], config["training"], config["smoke"]
    if (config["class_map"] != CLASS_MAP
            or model["builder"] != "torchvision.models.detection.ssdlite320_mobilenet_v3_large"
            or model["weights"] is not None or model["weights_backbone"] is not None
            or model["num_classes"] != 4 or model["input_size"] != [320, 320]):
        raise ValueError("only the scratch SSDLite baseline and existing class map are supported")
    if (training["device"] != "cpu" or training["batch_size"] != 2
            or training["num_workers"] != 0 or training["optimizer"] != "SGD"
            or training["scheduler"]["name"] != "StepLR"):
        raise ValueError("synthetic smoke requires CPU, batch 2, workers 0, SGD and StepLR")
    if (type(smoke["epochs"]) is not int or smoke["epochs"] < 1
            or smoke["max_train_batches"] != 5 or smoke["max_validation_batches"] != 2):
        raise ValueError("smoke requires positive epochs, 5 train batches and 2 inference batches")
    for key in ("learning_rate", "momentum", "weight_decay"):
        if not math.isfinite(training[key]) or training[key] < 0:
            raise ValueError(f"invalid {key}")
    scheduler = training["scheduler"]
    if (type(scheduler["step_size"]) is not int or scheduler["step_size"] < 1
            or not math.isfinite(scheduler["gamma"]) or scheduler["gamma"] <= 0):
        raise ValueError("invalid StepLR configuration")


def synthetic_batch():
    images, targets = [], []
    for _ in range(2):
        image = torch.rand(3, 64, 80) * float(np.random.uniform(0.1, 0.3))
        boxes = torch.tensor([[2, 3, 22, 25], [26, 8, 47, 35], [51, 30, 77, 61]], dtype=torch.float32)
        for label, (x1, y1, x2, y2) in enumerate(boxes.to(torch.int64).tolist(), 1):
            image[label - 1, y1:y2, x1:x2] = random.uniform(0.6, 1.0)
        images.append(image)
        targets.append({"boxes": boxes, "labels": torch.tensor([1, 2, 3], dtype=torch.int64)})
    return images, targets


def rng_state():
    algorithm, keys, position, has_gauss, cached_gauss = np.random.get_state()
    return {"python": random.getstate(), "torch": torch.get_rng_state(),
            "numpy": [algorithm, keys.tolist(), position, has_gauss, cached_gauss]}


def restore_rng(state):
    random.setstate(state["python"])
    algorithm, keys, position, has_gauss, cached_gauss = state["numpy"]
    np.random.set_state((algorithm, np.array(keys, dtype=np.uint32), position, has_gauss, cached_gauss))
    torch.set_rng_state(state["torch"])


def atomic_write(path, writer):
    path = Path(path)
    descriptor, temporary = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            writer(handle)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def train_epoch(model, optimizer, batches):
    model.train()
    initial = [p.detach().clone() for p in model.parameters() if p.requires_grad]
    losses = []
    for _ in range(batches):
        images, targets = synthetic_batch()
        optimizer.zero_grad(set_to_none=True)
        parts = model(images, targets)
        loss = sum(parts.values())
        if not torch.isfinite(loss).item():
            raise ValueError("non-finite synthetic loss; checkpoint not advanced")
        loss.backward()
        if any(not torch.isfinite(p.grad).all().item() for p in model.parameters() if p.grad is not None):
            raise ValueError("non-finite gradient; checkpoint not advanced")
        optimizer.step()
        if any(not torch.isfinite(p).all().item() for p in model.parameters()):
            raise ValueError("non-finite parameter; checkpoint not advanced")
        losses.append({name: float(value.detach()) for name, value in parts.items()})
    if not any(not torch.equal(before, after) for before, after in zip(
            initial, (p for p in model.parameters() if p.requires_grad))):
        raise ValueError("synthetic training did not update parameters")
    return losses


def check_predictions(model, batches):
    model.eval()
    with torch.inference_mode():
        for _ in range(batches):
            images, _ = synthetic_batch()
            predictions = model(images)
            if len(predictions) != len(images):
                raise ValueError("prediction count differs from input count")
            for image, prediction in zip(images, predictions):
                boxes, labels, scores = (prediction[key] for key in ("boxes", "labels", "scores"))
                height, width = image.shape[-2:]
                if (boxes.ndim != 2 or boxes.shape[1] != 4 or labels.shape != (len(boxes),)
                        or scores.shape != (len(boxes),) or labels.dtype != torch.int64
                        or not torch.isfinite(boxes).all()
                        or not torch.isfinite(scores).all() or not ((labels >= 1) & (labels <= 3)).all()
                        or not ((scores >= 0) & (scores <= 1)).all()
                        or not ((boxes[:, 0] >= 0) & (boxes[:, 1] >= 0)
                                & (boxes[:, 2] <= width) & (boxes[:, 3] <= height)
                                & (boxes[:, 0] < boxes[:, 2]) & (boxes[:, 1] < boxes[:, 3])).all()):
                    raise ValueError("invalid synthetic predictions in original image coordinates")


def provenance():
    result = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True)
    return {"code_sha": result.stdout.strip(),
            "trainer_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "runtime": {"python": platform.python_version(), "torch": str(torch.__version__),
                        "torchvision": str(torchvision.__version__), "numpy": np.__version__,
                        "pillow": PIL.__version__, "platform": platform.platform(),
                        "torch_threads": torch.get_num_threads()}}


def run(config, output, resume=None, model_factory=ssdlite320_mobilenet_v3_large):
    validate_config(config)
    expected = config["runtime"]
    if (platform.python_version_tuple()[:2] != tuple(expected["python"].split("."))
            or str(torch.__version__).split("+")[0] != expected["torch"]
            or str(torchvision.__version__).split("+")[0] != expected["torchvision"]):
        raise ValueError("runtime differs from baseline Python/Torch/TorchVision versions")
    output = Path(output).resolve()
    if output.is_relative_to(ROOT):
        raise ValueError("output must be outside the source repository")
    checkpoint_path = output / "checkpoint.pt"
    checkpoint = None
    if resume:
        if Path(resume).resolve() != checkpoint_path:
            raise ValueError("resume must refer to output/checkpoint.pt")
        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        if (checkpoint["schema_version"] != 1 or checkpoint["mode"] != "synthetic-smoke"
                or checkpoint["synthetic_data"] != SYNTHETIC_DATA
                or checkpoint["config"] != config or checkpoint["config_sha256"] != digest(config)):
            raise ValueError("resume config or synthetic data identity mismatch")
        if not 0 <= checkpoint["next_epoch"] <= config["smoke"]["epochs"]:
            raise ValueError("invalid checkpoint epoch")
    elif output.exists() and any(output.iterdir()):
        raise ValueError("output is not empty; use a new directory or explicit --resume")
    metadata = provenance()
    if checkpoint and checkpoint["provenance"]["runtime"] != metadata["runtime"]:
        raise ValueError("resume runtime differs from checkpoint")
    random.seed(config["seed"])
    np.random.seed(config["seed"])
    torch.manual_seed(config["seed"])
    model = model_factory(weights=None, weights_backbone=None, num_classes=4).cpu()
    training = config["training"]
    optimizer = torch.optim.SGD(model.parameters(), lr=training["learning_rate"],
                                momentum=training["momentum"], weight_decay=training["weight_decay"])
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=training["scheduler"]["step_size"],
                                               gamma=training["scheduler"]["gamma"])
    history, start_epoch = [], 0
    if checkpoint:
        model.load_state_dict(checkpoint["model"])
        optimizer.load_state_dict(checkpoint["optimizer"])
        scheduler.load_state_dict(checkpoint["scheduler"])
        history, start_epoch = checkpoint["history"], checkpoint["next_epoch"]
        restore_rng(checkpoint["rng"])
    output.mkdir(parents=True, exist_ok=True)
    for epoch in range(start_epoch, config["smoke"]["epochs"]):
        started = time.perf_counter()
        losses = train_epoch(model, optimizer, config["smoke"]["max_train_batches"])
        check_predictions(model, config["smoke"]["max_validation_batches"])
        scheduler.step()
        history.append({"epoch": epoch, "batch_losses": losses,
                        "seconds": time.perf_counter() - started,
                        "next_learning_rate": scheduler.get_last_lr()})
        checkpoint = {"schema_version": 1, "mode": "synthetic-smoke", "synthetic_data": SYNTHETIC_DATA,
                      "config": config, "config_sha256": digest(config), "provenance": metadata,
                      "next_epoch": epoch + 1, "model": model.state_dict(),
                      "optimizer": optimizer.state_dict(), "scheduler": scheduler.state_dict(),
                      "rng": rng_state(), "history": history}
        atomic_write(checkpoint_path, lambda handle: torch.save(checkpoint, handle))
    report = {"mode": "synthetic-smoke", "synthetic_data": SYNTHETIC_DATA, "p3_ready": False,
              "checkpoint_sha256": hashlib.sha256(checkpoint_path.read_bytes()).hexdigest(),
              "next_epoch": checkpoint["next_epoch"], "history": history,
              "provenance": checkpoint["provenance"],
              "limitations": ["synthetic pipeline check only; not model quality or P3 completion",
                              "P2 real-data rights and scene grouping remain blocked",
                              "checkpoint.pt is authoritative if report writing is interrupted"]}
    atomic_write(output / "synthetic-report.json", lambda handle: handle.write(
        (json.dumps(report, indent=2, allow_nan=False) + "\n").encode()))
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--synthetic-smoke", action="store_true", required=True)
    parser.add_argument("--config", type=Path, default=ROOT / "ml/configs/baseline.json")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--resume", type=Path)
    args = parser.parse_args()
    try:
        config = json.loads(args.config.read_text(encoding="utf-8"))
        report = run(config, args.output, args.resume)
    except (ValueError, OSError, KeyError, TypeError, RuntimeError, EOFError, pickle.UnpicklingError) as error:
        parser.exit(2, f"synthetic smoke failed: {error}\n")
    print(json.dumps({key: report[key] for key in ("mode", "next_epoch", "checkpoint_sha256", "p3_ready")}))


if __name__ == "__main__":
    main()
