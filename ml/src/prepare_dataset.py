"""Audit a Pascal VOC dataset and produce a deterministic, grouped manifest."""

import argparse
from collections import Counter, defaultdict
import csv
import hashlib
import json
from pathlib import Path
import warnings
import xml.etree.ElementTree as ET

from PIL import Image, __version__ as pillow_version

CLASSES = ("with_mask", "without_mask", "mask_worn_incorrectly")
ALIASES = {"mask_weared_incorrect": "mask_worn_incorrectly"}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def read_sample(annotation, images):
    raw = annotation.read_bytes()
    if b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper():
        raise ValueError("XML declarations/entities are not allowed")
    xml = ET.fromstring(raw)
    filename = xml.findtext("filename", "")
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        raise ValueError("filename must be a basename")
    image_path = images / filename
    if image_path.resolve().parent != images.resolve():
        raise ValueError("image escapes dataset directory")
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        with Image.open(image_path) as image:
            image.load()
            width, height = image.size
            rgb = image.convert("RGB")
            pixels = sha256(f"{width}x{height}:".encode() + rgb.tobytes())
            small = rgb.convert("L").resize((9, 8), Image.Resampling.BILINEAR).tobytes()
    dhash = 0
    for y in range(8):
        for x in range(8):
            dhash = (dhash << 1) | (small[y * 9 + x] > small[y * 9 + x + 1])
    if (int(xml.findtext("size/width", "0")), int(xml.findtext("size/height", "0"))) != (width, height):
        raise ValueError("annotation dimensions differ from image")
    objects = []
    for obj in xml.findall("object"):
        label = obj.findtext("name", "").strip()
        label = ALIASES.get(label, label)
        if label not in CLASSES:
            raise ValueError(f"unknown class: {label}")
        box = [int(obj.findtext(f"bndbox/{key}", "")) for key in ("xmin", "ymin", "xmax", "ymax")]
        x1, y1, x2, y2 = box
        if not (0 <= x1 < x2 <= width and 0 <= y1 < y2 <= height):
            raise ValueError(f"invalid bbox: {box}")
        objects.append({"label": label, "bbox": box})
    if not objects:
        raise ValueError("empty annotation requires manual review")
    return {
        "image": f"images/{filename}", "annotation": f"annotations/{annotation.name}",
        "width": width, "height": height, "objects": objects,
        "image_sha256": sha256(image_path.read_bytes()), "pixel_sha256": pixels,
        "annotation_sha256": sha256(raw), "dhash": f"{dhash:016x}",
    }


def assign_splits(records, source_groups, seed):
    """Union scene IDs, exact duplicates and conservative near-duplicate candidates."""
    parents = list(range(len(records)))

    def root(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i

    def union(a, b):
        parents[root(b)] = root(a)

    seen = {}
    for i, record in enumerate(records):
        for kind, value in (("pixels", record["pixel_sha256"]), ("scene", source_groups.get(record["image"]))):
            if value is not None:
                key = (kind, value)
                if key in seen:
                    union(i, seen[key])
                seen[key] = i
        for j in range(i):
            if (int(record["dhash"], 16) ^ int(records[j]["dhash"], 16)).bit_count() <= 4:
                union(i, j)
    groups = defaultdict(list)
    for i, record in enumerate(records):
        groups[root(i)].append(record)
    for members in groups.values():
        group_id = sha256("\n".join(sorted(r["image"] for r in members)).encode())
        bucket = int(sha256(f"{seed}:{group_id}".encode()), 16) % 100
        split = "train" if bucket < 70 else "validation" if bucket < 85 else "test"
        for record in members:
            record.update(group=group_id, split=split, source_group=source_groups.get(record["image"]))
    return len(groups)


def audit(dataset, groups_path=None, seed=42):
    images, annotations = dataset / "images", dataset / "annotations"
    if not images.is_dir() or not annotations.is_dir():
        raise ValueError("dataset must contain images/ and annotations/")
    source_groups = {}
    if groups_path:
        with groups_path.open(encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames or not {"image", "group"}.issubset(reader.fieldnames):
                raise ValueError("scene CSV requires image,group columns")
            for row in reader:
                image, group = row["image"], (row["group"] or "").strip()
                if not image or not group or image in source_groups:
                    raise ValueError("scene CSV requires unique images and nonempty groups")
                source_groups[image] = group
    records, errors = [], []
    for annotation in sorted(annotations.glob("*.xml")):
        try:
            records.append(read_sample(annotation, images))
        except (ValueError, OSError, ET.ParseError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
            errors.append({"annotation": f"annotations/{annotation.name}", "error": str(error)})
    counts = Counter(r["image"] for r in records)
    if any(n > 1 for n in counts.values()):
        raise ValueError("multiple annotations reference the same image")
    if set(source_groups) - set(counts):
        raise ValueError("scene CSV contains unknown or rejected image")
    unreferenced = sorted(f"images/{p.name}" for p in images.iterdir() if p.is_file() and f"images/{p.name}" not in counts)
    group_count = assign_splits(records, source_groups, seed)
    distribution = {}
    for split in ("train", "validation", "test"):
        members = [r for r in records if r["split"] == split]
        labels = Counter(obj["label"] for r in members for obj in r["objects"])
        distribution[split] = {"images": len(members), "objects": {label: labels[label] for label in CLASSES}}
    missing_classes = [f"{split}:{label}" for split, info in distribution.items() for label, n in info["objects"].items() if not n]
    duplicates = defaultdict(list)
    for record in records:
        duplicates[record["pixel_sha256"]].append(record)
    conflicts = [
        [r["image"] for r in members]
        for members in duplicates.values()
        if len({json.dumps(sorted(r["objects"], key=lambda obj: (obj["label"], obj["bbox"])), sort_keys=True) for r in members}) > 1
    ]
    return {
        "schema_version": 1, "seed": seed, "target_ratio": [70, 15, 15],
        "pillow_version": pillow_version,
        "source_groups_sha256": sha256(groups_path.read_bytes()) if groups_path else None,
        "bbox_convention": "source pixel xyxy; no clipping or automatic VOC offset conversion",
        "near_duplicate_method": "64-bit dHash, grayscale bilinear 9x8, Hamming <= 4; connected components",
        "group_count": group_count, "source_group_coverage": len(source_groups),
        "exact_duplicate_groups": [[r["image"] for r in members] for members in duplicates.values() if len(members) > 1],
        "duplicate_annotation_conflicts": conflicts,
        "scene_leakage_verified": False,
        "limitations": ["dHash is a candidate heuristic, not proof of scene independence", "scene metadata requires human verification", "license/consent approval is external to this tool"],
        "errors": errors, "unreferenced_images": unreferenced, "missing_split_classes": missing_classes,
        "technical_checks_passed": bool(records) and not (errors or unreferenced or missing_classes or conflicts),
        "distribution": distribution, "records": records,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--groups", type=Path, help="CSV columns image,group; paths relative to dataset")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(args.dataset.resolve()):
        parser.error("output must be outside the source dataset")
    try:
        result = audit(args.dataset, args.groups, args.seed)
    except (ValueError, OSError, KeyError) as error:
        parser.error(str(error))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(args.output.suffix + ".tmp")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(args.output)
    print(json.dumps({key: result[key] for key in ("technical_checks_passed", "distribution", "group_count")}, indent=2))
    return 0 if result["technical_checks_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
