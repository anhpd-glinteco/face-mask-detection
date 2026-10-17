import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import random

from PIL import Image

spec = importlib.util.spec_from_file_location("prepare_dataset", Path(__file__).parents[1] / "src/prepare_dataset.py")
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)


class DatasetTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / "images").mkdir()
        (self.root / "annotations").mkdir()

    def sample(self, name="a", label="mask_weared_incorrect", box="0,0,10,10"):
        Image.new("RGB", (10, 10), "white").save(self.root / "images" / f"{name}.png")
        x1, y1, x2, y2 = box.split(",")
        path = self.root / "annotations" / f"{name}.xml"
        path.write_text(f"<annotation><filename>{name}.png</filename><size><width>10</width><height>10</height></size><object><name>{label}</name><bndbox><xmin>{x1}</xmin><ymin>{y1}</ymin><xmax>{x2}</xmax><ymax>{y2}</ymax></bndbox></object></annotation>")
        return path

    def test_alias_and_repeatability(self):
        self.sample()
        first = prepare.audit(self.root)
        self.assertEqual(first["records"][0]["objects"][0]["label"], "mask_worn_incorrectly")
        self.assertEqual(json.dumps(first), json.dumps(prepare.audit(self.root)))
        self.assertFalse(first["technical_checks_passed"])

    def test_invalid_annotations_are_reported(self):
        for name, label, box in [("bounds", "with_mask", "0,0,11,10"), ("zero", "with_mask", "1,1,1,2"), ("unknown", "bad", "0,0,10,10"), ("number", "with_mask", "nan,0,10,10")]:
            self.sample(name, label, box)
        (self.root / "annotations" / "broken.xml").write_text("<annotation>")
        result = prepare.audit(self.root)
        self.assertEqual(len(result["errors"]), 5)
        self.assertFalse(result["technical_checks_passed"])

    def test_dimension_and_path_validation(self):
        path = self.sample()
        original = path.read_text()
        for bad in (original.replace("<width>10", "<width>11"), original.replace("a.png", "../a.png"), "<!DOCTYPE foo>" + original):
            path.write_text(bad)
            self.assertEqual(len(prepare.audit(self.root)["errors"]), 1)

    def test_duplicate_and_scene_groups_cannot_cross_splits(self):
        records = [{"image": f"images/{i}.png", "pixel_sha256": str(i), "dhash": f"{h:016x}"} for i, h in enumerate([0, 0x5555555555555555, 2**64 - 1, 0xaaaaaaaaaaaaaaaa])]
        records[1]["pixel_sha256"] = records[0]["pixel_sha256"]
        scenes = {"images/1.png": "scene-a", "images/2.png": "scene-a"}
        prepare.assign_splits(records, scenes, 42)
        self.assertEqual(len({r["split"] for r in records[:3]}), 1)
        self.assertEqual(len({r["group"] for r in records[:3]}), 1)
        self.assertNotEqual(records[0]["group"], records[3]["group"])

    def test_near_duplicate_candidates_stay_together(self):
        records = [{"image": str(i), "pixel_sha256": str(i), "dhash": f"{h:016x}"} for i, h in enumerate([0, 15])]
        self.assertEqual(prepare.assign_splits(records, {}, 42), 1)
        self.assertEqual(records[0]["split"], records[1]["split"])

    def test_missing_images_and_unknown_scene_entries(self):
        self.sample()
        (self.root / "images" / "a.png").unlink()
        self.assertEqual(len(prepare.audit(self.root)["errors"]), 1)
        groups = self.root / "groups.csv"
        groups.write_text("image,group\nimages/missing.png,scene\n")
        with self.assertRaisesRegex(ValueError, "unknown or rejected"):
            prepare.audit(self.root, groups)
        for invalid in ("wrong,header\n", "image,group\nimages/a.png\n", "image,group\nimages/a.png,one\nimages/a.png,two\n"):
            groups.write_text(invalid)
            with self.assertRaises(ValueError):
                prepare.audit(self.root, groups)

    def test_valid_distribution_and_orphan_detection(self):
        rng = random.Random(42)
        for i in range(40):
            path = self.sample(str(i))
            text = path.read_text()
            obj = text[text.index("<object>"):text.index("</object>") + 9]
            path.write_text(text.replace("</annotation>", obj.replace("mask_weared_incorrect", "with_mask") + obj.replace("mask_weared_incorrect", "without_mask") + "</annotation>"))
            Image.frombytes("RGB", (10, 10), rng.randbytes(300)).save(self.root / "images" / f"{i}.png")
        result = prepare.audit(self.root)
        self.assertTrue(result["technical_checks_passed"])
        self.assertEqual(sum(d["images"] for d in result["distribution"].values()), 40)
        self.assertEqual(sum(sum(d["objects"].values()) for d in result["distribution"].values()), 120)
        Image.new("RGB", (10, 10)).save(self.root / "images" / "orphan.png")
        self.assertFalse(prepare.audit(self.root)["technical_checks_passed"])

    def test_corrupt_image_and_dimension_text(self):
        path = self.sample()
        path.write_text(path.read_text().replace("<width>10", "<width>NaN"))
        self.assertEqual(len(prepare.audit(self.root)["errors"]), 1)
        (self.root / "images" / "a.png").write_bytes(b"bad image")
        self.assertEqual(len(prepare.audit(self.root)["errors"]), 1)

    def test_conflicting_duplicate_annotations_block_training(self):
        self.sample("a", "with_mask")
        self.sample("b", "without_mask")
        result = prepare.audit(self.root)
        self.assertEqual(result["exact_duplicate_groups"], [["images/a.png", "images/b.png"]])
        self.assertEqual(result["duplicate_annotation_conflicts"], result["exact_duplicate_groups"])
        self.assertEqual(result["records"][0]["split"], result["records"][1]["split"])
        self.assertFalse(result["technical_checks_passed"])


if __name__ == "__main__":
    unittest.main()
