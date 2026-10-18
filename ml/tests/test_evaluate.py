"""Known-answer metrics and validation/test isolation; no real dataset required."""
import argparse
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import torch
from PIL import Image
from test_train import train

sys.path.insert(0, str(train.ROOT / 'ml/src'))
try:
    spec = importlib.util.spec_from_file_location('evaluate', train.ROOT / 'ml/src/evaluate.py')
    evaluate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(evaluate)
finally:
    sys.path.pop(0)


def sample(boxes=None, labels=None, scores=None, truth_labels=None, truth_boxes=None):
    return {'image': 'fixture.png',
            'truth': {'boxes': [[0., 0., 10., 10.]] if truth_boxes is None else truth_boxes,
                      'labels': [1] if truth_labels is None else truth_labels},
            'prediction': {'boxes': [[0., 0., 10., 10.]] if boxes is None else boxes,
                           'labels': [1] if labels is None else labels,
                           'scores': [.8] if scores is None else scores}}


class MetricsTests(unittest.TestCase):
    def test_perfect_and_absent_class(self):
        samples = evaluate.prepare([sample()])
        metrics = evaluate.operating_metrics(samples, .5)
        self.assertEqual(metrics['per_class']['with_mask']['f1'], 1)
        self.assertIsNone(metrics['per_class']['without_mask']['f1'])
        ap = evaluate.average_precision(samples)
        self.assertEqual(ap['map50_95'], 1)
        self.assertIsNone(ap['per_class']['without_mask']['ap50'])

    def test_duplicate_and_false_positive_before_true_positive(self):
        s = sample(boxes=[[20., 20., 30., 30.], [0., 0., 10., 10.], [0., 0., 10., 10.]],
                   labels=[1, 1, 1], scores=[.9, .8, .7])
        samples = evaluate.prepare([s])
        row = evaluate.operating_metrics(samples, .5)['per_class']['with_mask']
        self.assertEqual((row['tp'], row['fp'], row['fn']), (1, 2, 0))
        self.assertAlmostEqual(row['f1'], .5)
        self.assertAlmostEqual(evaluate.average_precision(samples)['ap50'], .5)

    def test_empty_predictions_and_empty_truth(self):
        samples = evaluate.prepare([sample(boxes=[], labels=[], scores=[])])
        self.assertEqual(evaluate.average_precision(samples)['map50_95'], 0)
        self.assertEqual(evaluate.operating_metrics(samples, .5)['per_class']['with_mask']['fn'], 1)
        samples = evaluate.prepare([sample(truth_boxes=[], truth_labels=[])])
        self.assertIsNone(evaluate.average_precision(samples)['ap50'])
        self.assertEqual(evaluate.error_analysis(samples, .5)['totals']['extra'], 1)

    def test_iou_boundary_and_greedy_one_to_one(self):
        samples = evaluate.prepare([sample(boxes=[[0., 0., 5., 10.]])])
        self.assertEqual(evaluate.operating_metrics(samples, .5)['per_class']['with_mask']['tp'], 1)
        ap = evaluate.average_precision(samples)['per_class']['with_mask']['ap_by_iou']
        self.assertEqual(ap, [1.] + [0.] * 9)
        self.assertAlmostEqual(evaluate.average_precision(samples)['map50_95'], .1)

    def test_101_point_interpolation_and_best_unmatched_truth(self):
        s = sample(truth_boxes=[[0., 0., 10., 10.], [20., 0., 30., 10.]], truth_labels=[1, 1])
        self.assertAlmostEqual(evaluate.average_precision(evaluate.prepare([s]))['ap50'], 51 / 101)
        s = sample(boxes=[[0., 0., 10., 10.], [0., 0., 10., 10.]], labels=[1, 1], scores=[.9, .8],
                   truth_boxes=[[0., 0., 10., 10.], [1., 0., 11., 10.]], truth_labels=[1, 1])
        self.assertEqual(evaluate.operating_metrics(evaluate.prepare([s]), .5)['per_class']['with_mask']['tp'], 2)

    def test_confusion_and_error_categories(self):
        samples = evaluate.prepare([sample(labels=[2]),
            sample(boxes=[[0., 0., 4., 10.]]), sample(boxes=[[20., 20., 30., 30.]])])
        result = evaluate.error_analysis(samples, .5)
        self.assertEqual(result['matrix'][1][2], 1)
        self.assertEqual(result['matrix'][1][0], 2)
        self.assertEqual(result['matrix'][0][1], 2)
        self.assertEqual(result['totals'], {'missed': 2, 'wrong_class': 1, 'localization': 1, 'extra': 1})
        row = evaluate.operating_metrics(samples[:1], .5)['per_class']
        self.assertEqual(row['with_mask']['fn'], 1)
        self.assertEqual(row['without_mask']['fp'], 1)

    def test_threshold_tie_and_missing_validation_class(self):
        samples = evaluate.prepare([sample(labels=[label], truth_labels=[label], scores=[.5]) for label in (1, 2, 3)])
        threshold, sweep = evaluate.select_threshold(samples)
        self.assertEqual(threshold, .5)
        self.assertEqual(len(sweep), 19)
        self.assertEqual(sweep[0]['macro']['f1'], 1)
        with self.assertRaises(ValueError):
            evaluate.select_threshold(samples[:1])

    def test_prediction_validation_and_zero_area(self):
        prediction = {'boxes': torch.tensor([[0., 0., 10., 10.], [0., 10., 5., 10.]]),
                      'labels': torch.tensor([1, 2]), 'scores': torch.tensor([.7, .8])}
        clean, discarded = evaluate.clean_prediction(prediction, 10, 10)
        self.assertEqual(discarded, 1)
        self.assertEqual(clean['labels'], [1])
        for key, value in [('boxes', torch.tensor([[0., 0., float('nan'), 10.], [0., 0., 1., 1.]])),
                           ('boxes', torch.tensor([[5., 0., 1., 10.], [0., 0., 1., 1.]])),
                           ('boxes', torch.tensor([[0., 0., 11., 10.], [0., 0., 1., 1.]])),
                           ('scores', torch.tensor([1.1, .5])), ('labels', torch.tensor([1., 2.]))]:
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                evaluate.clean_prediction({**prediction, key: value}, 10, 10)
        many = {'boxes': torch.tensor([[0., 0., 1., 1.]] * 120),
                'labels': torch.ones(120, dtype=torch.int64), 'scores': torch.linspace(0, 1, 120)}
        clean, _ = evaluate.clean_prediction(many, 10, 10)
        self.assertEqual(len(clean['scores']), 100)
        self.assertEqual(clean['scores'][0], 1)


class FixtureDetector(torch.nn.Module):
    def forward(self, images):
        return [{'boxes': torch.tensor([[0., 0., 10., 10.], [20., 0., 30., 10.], [40., 0., 50., 10.]]),
                 'labels': torch.tensor([1, 2, 3]), 'scores': torch.tensor([.7, .7, .7])} for _ in images]


class EvaluationFlowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        dataset = self.root / 'data'
        dataset.mkdir()
        config = json.loads((train.ROOT / 'ml/configs/internal-baseline.json').read_text())
        records = []
        for i, split in enumerate(('train', 'train', 'validation', 'test')):
            image, annotation = dataset / f'{i}.png', dataset / f'{i}.xml'
            Image.new('RGB', (80, 64)).save(image)
            annotation.write_text('<fixture/>')
            records.append({'image': image.name, 'annotation': annotation.name, 'group': str(i),
                            'image_sha256': evaluate.sha256(image), 'annotation_sha256': evaluate.sha256(annotation),
                            'split': split, 'width': 80, 'height': 64,
                            'objects': [{'label': train.CLASS_MAP[str(label)], 'bbox': [x, 0, x+10, 10]}
                                        for label, x in ((1, 0), (2, 20), (3, 40))]})
        manifest = self.root / 'manifest.json'
        manifest.write_text(json.dumps({'schema_version': 1, 'technical_checks_passed': True,
                                       'errors': [], 'missing_split_classes': [], 'records': records}))
        config['data']['manifest_sha256'] = evaluate.sha256(manifest)
        config_path = self.root / 'config.json'
        config_path.write_text(json.dumps(config))
        torch.set_num_threads(2)
        checkpoint = self.root / 'checkpoint.pt'
        torch.save({'schema_version': 1, 'mode': 'real-train', 'next_epoch': 30, 'config': config,
                    'config_sha256': train.digest(config), 'provenance': train.provenance(),
                    'dataset': train.ManifestData(dataset, manifest, config).identity,
                    'model': FixtureDetector().state_dict()}, checkpoint)
        self.args = argparse.Namespace(stage='validation', checkpoint=checkpoint,
                    checkpoint_sha256=evaluate.sha256(checkpoint), config=config_path,
                    dataset=dataset, manifest=manifest, output=self.root / 'validation',
                    decision=None, decision_sha256=None)
        self.factory = patch.object(evaluate, 'ssdlite320_mobilenet_v3_large', return_value=FixtureDetector())
        self.factory.start()
        self.addCleanup(self.factory.stop)

    def validation(self):
        report = evaluate.run(self.args)
        decision = self.args.output / 'decision.json'
        self.args = argparse.Namespace(**{**vars(self.args), 'stage': 'test', 'output': self.root / 'test',
                                          'decision': decision, 'decision_sha256': evaluate.sha256(decision)})
        return report

    def test_validation_never_reads_test_or_train_media_then_test_uses_locked_threshold(self):
        for i in (0, 1, 3):
            (self.args.dataset / f'{i}.png').rename(self.args.dataset / f'{i}.saved')
        report = self.validation()
        self.assertEqual(report['images'], 1)
        self.assertEqual(report['threshold'], .65)  # float32 .7 is below the exact grid value .7.
        with self.assertRaises(FileNotFoundError):
            evaluate.run(self.args)
        (self.args.dataset / '3.saved').rename(self.args.dataset / '3.png')
        result = evaluate.run(self.args)
        self.assertEqual(result['threshold'], report['threshold'])
        self.assertEqual(result['ap']['map50_95'], 1)
        self.assertTrue((self.args.output / 'f1.svg').exists())
        self.assertTrue((self.args.output / 'summary.md').exists())
        with self.assertRaises(ValueError):
            evaluate.run(self.args)

    def test_test_requires_checksum_and_matching_identity_before_opening_data(self):
        self.validation()
        for change in ({'decision_sha256': 'wrong'}, {'decision': None}, {'checkpoint_sha256': 'wrong'}):
            with self.subTest(change=change), patch.object(evaluate, 'ManifestData') as loader:
                with self.assertRaises(ValueError):
                    evaluate.run(argparse.Namespace(**{**vars(self.args), **change}))
                loader.assert_not_called()
        decision = json.loads(self.args.decision.read_text())
        decision['identity']['method']['version'] = 999
        self.args.decision.write_text(json.dumps(decision))
        self.args.decision_sha256 = evaluate.sha256(self.args.decision)
        with patch.object(evaluate, 'ManifestData') as loader:
            with self.assertRaises(ValueError):
                evaluate.run(self.args)
            loader.assert_not_called()

    def test_bad_runtime_config_and_selected_media_are_rejected(self):
        checkpoint = torch.load(self.args.checkpoint, weights_only=True)
        checkpoint['provenance']['runtime']['torch'] = 'wrong'
        torch.save(checkpoint, self.args.checkpoint)
        self.args.checkpoint_sha256 = evaluate.sha256(self.args.checkpoint)
        with self.assertRaises(ValueError):
            evaluate.run(self.args)
        checkpoint['provenance'] = train.provenance()
        torch.save(checkpoint, self.args.checkpoint)
        self.args.checkpoint_sha256 = evaluate.sha256(self.args.checkpoint)
        (self.args.dataset / '2.xml').write_text('changed')
        with self.assertRaises(ValueError):
            evaluate.run(self.args)


if __name__ == '__main__':
    unittest.main()
