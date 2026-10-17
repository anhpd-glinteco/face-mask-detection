"""Internal real-data adapter and resume checks using generated fixture media."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image
import torch
from test_train import train, TinyDetector


class RealTrainerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.dataset = self.root / 'dataset'
        self.dataset.mkdir()
        self.manifest = self.root / 'manifest.json'
        self.config = json.loads((train.ROOT / 'ml/configs/internal-baseline.json').read_text())
        self.records = []
        for i in range(6):
            image = self.dataset / f'{i}.png'
            annotation = self.dataset / f'{i}.xml'
            Image.new('RGB', (80, 64), (20 + i, 50, 70)).save(image)
            annotation.write_text('<fixture/>')
            self.records.append({'image': image.name, 'annotation': annotation.name,
                'image_sha256': hashlib.sha256(image.read_bytes()).hexdigest(),
                'annotation_sha256': hashlib.sha256(annotation.read_bytes()).hexdigest(),
                'width': 80, 'height': 64, 'group': str(i),
                'split': 'train' if i < 4 else ('validation' if i == 4 else 'test'),
                'objects': [{'label': 'with_mask', 'bbox': [1, 2, 25, 40]},
                            {'label': 'mask_worn_incorrectly', 'bbox': [30, 3, 60, 45]}]})
        self.write_manifest()

    def write_manifest(self):
        self.manifest.write_text(json.dumps({'schema_version': 1, 'technical_checks_passed': True,
            'errors': [], 'missing_split_classes': [], 'records': self.records}))
        self.config['data']['manifest_sha256'] = hashlib.sha256(self.manifest.read_bytes()).hexdigest()

    def data(self):
        return train.ManifestData(self.dataset, self.manifest, self.config)

    def test_adapter_preserves_coordinates_and_never_reads_test_media(self):
        (self.dataset / '5.png').unlink()
        (self.dataset / '5.xml').unlink()
        data = self.data()
        images, targets = next(data.batches('validation'))
        self.assertEqual(images[0].shape, (3, 64, 80))
        self.assertTrue(((images[0] >= 0) & (images[0] <= 1)).all())
        self.assertEqual(targets[0]['labels'].tolist(), [1, 3])
        self.assertEqual(targets[0]['boxes'].tolist(), [[1, 2, 25, 40], [30, 3, 60, 45]])
        self.assertEqual(len(list(data.batches('train'))), 2)

    def test_scope_hash_files_paths_targets_and_split_groups_are_checked(self):
        original = copy.deepcopy(self.records)
        self.config['data']['usage'] = 'deploy'
        with self.assertRaises(ValueError):
            self.data()
        self.config['data']['usage'] = 'internal-experiment'
        self.config['data']['manifest_sha256'] = 'wrong'
        with self.assertRaises(ValueError):
            self.data()
        for mutate in (lambda r: r[0].update(image='../outside.png'),
                       lambda r: r[0].update(image_sha256='wrong'),
                       lambda r: r[0]['objects'][0].update(bbox=[0, 0, 81, 50]),
                       lambda r: r[4].update(group='0'),
                       lambda r: r[0].update(split='other')):
            self.records = copy.deepcopy(original)
            mutate(self.records)
            self.write_manifest()
            with self.assertRaises(ValueError):
                self.data()

    def test_real_epoch_resume_matches_and_rejects_changed_manifest_or_mode(self):
        self.config['training']['epochs'] = 2
        data = self.data()
        full, partial = self.root / 'full', self.root / 'partial'
        train.run(self.config, full, model_factory=TinyDetector, data=data)
        epoch = train.train_epoch
        calls = 0

        def interrupt(*args):
            nonlocal calls
            calls += 1
            result = epoch(*args)
            if calls == 2:
                raise KeyboardInterrupt()
            return result

        with patch.object(train, 'train_epoch', side_effect=interrupt):
            with self.assertRaises(KeyboardInterrupt):
                train.run(self.config, partial, model_factory=TinyDetector, data=data)
        path = partial / 'checkpoint.pt'
        train.run(self.config, partial, path, model_factory=TinyDetector, data=data)
        expected = torch.load(full / 'checkpoint.pt', weights_only=True)
        actual = torch.load(path, weights_only=True)
        self.assertTrue(torch.equal(expected['model']['weight'], actual['model']['weight']))
        self.assertEqual([h['batch_losses'] for h in expected['history']],
                         [h['batch_losses'] for h in actual['history']])
        with self.assertRaisesRegex(ValueError, 'mismatch'):
            train.run(self.config, partial, path, model_factory=TinyDetector, data=data, real_smoke=True)
        data.identity['manifest_sha256'] = 'changed'
        with self.assertRaisesRegex(ValueError, 'mismatch'):
            train.run(self.config, partial, path, model_factory=TinyDetector, data=data)
        report = json.loads((full / 'real-report.json').read_text())
        self.assertEqual(report['split_counts'], {'train': 4, 'validation': 1})
        self.assertFalse(report['p3_ready'])

    def test_real_detector_accepts_fixture_manifest(self):
        previous = torch.get_num_threads()
        self.addCleanup(torch.set_num_threads, previous)
        torch.set_num_threads(2)
        report = train.run(self.config, self.root / 'detector', data=self.data(), real_smoke=True)
        self.assertEqual(report['mode'], 'real-smoke')
        self.assertEqual(len(report['history'][0]['batch_losses']), 2)


if __name__ == '__main__':
    unittest.main()
