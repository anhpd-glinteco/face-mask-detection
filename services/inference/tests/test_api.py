import io

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def make_png() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (16, 12), "white").save(buffer, format="PNG")
    return buffer.getvalue()


def test_health() -> None:
    assert client.get("/api/v1/health").json() == {"status": "ok"}


def test_detect_contract() -> None:
    response = client.post("/api/v1/detect", files={"image": ("sample.png", make_png(), "image/png")})
    assert response.status_code == 200
    body = response.json()
    assert body["schema_version"] == "1.0"
    assert body["image"] == {"width": 16, "height": 12}
    assert body["model"]["name"] == "stub"
    assert body["detections"] == []


def test_rejects_unsupported_type() -> None:
    response = client.post("/api/v1/detect", files={"image": ("sample.txt", b"hello", "text/plain")})
    assert response.status_code == 415

