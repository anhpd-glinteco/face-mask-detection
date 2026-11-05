"""Offline initialization checks; generated weights are fixtures, not COCO evidence."""
import hashlib
from pathlib import Path
import tempfile
import unittest

import torch
from test_train import train


class PretrainedTests(unittest.TestCase):
    def test_loading_excludes_only_classification_and_checks_hash(self):
        torch.set_num_threads(2)
        model = train.ssdlite320_mobilenet_v3_large(weights=None, weights_backbone=None, num_classes=4)
        before = {key: value.clone() for key, value in model.state_dict().items()}
        source = {key: torch.zeros_like(value) for key, value in before.items()}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'fixture.pt'
            torch.save(source, path)
            initialization = {'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
            receipt = train.load_pretrained(model, initialization)
            self.assertGreater(receipt['loaded_tensors'], 0)
            for key, value in model.state_dict().items():
                expected = before[key] if key.startswith('head.classification_head.') else source[key]
                self.assertTrue(torch.equal(value, expected), key)
            initialization['sha256'] = '0' * 64
            with self.assertRaisesRegex(ValueError, 'checksum'):
                train.load_pretrained(model, initialization)
            initialization['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
            source.pop(next(key for key in source if key.startswith('backbone.')))
            torch.save(source, path)
            initialization['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
            with self.assertRaisesRegex(ValueError, 'keys mismatch'):
                train.load_pretrained(model, initialization)
