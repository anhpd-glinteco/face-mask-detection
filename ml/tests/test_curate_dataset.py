import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

from PIL import Image


SCRIPT = Path(__file__).parents[1] / "src/curate_dataset.py"


class CurationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.source = self.root / "source"
        (self.source / "images").mkdir(parents=True)
        (self.source / "annotations").mkdir()
        self.output = self.root / "curated"
        self.log = self.root / "log.json"
        self.review = self.root / "review.json"
        self.decisions = {}

    def sample(self, name, action, xmax=10):
        image = self.source / "images" / f"{name}.png"
        annotation = self.source / "annotations" / f"{name}.xml"
        Image.new("RGB", (10, 10), "white").save(image)
        annotation.write_text(f"<annotation><filename>{name}.png</filename><size><width>10</width><height>10</height></size><object><name>with_mask</name><bndbox><xmin>0</xmin><ymin>0</ymin><xmax>{xmax}</xmax><ymax>10</ymax></bndbox></object></annotation>")
        decision = {"action": action, "reason": "Synthetic review decision",
                    "images_sha256": hashlib.sha256(image.read_bytes()).hexdigest(),
                    "annotations_sha256": hashlib.sha256(annotation.read_bytes()).hexdigest()}
        if action == "fix_bbox":
            decision["bbox_updates"] = [{"object_index": 0, "before": [0, 0, xmax, 10], "after": [0, 0, 10, 10]}]
        self.decisions[name] = decision

    def run_cli(self):
        self.review.write_text(json.dumps({"decisions": self.decisions}))
        return subprocess.run([sys.executable, str(SCRIPT), "--dataset", str(self.source),
                               "--decisions", str(self.review), "--output", str(self.output),
                               "--log", str(self.log)], capture_output=True, text=True)

    def test_copy_fix_exclusion_and_source_preservation(self):
        self.sample("fix", "fix_bbox", 11)
        self.sample("drop", "exclude")
        self.sample("keep", "exclude")
        del self.decisions["keep"]
        before = {p.relative_to(self.source): p.read_bytes() for p in self.source.rglob("*") if p.is_file()}
        result = self.run_cli()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse((self.output / "images/drop.png").exists())
        self.assertFalse((self.output / "annotations/drop.xml").exists())
        self.assertEqual(ET.parse(self.output / "annotations/fix.xml").findtext("object/bndbox/xmax"), "10")
        self.assertEqual((self.output / "annotations/keep.xml").read_bytes(), before[Path("annotations/keep.xml")])
        for path, content in before.items():
            self.assertEqual((self.source / path).read_bytes(), content)
        log = json.loads(self.log.read_text())
        self.assertTrue(log["source_unchanged"])
        self.assertEqual(log["source_before"], log["source_after"])
        self.assertEqual(len(log["curated_files"]), 4)

    def test_stale_checksum_and_bbox_are_rejected_before_copy(self):
        self.sample("fix", "fix_bbox", 11)
        expected = self.decisions["fix"]["images_sha256"]
        self.decisions["fix"]["images_sha256"] = "wrong"
        self.assertEqual(self.run_cli().returncode, 2)
        self.assertFalse(self.output.exists())
        self.decisions["fix"]["images_sha256"] = expected
        self.decisions["fix"]["bbox_updates"][0]["before"][2] = 12
        self.assertEqual(self.run_cli().returncode, 2)
        self.assertFalse(self.output.exists())

    def test_refuses_source_writes_and_existing_destinations(self):
        self.sample("drop", "exclude")
        self.output = self.source / "nested"
        self.assertEqual(self.run_cli().returncode, 2)
        self.assertFalse(self.output.exists())
        self.output = self.root / "curated"
        self.log = self.source / "log.json"
        self.assertEqual(self.run_cli().returncode, 2)
        self.assertFalse(self.log.exists())
        self.log = self.root / "log.json"
        self.output.mkdir()
        sentinel = self.output / "keep.txt"
        sentinel.write_text("preserve")
        self.assertEqual(self.run_cli().returncode, 2)
        self.assertEqual(sentinel.read_text(), "preserve")


if __name__ == "__main__":
    unittest.main()
