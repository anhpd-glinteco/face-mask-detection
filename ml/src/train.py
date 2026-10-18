"""Scratch SSDLite training: synthetic checks or explicitly scoped internal experiments."""

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
from PIL import Image
from torchvision.transforms.functional import pil_to_tensor
import torch
import torchvision
from torchvision.models.detection import ssdlite320_mobilenet_v3_large


ROOT = Path(__file__).resolve().parents[2]
SYNTHETIC_DATA = "synthetic-rgb-64x80-three-boxes-v1"
CLASS_MAP = {"0": "__background__", "1": "with_mask", "2": "without_mask", "3": "mask_worn_incorrectly"}
LABEL_IDS = {label: int(key) for key, label in CLASS_MAP.items() if key != "0"}


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
        raise ValueError("baseline requires CPU, batch 2, workers 0, SGD and StepLR")
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


class ManifestData:
    """Verify frozen manifest/media; training defaults never open test media."""

    def __init__(self, dataset, manifest_path, config, splits=("train", "validation")):
        if not splits or any(split not in ("train", "validation", "test") for split in splits):
            raise ValueError("invalid requested splits")
        self.root = Path(dataset).resolve()
        raw = Path(manifest_path).read_bytes()
        self.identity = {"manifest_sha256": hashlib.sha256(raw).hexdigest(),
                         "usage": "internal-experiment", "scene_leakage_verified": False,
                         "train_deploy_rights_approved": False}
        if (config["data"].get("usage") != "internal-experiment"
                or config["data"].get("manifest_sha256") != self.identity["manifest_sha256"]):
            raise ValueError("real data requires internal-experiment scope and pinned manifest hash")
        manifest = json.loads(raw)
        if (manifest["schema_version"] != 1 or manifest["technical_checks_passed"] is not True
                or manifest["errors"] or manifest["missing_split_classes"]):
            raise ValueError("manifest technical checks did not pass")
        self.records = {split: [] for split in splits}
        seen, groups = set(), {}
        for record in manifest["records"]:
            split = record["split"]
            if split not in ("train", "validation", "test") or record["image"] in seen:
                raise ValueError("invalid or duplicate split record")
            seen.add(record["image"])
            group = record["group"]
            if group in groups and groups[group] != split:
                raise ValueError("group crosses splits")
            groups[group] = split
            if split not in self.records:
                continue
            for key in ("image", "annotation"):
                path = (self.root / record[key]).resolve()
                if not path.is_relative_to(self.root) or path == self.root:
                    raise ValueError("manifest path escapes dataset")
                if hashlib.sha256(path.read_bytes()).hexdigest() != record[key + "_sha256"]:
                    raise ValueError("dataset file hash mismatch")
            with Image.open(self.root / record["image"]) as image:
                if image.size != (record["width"], record["height"]):
                    raise ValueError("image dimensions differ from manifest")
            if not record["objects"]:
                raise ValueError("empty targets require review")
            for obj in record["objects"]:
                x1, y1, x2, y2 = obj["bbox"]
                if (obj["label"] not in LABEL_IDS
                        or not all(math.isfinite(v) for v in obj["bbox"])
                        or not 0 <= x1 < x2 <= record["width"]
                        or not 0 <= y1 < y2 <= record["height"]):
                    raise ValueError("invalid manifest target")
            self.records[split].append(record)
        if any(not records for records in self.records.values()) or (
                "train" in self.records and len(self.records["train"]) < 2):
            raise ValueError("requested splits must be nonempty; training needs two images")

    def batches(self, split, limit=None):
        records = self.records[split]
        order = torch.randperm(len(records)).tolist() if split == "train" else range(len(records))
        for start in range(0, len(records), 2):
            if limit is not None and start // 2 >= limit:
                break
            indices = order[start:start + 2]
            # shortcut: drop a singleton train tail for BatchNorm, revisit if batch size changes.
            if split == "train" and len(indices) < 2:
                break
            images, targets = [], []
            for index in indices:
                record = records[index]
                with Image.open(self.root / record["image"]) as image:
                    images.append(pil_to_tensor(image.convert("RGB")).float() / 255)
                targets.append({"boxes": torch.tensor([o["bbox"] for o in record["objects"]], dtype=torch.float32),
                                "labels": torch.tensor([LABEL_IDS[o["label"]]
                                                        for o in record["objects"]], dtype=torch.int64)})
            yield images, targets


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
    source = (synthetic_batch() for _ in range(batches)) if isinstance(batches, int) else batches
    for images, targets in source:
        optimizer.zero_grad(set_to_none=True)
        parts = model(images, targets)
        loss = sum(parts.values())
        if not torch.isfinite(loss).item():
            raise ValueError("non-finite loss; checkpoint not advanced")
        loss.backward()
        if any(not torch.isfinite(p.grad).all().item() for p in model.parameters() if p.grad is not None):
            raise ValueError("non-finite gradient; checkpoint not advanced")
        optimizer.step()
        if any(not torch.isfinite(p).all().item() for p in model.parameters()):
            raise ValueError("non-finite parameter; checkpoint not advanced")
        losses.append({name: float(value.detach()) for name, value in parts.items()})
    if not any(not torch.equal(before, after) for before, after in zip(
            initial, (p for p in model.parameters() if p.requires_grad))):
        raise ValueError("training did not update parameters")
    return losses


def check_predictions(model, batches):
    counts = {"images": 0, "valid_boxes": 0, "discarded_zero_area_boxes": 0}
    model.eval()
    with torch.inference_mode():
        source = (synthetic_batch() for _ in range(batches)) if isinstance(batches, int) else batches
        for images, _ in source:
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
                                & (boxes[:, 0] <= boxes[:, 2]) & (boxes[:, 1] <= boxes[:, 3])).all()):
                    raise ValueError("invalid predictions in original image coordinates")
                # TorchVision SSD clips to image bounds without removing zero-area boxes.
                positive = (boxes[:, 0] < boxes[:, 2]) & (boxes[:, 1] < boxes[:, 3])
                counts["images"] += 1
                counts["valid_boxes"] += int(positive.sum())
                counts["discarded_zero_area_boxes"] += int((~positive).sum())
    return counts


def provenance():
    result = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True)
    return {"code_sha": result.stdout.strip(),
            "trainer_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "runtime": {"python": platform.python_version(), "torch": str(torch.__version__),
                        "torchvision": str(torchvision.__version__), "numpy": np.__version__,
                        "pillow": PIL.__version__, "platform": platform.platform(),
                        "torch_threads": torch.get_num_threads()}}


def run(config, output, resume=None, model_factory=ssdlite320_mobilenet_v3_large, data=None, real_smoke=False):
    validate_config(config)
    mode = ("real-smoke" if real_smoke else "real-train") if data else "synthetic-smoke"
    identity = data.identity if data else SYNTHETIC_DATA
    identity_key = "dataset" if data else "synthetic_data"
    epochs = config["training"]["epochs"] if data and not real_smoke else config["smoke"]["epochs"]
    if type(epochs) is not int or epochs < 1:
        raise ValueError("epochs must be a positive integer")
    expected = config["runtime"]
    if (platform.python_version_tuple()[:2] != tuple(expected["python"].split("."))
            or str(torch.__version__).split("+")[0] != expected["torch"]
            or str(torchvision.__version__).split("+")[0] != expected["torchvision"]):
        raise ValueError("runtime differs from baseline Python/Torch/TorchVision versions")
    output = Path(output).resolve()
    if output.is_relative_to(ROOT):
        raise ValueError("output must be outside the source repository")
    if data and (output.is_relative_to(data.root) or data.root.is_relative_to(output)):
        raise ValueError("output must be separate from dataset")
    checkpoint_path = output / "checkpoint.pt"
    checkpoint = None
    if resume:
        if Path(resume).resolve() != checkpoint_path:
            raise ValueError("resume must refer to output/checkpoint.pt")
        checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        if (checkpoint["schema_version"] != 1 or checkpoint["mode"] != mode
                or checkpoint[identity_key] != identity
                or checkpoint["config"] != config or checkpoint["config_sha256"] != digest(config)):
            raise ValueError("resume config, mode or data identity mismatch")
        if not 0 <= checkpoint["next_epoch"] <= epochs:
            raise ValueError("invalid checkpoint epoch")
    elif output.exists() and any(output.iterdir()):
        raise ValueError("output is not empty; use a new directory or explicit --resume")
    metadata = provenance()
    if checkpoint and checkpoint["provenance"]["runtime"] != metadata["runtime"]:
        raise ValueError("resume runtime differs from checkpoint")
    if data and checkpoint and checkpoint["provenance"]["trainer_sha256"] != metadata["trainer_sha256"]:
        raise ValueError("resume trainer source differs from checkpoint")
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
    for epoch in range(start_epoch, epochs):
        started = time.perf_counter()
        train_batches = data.batches("train", 5 if real_smoke else None) if data else config["smoke"]["max_train_batches"]
        validation_batches = data.batches("validation", 2 if real_smoke else None) if data else config["smoke"]["max_validation_batches"]
        losses = train_epoch(model, optimizer, train_batches)
        prediction_checks = check_predictions(model, validation_batches)
        scheduler.step()
        history.append({"epoch": epoch, "batch_losses": losses, "prediction_checks": prediction_checks,
                        "seconds": time.perf_counter() - started,
                        "next_learning_rate": scheduler.get_last_lr()})
        checkpoint = {"schema_version": 1, "mode": mode, identity_key: identity,
                      "config": config, "config_sha256": digest(config), "provenance": metadata,
                      "next_epoch": epoch + 1, "model": model.state_dict(),
                      "optimizer": optimizer.state_dict(), "scheduler": scheduler.state_dict(),
                      "rng": rng_state(), "history": history}
        atomic_write(checkpoint_path, lambda handle: torch.save(checkpoint, handle))
        print(json.dumps({"mode": mode, "epoch": epoch + 1, "epochs": epochs,
                          "seconds": history[-1]["seconds"], "batches": len(losses)}), flush=True)
    report = {"mode": mode, identity_key: identity, "p3_ready": False,
              "checkpoint_sha256": hashlib.sha256(checkpoint_path.read_bytes()).hexdigest(),
              "next_epoch": checkpoint["next_epoch"], "history": history,
              "provenance": checkpoint["provenance"],
              "limitations": ["synthetic pipeline check only; not model quality or P3 completion",
                              "P2 real-data rights and scene grouping remain blocked",
                              "checkpoint.pt is authoritative if report writing is interrupted"]}
    if data:
        report["limitations"] = ["internal experiment only; image rights unverified",
                                  "scene leakage unresolved; not an unbiased quality estimate",
                                  "no mAP/checkpoint selection/test evaluation; final epoch only",
                                  "checkpoint.pt is authoritative if report writing is interrupted"]
        report["split_counts"] = {k: len(v) for k, v in data.records.items()}
    atomic_write(output / ("real-report.json" if data else "synthetic-report.json"), lambda handle: handle.write(
        (json.dumps(report, indent=2, allow_nan=False) + "\n").encode()))
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--synthetic-smoke", action="store_true")
    modes.add_argument("--real-smoke", action="store_true")
    modes.add_argument("--real-train", action="store_true")
    parser.add_argument("--dataset", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--config", type=Path, default=ROOT / "ml/configs/baseline.json")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--resume", type=Path)
    args = parser.parse_args()
    try:
        config = json.loads(args.config.read_text(encoding="utf-8"))
        if args.synthetic_smoke and (args.dataset or args.manifest):
            raise ValueError("synthetic mode does not accept dataset inputs")
        data = None
        if not args.synthetic_smoke:
            if not args.dataset or not args.manifest:
                raise ValueError("real mode requires --dataset and --manifest")
            data = ManifestData(args.dataset, args.manifest, config)
        report = run(config, args.output, args.resume, data=data, real_smoke=args.real_smoke)
    except (ValueError, OSError, KeyError, TypeError, RuntimeError, EOFError, pickle.UnpicklingError) as error:
        parser.exit(2, f"training failed: {error}\n")
    print(json.dumps({key: report[key] for key in ("mode", "next_epoch", "checkpoint_sha256", "p3_ready")}))


if __name__ == "__main__":
    main()
