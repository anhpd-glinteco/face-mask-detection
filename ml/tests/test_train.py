"""Synthetic trainer checks; Torch is required, never silently skipped."""

import copy
import importlib.util
import json
from pathlib import Path
import pickle
import random
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
import torch


ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("train", ROOT / "ml/src/train.py")
train = importlib.util.module_from_spec(spec)
spec.loader.exec_module(train)


class TinyDetector(torch.nn.Module):
    """Exercise optimizer and all three RNG streams without expensive detector steps."""

    def __init__(self, **kwargs):
        super().__init__()
        if kwargs != {"weights": None, "weights_backbone": None, "num_classes": 4}:
            raise AssertionError("unexpected model arguments")
        self.weight = torch.nn.Parameter(torch.rand(3))

    def forward(self, images, targets=None):
        if self.training:
            value = images[0].mean() + random.random() + float(np.random.random()) + torch.rand(())
            return {"loss": (self.weight - value).square().sum()}
        return [{"boxes": torch.tensor([[0., 1., 20., 30.]]),
                 "labels": torch.tensor([1]), "scores": torch.tensor([0.5])} for _ in images]


class TrainerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.config = json.loads((ROOT / "ml/configs/baseline.json").read_text())

    def checkpoint(self, output):
        return torch.load(output / "checkpoint.pt", weights_only=True)

    def test_synthetic_inputs_keep_original_coordinates(self):
        images, targets = train.synthetic_batch()
        self.assertEqual(len(images), 2)
        for image, target in zip(images, targets):
            self.assertEqual(image.shape, (3, 64, 80))
            self.assertEqual(image.dtype, torch.float32)
            self.assertTrue(((image >= 0) & (image <= 1)).all())
            self.assertEqual(target["labels"].tolist(), [1, 2, 3])
            self.assertEqual(target["labels"].dtype, torch.int64)
            boxes = target["boxes"]
            self.assertEqual(boxes.dtype, torch.float32)
            self.assertTrue((boxes[:, :2] >= 0).all())
            self.assertTrue((boxes[:, :2] < boxes[:, 2:]).all())
            self.assertTrue((boxes[:, 2:] <= torch.tensor([80, 64])).all())

    def test_epoch_boundary_resume_matches_uninterrupted_run(self):
        self.config["smoke"]["epochs"] = 2
        self.config["training"]["scheduler"]["step_size"] = 1
        full, interrupted = self.root / "full", self.root / "interrupted"
        train.run(self.config, full, model_factory=TinyDetector)
        real_epoch = train.train_epoch
        calls = 0

        def interrupt_second_epoch(*args):
            nonlocal calls
            calls += 1
            if calls == 2:
                # Consume RNG and modify parameters before the simulated notebook disconnect.
                real_epoch(*args)
                raise KeyboardInterrupt()
            return real_epoch(*args)

        with patch.object(train, "train_epoch", side_effect=interrupt_second_epoch):
            with self.assertRaises(KeyboardInterrupt):
                train.run(self.config, interrupted, model_factory=TinyDetector)
        self.assertEqual(self.checkpoint(interrupted)["next_epoch"], 1)
        train.run(self.config, interrupted, interrupted / "checkpoint.pt", model_factory=TinyDetector)
        expected, actual = self.checkpoint(full), self.checkpoint(interrupted)
        self.assertTrue(torch.equal(expected["model"]["weight"], actual["model"]["weight"]))
        self.assertEqual(expected["scheduler"], actual["scheduler"])
        self.assertEqual(expected["optimizer"]["param_groups"], actual["optimizer"]["param_groups"])
        for parameter, state in expected["optimizer"]["state"].items():
            self.assertTrue(torch.equal(state["momentum_buffer"], actual["optimizer"]["state"][parameter]["momentum_buffer"]))
        self.assertEqual(expected["rng"]["python"], actual["rng"]["python"])
        self.assertEqual(expected["rng"]["numpy"], actual["rng"]["numpy"])
        self.assertTrue(torch.equal(expected["rng"]["torch"], actual["rng"]["torch"]))
        self.assertEqual([entry["batch_losses"] for entry in expected["history"]],
                         [entry["batch_losses"] for entry in actual["history"]])

    def test_resume_mismatch_corruption_and_existing_output_are_rejected(self):
        output = self.root / "run"
        train.run(self.config, output, model_factory=TinyDetector)
        path = output / "checkpoint.pt"
        original = path.read_bytes()
        changed = copy.deepcopy(self.config)
        changed["seed"] += 1
        with self.assertRaisesRegex(ValueError, "mismatch"):
            train.run(changed, output, path, model_factory=TinyDetector)
        with self.assertRaisesRegex(ValueError, "not empty"):
            train.run(self.config, output, model_factory=TinyDetector)
        checkpoint = self.checkpoint(output)
        checkpoint["synthetic_data"] = "wrong-data"
        torch.save(checkpoint, path)
        with self.assertRaisesRegex(ValueError, "mismatch"):
            train.run(self.config, output, path, model_factory=TinyDetector)
        path.write_bytes(b"corrupt checkpoint")
        with self.assertRaises((pickle.UnpicklingError, RuntimeError, EOFError)):
            train.run(self.config, output, path, model_factory=TinyDetector)
        self.assertEqual(path.read_bytes(), b"corrupt checkpoint")
        path.write_bytes(original)
        report = train.run(self.config, output, path, model_factory=TinyDetector)
        self.assertEqual(path.read_bytes(), original)
        self.assertFalse(report["p3_ready"])

    def test_atomic_write_preserves_checkpoint_on_serialization_or_replace_failure(self):
        path = self.root / "checkpoint.pt"
        path.write_bytes(b"previous checkpoint")

        def failed_writer(handle):
            handle.write(b"partial write")
            raise OSError("disk full")

        with self.assertRaises(OSError):
            train.atomic_write(path, failed_writer)
        with patch.object(train.os, "replace", side_effect=OSError("replace failed")):
            with self.assertRaises(OSError):
                train.atomic_write(path, lambda handle: handle.write(b"new checkpoint"))
        self.assertEqual(path.read_bytes(), b"previous checkpoint")
        self.assertEqual(list(self.root.iterdir()), [path])

    def test_nonfinite_training_does_not_advance_checkpoint(self):
        output = self.root / "run"
        self.config["smoke"]["epochs"] = 2
        real_epoch = train.train_epoch
        calls = 0

        def bad_epoch(model, optimizer, batches):
            nonlocal calls
            calls += 1
            if calls == 2:
                with torch.no_grad():
                    model.weight.fill_(float("nan"))
            return real_epoch(model, optimizer, batches)

        with patch.object(train, "train_epoch", side_effect=bad_epoch):
            with self.assertRaisesRegex(ValueError, "non-finite synthetic loss"):
                train.run(self.config, output, model_factory=TinyDetector)
        self.assertEqual(self.checkpoint(output)["next_epoch"], 1)

    def test_nonfinite_gradient_is_rejected(self):
        model = TinyDetector(weights=None, weights_backbone=None, num_classes=4)
        model.weight.register_hook(lambda gradient: gradient * float("nan"))
        optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
        with self.assertRaisesRegex(ValueError, "non-finite gradient"):
            train.train_epoch(model, optimizer, 1)

    def test_invalid_prediction_coordinates_are_rejected(self):
        model = TinyDetector(weights=None, weights_backbone=None, num_classes=4)
        with patch.object(model, "forward", return_value=[
                {"boxes": torch.tensor([[0., 0., 81., 64.]]),
                 "labels": torch.tensor([1]), "scores": torch.tensor([0.5])}] * 2):
            with self.assertRaisesRegex(ValueError, "invalid synthetic predictions"):
                train.check_predictions(model, 1)

    def test_cli_requires_synthetic_and_rejects_dataset_argument(self):
        for arguments in (["--output", str(self.root / "missing")],
                          ["--synthetic-smoke", "--output", str(self.root / "missing"), "--dataset", "real"]):
            result = subprocess.run([sys.executable, str(ROOT / "ml/src/train.py"), *arguments],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertFalse((self.root / "missing").exists())

    def test_real_ssdlite_cpu_smoke(self):
        # Bound threads for a fast, repeatable CI smoke rather than host oversubscription.
        previous_threads = torch.get_num_threads()
        self.addCleanup(torch.set_num_threads, previous_threads)
        torch.set_num_threads(2)
        output = self.root / "ssdlite"
        report = train.run(self.config, output)
        self.assertEqual(report["mode"], "synthetic-smoke")
        self.assertEqual(report["next_epoch"], 1)
        self.assertEqual(len(report["history"][0]["batch_losses"]), 5)
        self.assertTrue((output / "synthetic-report.json").is_file())
        self.assertEqual(report["checkpoint_sha256"], train.hashlib.sha256((output / "checkpoint.pt").read_bytes()).hexdigest())
        checkpoint = self.checkpoint(output)
        self.assertEqual(checkpoint["config"]["class_map"], train.CLASS_MAP)
        self.assertTrue(all(torch.isfinite(value).all() for value in checkpoint["model"].values()))


if __name__ == "__main__":
    unittest.main()
