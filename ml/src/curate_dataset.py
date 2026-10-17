"""Apply checksum-pinned review decisions to a new copy; never edit source data."""

import argparse
import json
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET

from prepare_dataset import read_sample, sha256


def inventory(root):
    return {p.relative_to(root).as_posix(): sha256(p.read_bytes())
            for p in sorted(root.rglob("*")) if p.is_file()}


def curate(dataset, decisions_path, output, log_path):
    dataset, output, log_path = dataset.resolve(), output.resolve(), log_path.resolve()
    if (output.exists() or log_path.exists() or output.is_relative_to(dataset)
            or dataset.is_relative_to(output) or log_path.is_relative_to(dataset)
            or log_path.is_relative_to(output)):
        raise ValueError("use a new output directory and new log outside both datasets")
    if any(p.is_symlink() for p in dataset.rglob("*")):
        raise ValueError("source symlinks are not supported")
    before = inventory(dataset)
    decisions_raw = decisions_path.read_bytes()
    decisions = json.loads(decisions_raw)["decisions"]
    annotations = sorted((dataset / "annotations").glob("*.xml"))
    names = {p.stem for p in annotations}
    if not names or names != {p.stem for p in (dataset / "images").glob("*.png")}:
        raise ValueError("expected matching PNG/XML basenames")
    if set(decisions) - names:
        raise ValueError("review references unknown samples")
    replacements = {}
    for name, decision in decisions.items():
        for kind, suffix in (("images", "png"), ("annotations", "xml")):
            key = f"{kind}/{name}.{suffix}"
            if before[key] != decision[f"{kind}_sha256"]:
                raise ValueError(f"review checksum mismatch: {key}")
        if not decision["reason"].strip() or decision["action"] not in ("exclude", "fix_bbox"):
            raise ValueError("review requires a reason and supported action")
        if decision["action"] == "fix_bbox":
            raw = (dataset / "annotations" / f"{name}.xml").read_bytes()
            if b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper():
                raise ValueError("XML declarations/entities are not allowed")
            xml = ET.fromstring(raw)
            objects = xml.findall("object")
            for update in decision["bbox_updates"]:
                box = objects[update["object_index"]].find("bndbox")
                keys = ("xmin", "ymin", "xmax", "ymax")
                if [int(box.findtext(k)) for k in keys] != update["before"]:
                    raise ValueError("review bbox does not match source")
                if len(update["after"]) != 4:
                    raise ValueError("review bbox requires four coordinates")
                for key, value in zip(keys, update["after"]):
                    box.find(key).text = str(value)
            replacements[name] = ET.tostring(xml, encoding="utf-8") + b"\n"
    (output / "images").mkdir(parents=True)
    (output / "annotations").mkdir()
    for annotation in annotations:
        name = annotation.stem
        if decisions.get(name, {}).get("action") == "exclude":
            continue
        shutil.copy2(dataset / "images" / f"{name}.png", output / "images" / f"{name}.png")
        destination = output / "annotations" / annotation.name
        if name in replacements:
            destination.write_bytes(replacements[name])
        else:
            shutil.copy2(annotation, destination)
        read_sample(destination, output / "images")
    after = inventory(dataset)
    if before != after:
        raise ValueError("source changed during curation; do not use this output")
    result = {"source": str(dataset), "curated": str(output),
              "decisions_sha256": sha256(decisions_raw), "source_unchanged": True,
              "source_before": before, "source_after": after,
              "curated_files": inventory(output), "decisions": decisions}
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ("dataset", "decisions", "output", "log"):
        parser.add_argument(f"--{arg}", type=Path, required=True)
    args = parser.parse_args()
    try:
        result = curate(args.dataset, args.decisions, args.output, args.log)
    except (ValueError, OSError, KeyError, IndexError, ET.ParseError) as error:
        parser.exit(2, f"curation failed (any partial output must not be used): {error}\n")
    print(json.dumps({"source_unchanged": result["source_unchanged"],
                      "curated_files": len(result["curated_files"])}))
