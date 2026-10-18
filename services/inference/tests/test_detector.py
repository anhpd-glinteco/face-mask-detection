import copy
import hashlib
import json
from pathlib import Path

import pytest
import torch
from fastapi.testclient import TestClient
from jsonschema import validate
from PIL import Image
from torchvision.models.detection import ssdlite320_mobilenet_v3_large

from app.detector import CLASS_MAP, MODEL_CONFIG, Detector
from app import main
from test_api import make_png


@pytest.fixture(scope="module")
def checkpoint(tmp_path_factory):
    torch.set_num_threads(2)
    torch.manual_seed(42)
    config = {"model": MODEL_CONFIG, "class_map": CLASS_MAP}
    data = {"schema_version": 1, "config": config,
            "config_sha256": hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest(),
            "model": ssdlite320_mobilenet_v3_large(
                weights=None, weights_backbone=None, num_classes=4).state_dict()}
    path = tmp_path_factory.mktemp("synthetic-checkpoint") / "checkpoint.pt"
    torch.save(data, path)
    return path, hashlib.sha256(path.read_bytes()).hexdigest(), data


def test_real_loader_and_inference(checkpoint):
    path, checksum, _ = checkpoint
    detector = Detector(str(path), checksum)
    assert not detector.model.training
    assert torch.get_num_threads() == 2
    for size in [(16, 12), (80, 64)]:
        result = detector.detect(Image.new("RGB", size))
        assert result["image"] == {"width": size[0], "height": size[1]}
        assert result["model"]["version"] == checksum
        assert all(value >= 0 for value in result["timing_ms"].values())


@pytest.mark.parametrize("fault", ["checksum", "missing", "corrupt", "class_map", "architecture", "state", "nan", "config_digest"])
def test_load_failures_are_unready(checkpoint, tmp_path, monkeypatch, fault):
    path, checksum, original = checkpoint
    data = copy.deepcopy(original)
    if fault == "checksum":
        checksum = "0" * 64
    elif fault == "missing":
        path = tmp_path / "missing.pt"
    else:
        path = tmp_path / "bad.pt"
        if fault == "corrupt":
            path.write_bytes(b"not a checkpoint")
        else:
            if fault == "class_map":
                data["config"]["class_map"] = {}
            elif fault == "architecture":
                data["config"]["model"]["num_classes"] = 3
            elif fault == "state":
                data["model"].pop(next(iter(data["model"])))
            elif fault == "nan":
                next(value for value in data["model"].values() if value.is_floating_point()).fill_(float("nan"))
            else:
                data["config_sha256"] = "wrong"
            torch.save(data, path)
        checksum = hashlib.sha256(path.read_bytes()).hexdigest()
    monkeypatch.setenv("MODEL_PATH", str(path))
    monkeypatch.setenv("MODEL_SHA256", checksum)
    with TestClient(main.app) as client:
        assert client.get("/api/v1/health").status_code == 200
        assert client.get("/api/v1/ready").status_code == 503
        response = client.post("/api/v1/detect", files={"image": ("test.png", make_png(), "image/png")})
        assert response.status_code == 503
        assert str(path) not in response.text


def fixture_detector(prediction):
    detector = Detector.__new__(Detector)
    detector.metadata = {"name": "fixture", "version": "synthetic-v1"}

    def predictor(images):
        assert not torch.is_grad_enabled()
        assert images[0].shape == (3, 12, 16)
        assert images[0].min() >= 0 and images[0].max() <= 1
        return [prediction]

    detector.model = predictor
    return detector


def prediction():
    return {"boxes": torch.tensor([[0., 0., 16., 12.], [1., 2., 5., 6.],
                                   [3., 3., 9., 10.], [0., 0., 0., 1.]]),
            "labels": torch.tensor([1, 2, 3, 1]), "scores": torch.tensor([.9, .8, .7, .6])}


def test_api_lifespan_cache_contract_and_failure(monkeypatch):
    detector = fixture_detector(prediction())
    calls = []

    def loader(*args):
        calls.append(args)
        return detector

    monkeypatch.setattr(main, "Detector", loader)
    schema = json.loads((Path(__file__).resolve().parents[3] / "packages/contracts/detection.schema.json").read_text())
    with TestClient(main.app) as client:
        assert client.get("/api/v1/ready").status_code == 200
        for _ in range(2):
            response = client.post("/api/v1/detect", files={"image": ("test.png", make_png(), "image/png")})
            assert response.status_code == 200
            validate(response.json(), schema)
            assert [d["class_id"] for d in response.json()["detections"]] == [1, 2, 3]
        assert len(calls) == 1
        detector.model = lambda images: (_ for _ in ()).throw(RuntimeError("private/path"))
        response = client.post("/api/v1/detect", files={"image": ("test.png", make_png(), "image/png")})
        assert response.status_code == 500
        assert "private/path" not in response.text
    assert main.app.state.detector is None


@pytest.mark.parametrize("fault", ["nan", "infinite", "bounds", "reversed", "label", "score", "shape"])
def test_invalid_output(fault):
    output = prediction()
    if fault == "nan":
        output["boxes"][0, 0] = float("nan")
    elif fault == "infinite":
        output["scores"][0] = float("inf")
    elif fault == "bounds":
        output["boxes"][0, 2] = 17
    elif fault == "reversed":
        output["boxes"][0, 0] = 17
    elif fault == "label":
        output["labels"][0] = 0
    elif fault == "score":
        output["scores"][0] = -1
    else:
        output["boxes"] = torch.zeros(4, 3)
    with pytest.raises(ValueError, match="invalid model output"):
        fixture_detector(output).detect(Image.new("L", (16, 12)))


def test_empty_prediction():
    output = {"boxes": torch.empty(0, 4), "labels": torch.empty(0, dtype=torch.int64), "scores": torch.empty(0)}
    assert fixture_detector(output).detect(Image.new("RGBA", (16, 12)))["detections"] == []
