import io

from fastapi.testclient import TestClient
from PIL import Image

from app import main as main_module
from app.main import app

client = TestClient(app)


def make_png() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (16, 12), "white").save(buffer, format="PNG")
    return buffer.getvalue()


def test_health() -> None:
    assert client.get("/api/v1/health").json() == {"status": "ok"}


def test_ready(monkeypatch) -> None:
    monkeypatch.delenv("MODEL_PATH", raising=False)
    monkeypatch.delenv("MODEL_SHA256", raising=False)
    with TestClient(app) as running:
        assert running.get("/api/v1/health").status_code == 200
        assert running.get("/api/v1/ready").status_code == 503
        assert running.post("/api/v1/detect", files={"image": ("sample.png", make_png(), "image/png")}).status_code == 503


def test_detect_contract(monkeypatch) -> None:
    from types import SimpleNamespace
    monkeypatch.setattr(app.state, "detector", SimpleNamespace(detect=lambda image: {
        "image": {"width": image.width, "height": image.height},
        "model": {"name": "fixture", "version": "test"}, "detections": [],
        "timing_ms": {"preprocess": 0, "inference": 0, "postprocess": 0},
    }), raising=False)
    response = client.post("/api/v1/detect", files={"image": ("sample.png", make_png(), "image/png")})
    assert response.status_code == 200
    body = response.json()
    assert body["schema_version"] == "1.0"
    assert body["image"] == {"width": 16, "height": 12}
    assert body["model"]["name"] == "fixture"
    assert body["detections"] == []


def test_rejects_unsupported_type() -> None:
    response = client.post("/api/v1/detect", files={"image": ("sample.txt", b"hello", "text/plain")})
    assert response.status_code == 415


def test_rejects_oversized_image(monkeypatch) -> None:
    monkeypatch.setattr(main_module, "MAX_UPLOAD_BYTES", 10)
    response = client.post("/api/v1/detect", files={"image": ("large.png", b"x" * 11, "image/png")})
    assert response.status_code == 413


def test_rejects_undecodable_image() -> None:
    response = client.post("/api/v1/detect", files={"image": ("broken.png", b"not-an-image", "image/png")})
    assert response.status_code == 422

