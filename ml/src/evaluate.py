"""Local internal baseline evaluation: validation selection precedes a sealed test run."""
import argparse
import hashlib
import json
from pathlib import Path
import pickle
import time

import numpy as np
import torch
from torchvision.models.detection import ssdlite320_mobilenet_v3_large
from torchvision.ops import box_iou

from train import CLASS_MAP, ManifestData, ROOT, atomic_write, digest, provenance, validate_config

THRESHOLDS = [i / 20 for i in range(1, 20)]
INFERENCE = {"score_thresh": 0.001, "nms_thresh": 0.55,
             "detections_per_img": 100, "topk_candidates": 300}
METHOD = {"version": 1, "operating_iou": 0.5, "ap_ious": [i / 100 for i in range(50, 100, 5)],
          "ap_recall_points": 101, "max_detections_per_image": 100,
          "selection": "macro_f1; ties choose higher threshold", "thresholds": THRESHOLDS,
          "ap": "class-aware greedy matching; 101-point interpolated AP; no area/crowd handling",
          "confusion": "rows=truth, columns=prediction; class-agnostic greedy IoU>=0.5",
          "localization_error": "unmatched prediction with same-class truth at 0.1<=IoU<0.5"}
LIMITATIONS = ["internal experiment only; image rights unverified; no publication/deployment",
               "scene leakage unresolved; not an unbiased generalization estimate",
               "fixed final epoch 30; no best-epoch selection or retraining",
               "AP is bounded by score floor/top-k/NMS; not the official COCO evaluator"]


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def save_json(path, value):
    atomic_write(path, lambda handle: handle.write(
        (json.dumps(value, indent=2, allow_nan=False) + "\n").encode()))


def clean_prediction(prediction, width, height):
    boxes, labels, scores = (prediction[key].detach().cpu() for key in ("boxes", "labels", "scores"))
    if (boxes.ndim != 2 or boxes.shape[1] != 4 or labels.shape != (len(boxes),)
            or scores.shape != (len(boxes),) or labels.dtype != torch.int64
            or not torch.isfinite(boxes).all() or not torch.isfinite(scores).all()
            or not ((labels >= 1) & (labels <= 3)).all()
            or not ((scores >= 0) & (scores <= 1)).all()
            or not ((boxes[:, 0] >= 0) & (boxes[:, 1] >= 0)
                    & (boxes[:, 2] <= width) & (boxes[:, 3] <= height)
                    & (boxes[:, 0] <= boxes[:, 2]) & (boxes[:, 1] <= boxes[:, 3])).all()):
        raise ValueError("invalid predictions in original image coordinates")
    positive = (boxes[:, 0] < boxes[:, 2]) & (boxes[:, 1] < boxes[:, 3])
    discarded = int((~positive).sum())
    boxes, labels, scores = boxes[positive], labels[positive], scores[positive]
    order = torch.argsort(scores, descending=True, stable=True)[:100]
    return {"boxes": boxes[order].tolist(), "labels": labels[order].tolist(),
            "scores": scores[order].tolist()}, discarded


def prepare(samples):
    prepared = []
    for sample in samples:
        truth, prediction = sample["truth"], sample["prediction"]
        overlaps = box_iou(torch.tensor(prediction["boxes"], dtype=torch.float64).reshape(-1, 4),
                           torch.tensor(truth["boxes"], dtype=torch.float64).reshape(-1, 4)).numpy()
        prepared.append({**sample, "iou": overlaps})
    return prepared


def class_curve(samples, label, iou, threshold=0):
    count = sum(s["truth"]["labels"].count(label) for s in samples)
    candidates = [(score, image, index) for image, s in enumerate(samples)
                  for index, (score, cls) in enumerate(zip(s["prediction"]["scores"], s["prediction"]["labels"]))
                  if cls == label and score >= threshold]
    candidates.sort(key=lambda item: (-item[0], item[1], item[2]))
    used = [set() for _ in samples]
    matches = []
    for _, image, index in candidates:
        s = samples[image]
        available = [j for j, cls in enumerate(s["truth"]["labels"]) if cls == label and j not in used[image]]
        best = max(available, key=lambda j: s["iou"][index, j], default=None)
        matched = best is not None and s["iou"][index, best] >= iou
        if matched:
            used[image].add(best)
        matches.append(int(matched))
    tp = np.cumsum(matches, dtype=float)
    precision = tp / np.arange(1, len(matches) + 1)
    recall = tp / count if count else np.zeros(len(matches))
    return count, matches, precision, recall


def operating_metrics(samples, threshold):
    rows = {}
    for label in (1, 2, 3):
        count, matches, _, _ = class_curve(samples, label, 0.5, threshold)
        tp, fp = sum(matches), len(matches) - sum(matches)
        precision = tp / len(matches) if matches else 0.0
        recall = tp / count if count else None
        f1 = 2 * tp / (count + len(matches)) if count else None
        rows[CLASS_MAP[str(label)]] = {"support": count, "tp": tp, "fp": fp, "fn": count - tp,
                                       "precision": precision, "recall": recall, "f1": f1}
    macro = {metric: float(np.mean([r[metric] for r in rows.values()
                                   if r["support"]])) if any(r["support"] for r in rows.values()) else None
             for metric in ("precision", "recall", "f1")}
    return {"per_class": rows, "macro": macro}


def select_threshold(samples):
    sweep = [{"threshold": threshold, **operating_metrics(samples, threshold)} for threshold in THRESHOLDS]
    if any(row["support"] == 0 for row in sweep[0]["per_class"].values()):
        raise ValueError("validation selection requires ground truth for all three classes")
    selected = max(sweep, key=lambda row: (row["macro"]["f1"], row["threshold"]))
    return selected["threshold"], sweep


def average_precision(samples):
    rows = {}
    for label in (1, 2, 3):
        values = []
        for iou in METHOD["ap_ious"]:
            count, _, precision, recall = class_curve(samples, label, iou)
            values.append(float(np.mean([max(precision[recall >= point], default=0.0)
                                         for point in np.linspace(0, 1, 101)])) if count else None)
        rows[CLASS_MAP[str(label)]] = {"ap50": values[0], "map50_95": float(np.mean(values))
                                      if values[0] is not None else None, "ap_by_iou": values}
    return {"per_class": rows, **{key: float(np.mean([r[key] for r in rows.values() if r[key] is not None]))
                                  if any(r[key] is not None for r in rows.values()) else None
                                  for key in ("ap50", "map50_95")}}


def error_analysis(samples, threshold):
    matrix = np.zeros((4, 4), dtype=int)
    rows = []
    for s in samples:
        truth, pred, overlaps = s["truth"], s["prediction"], s["iou"]
        used = set()
        errors = {key: 0 for key in ("missed", "wrong_class", "localization", "extra")}
        for i, score in enumerate(pred["scores"]):
            if score < threshold:
                continue
            label = pred["labels"][i]
            best = max((j for j in range(len(truth["labels"])) if j not in used),
                       key=lambda j: overlaps[i, j], default=None)
            if best is not None and overlaps[i, best] >= 0.5:
                used.add(best)
                actual = truth["labels"][best]
                matrix[actual, label] += 1
                errors["wrong_class"] += int(actual != label)
            else:
                matrix[0, label] += 1
                localized = any(cls == label and 0.1 <= overlaps[i, j] < 0.5
                                for j, cls in enumerate(truth["labels"]))
                errors["localization" if localized else "extra"] += 1
        for j, label in enumerate(truth["labels"]):
            if j not in used:
                matrix[label, 0] += 1
                errors["missed"] += 1
        rows.append({"image": s["image"], **errors})
    return {"labels": [CLASS_MAP[str(i)] for i in range(4)], "matrix": matrix.tolist(),
            "totals": {key: sum(row[key] for row in rows) for key in errors}, "images": rows}


def load_decision(path, expected_hash, identity):
    if not path or not expected_hash or sha256(path) != expected_hash:
        raise ValueError("test requires an unchanged validation decision and its SHA-256")
    decision = json.loads(Path(path).read_text())
    if (decision["stage"] != "validation" or decision["identity"] != identity
            or decision["threshold"] not in THRESHOLDS):
        raise ValueError("validation decision identity or threshold mismatch")
    return decision


def write_summary(output, report):
    lines = [f'# Internal {report["stage"]} evaluation', '',
             f'Images: {report["images"]}; threshold: {report["threshold"]}; fixed epoch: 30.', '',
             '| Class | Support | Precision | Recall | F1 | AP50 | mAP50:95 |',
             '|---|---:|---:|---:|---:|---:|---:|']
    for name, row in report["operating"]["per_class"].items():
        values = [row[key] for key in ("support", "precision", "recall", "f1")]
        values += [report["ap"]["per_class"][name][key] for key in ("ap50", "map50_95")]
        lines.append('| ' + name + ' | ' + ' | '.join('N/A' if v is None else f'{v:.4f}' for v in values) + ' |')
    labels = report["errors"]["labels"]
    lines += ['', '## Confusion matrix (truth rows, prediction columns)', '',
              '| Truth / Prediction | ' + ' | '.join(labels) + ' |', '|---|' + '---:|' * 4]
    lines += ['| ' + label + ' | ' + ' | '.join(map(str, row)) + ' |'
              for label, row in zip(labels, report["errors"]["matrix"])]
    lines += ['', '## Error categories', '', '| Category | Count |', '|---|---:|']
    lines += [f'| {key} | {value} |' for key, value in report['errors']['totals'].items()]
    lines += ['',
              'Localization/extra count unmatched predictions; missed counts unmatched truths, so one bad box can cause both.',
              'Confusion uses class-agnostic matching; PR/F1/AP use class-aware matching.', '',
              '| Image ID | Missed | Wrong class | Localization | Extra |', '|---|---:|---:|---:|---:|']
    ranked = sorted(report['errors']['images'], key=lambda r: -sum(r[k] for k in ('missed', 'wrong_class', 'localization', 'extra')))
    lines += ['| ' + row['image'] + ' | ' + ' | '.join(str(row[k]) for k in ('missed', 'wrong_class', 'localization', 'extra')) + ' |'
              for row in ranked[:10]]
    lines += ['', 'Full per-image error counts and numeric metrics: report.json.', '', '## Limitations', ''] + LIMITATIONS
    (output / 'summary.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    bars = []
    for i, (label, row) in enumerate(report['operating']['per_class'].items()):
        y = 35 + i * 50
        bars.append(f'<text x="10" y="{y}">{label}</text><rect x="210" y="{y-16}" width="{300*(row["f1"] or 0):.2f}" height="22" fill="#236bb0"/><text x="520" y="{y}">{row["f1"] if row["f1"] is not None else "N/A"}</text>')
    (output / 'f1.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="760" height="210"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" font-size="14">' + ''.join(bars) + '<text x="10" y="195">Per-class F1 at validation-selected threshold; internal data only.</text></g></svg>', encoding='utf-8')


def run(args):
    torch.set_num_threads(2)
    config = json.loads(args.config.read_text(encoding='utf-8'))
    validate_config(config)
    if sha256(args.checkpoint) != args.checkpoint_sha256:
        raise ValueError('checkpoint checksum mismatch')
    checkpoint = torch.load(args.checkpoint, map_location='cpu', weights_only=True)
    runtime = provenance()['runtime']
    if (checkpoint['schema_version'] != 1 or checkpoint['mode'] != 'real-train'
            or checkpoint['next_epoch'] != 30 or config['training']['epochs'] != 30
            or checkpoint['config'] != config or checkpoint['config_sha256'] != digest(config)
            or checkpoint['provenance']['runtime'] != runtime
            or checkpoint['dataset']['manifest_sha256'] != sha256(args.manifest)
            or checkpoint['dataset']['usage'] != 'internal-experiment'
            or checkpoint['dataset']['scene_leakage_verified'] is not False
            or checkpoint['dataset']['train_deploy_rights_approved'] is not False):
        raise ValueError('checkpoint config, runtime, epoch or dataset mismatch')
    if any(not torch.isfinite(value).all() for value in checkpoint['model'].values()):
        raise ValueError('non-finite checkpoint weights')
    identity = {'checkpoint_sha256': args.checkpoint_sha256, 'manifest_sha256': sha256(args.manifest),
                'config_sha256': digest(config), 'runtime': runtime, 'inference': INFERENCE,
                'method': METHOD, 'evaluator_sha256': sha256(__file__)}
    decision = load_decision(args.decision, args.decision_sha256, identity) if args.stage == 'test' else None
    if args.stage == 'validation' and (args.decision or args.decision_sha256):
        raise ValueError('validation does not accept a test decision')
    output, dataset = args.output.resolve(), args.dataset.resolve()
    if output.is_relative_to(ROOT) or output.is_relative_to(dataset) or dataset.is_relative_to(output):
        raise ValueError('output must be outside source and separate from dataset')
    if output.exists() and any(output.iterdir()):
        raise ValueError('output must be empty; never overwrite prior evaluation')
    data = ManifestData(args.dataset, args.manifest, config, splits=(args.stage,))
    model = ssdlite320_mobilenet_v3_large(weights=None, weights_backbone=None, num_classes=4, **INFERENCE).cpu()
    model.load_state_dict(checkpoint['model'], strict=True)
    model.eval()
    samples, discarded, offset = [], 0, 0
    started = time.perf_counter()
    with torch.inference_mode():
        for images, targets in data.batches(args.stage):
            predictions = model(images)
            if len(predictions) != len(images):
                raise ValueError('prediction count mismatch')
            for image, target, prediction in zip(images, targets, predictions):
                height, width = image.shape[-2:]
                clean, count = clean_prediction(prediction, width, height)
                discarded += count
                samples.append({'image': data.records[args.stage][offset]['image'],
                                'truth': {key: value.tolist() for key, value in target.items()},
                                'prediction': clean})
                offset += 1
            print(json.dumps({'stage': args.stage, 'images': offset}), flush=True)
    prepared = prepare(samples)
    threshold, sweep = (decision['threshold'], None) if decision else select_threshold(prepared)
    report = {'stage': args.stage, 'identity': identity, 'images': len(samples), 'threshold': threshold,
              'p3_ready': False, 'discarded_zero_area_boxes': discarded,
              'operating': operating_metrics(prepared, threshold), 'ap': average_precision(prepared),
              'errors': error_analysis(prepared, threshold), 'threshold_sweep': sweep,
              'seconds': time.perf_counter() - started, 'limitations': LIMITATIONS,
              'config': config, 'training_provenance': checkpoint['provenance'],
              'evaluation_provenance': provenance(),
              'validation_decision_sha256': args.decision_sha256 if decision else None}
    output.mkdir(parents=True, exist_ok=True)
    save_json(output / 'predictions.json', samples)
    report['predictions_sha256'] = sha256(output / 'predictions.json')
    save_json(output / 'report.json', report)
    write_summary(output, report)
    if not decision:
        save_json(output / 'decision.json', {'stage': 'validation', 'identity': identity, 'threshold': threshold,
                                           'report_sha256': sha256(output / 'report.json')})
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=('validation', 'test'))
    for name in ('checkpoint', 'dataset', 'manifest', 'output'):
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--checkpoint-sha256', required=True)
    parser.add_argument('--config', type=Path, default=ROOT / 'ml/configs/internal-baseline.json')
    parser.add_argument('--decision', type=Path)
    parser.add_argument('--decision-sha256')
    args = parser.parse_args()
    try:
        report = run(args)
    except (ValueError, OSError, KeyError, TypeError, RuntimeError, EOFError, pickle.UnpicklingError) as error:
        parser.exit(2, f'evaluation failed: {error}\n')
    print(json.dumps({'stage': report['stage'], 'images': report['images'], 'threshold': report['threshold'],
                      'macro': report['operating']['macro'], 'ap50': report['ap']['ap50'],
                      'map50_95': report['ap']['map50_95']}))


if __name__ == '__main__':
    main()
