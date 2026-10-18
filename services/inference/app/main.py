from __future__ import annotations

import io
import os
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
from app.detector import Detector

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", "10485760"))
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


class BoundingBox(BaseModel):
    x1: float = Field(ge=0)
    y1: float = Field(ge=0)
    x2: float = Field(ge=0)
    y2: float = Field(ge=0)


class Detection(BaseModel):
    class_id: int = Field(ge=0)
    label: Literal["with_mask", "without_mask", "mask_worn_incorrectly"]
    confidence: float = Field(ge=0, le=1)
    bbox: BoundingBox


class DetectionResponse(BaseModel):
    schema_version: Literal["1.0"] = "1.0"
    image: dict[str, int]
    model: dict[str, str]
    detections: list[Detection]
    timing_ms: dict[str, float]


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.detector = None
    try:
        app.state.detector = Detector(os.getenv("MODEL_PATH", ""), os.getenv("MODEL_SHA256", ""))
    except Exception:
        # Readiness exposes failure without leaking filesystem paths or checkpoint contents.
        pass
    yield
    app.state.detector = None


app = FastAPI(title="Face Mask Detection API", version="0.1.0", lifespan=lifespan)
origins = [value.strip() for value in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/ready")
def ready() -> dict[str, str]:
    detector = getattr(app.state, "detector", None)
    if detector is None:
        raise HTTPException(status_code=503, detail="Model is not ready")
    return {"status": "ready", "model": detector.metadata["name"]}


@app.post("/api/v1/detect", response_model=DetectionResponse)
async def detect(image: UploadFile = File(...)) -> DetectionResponse:
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    payload = await image.read(MAX_UPLOAD_BYTES + 1)
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large")

    try:
        with Image.open(io.BytesIO(payload)) as decoded:
            decoded.verify()
        with Image.open(io.BytesIO(payload)) as decoded:
            decoded.load()
            frame = decoded.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(status_code=422, detail="Image cannot be decoded") from None

    detector = getattr(app.state, "detector", None)
    if detector is None:
        raise HTTPException(status_code=503, detail="Model is not ready")
    try:
        return DetectionResponse(**detector.detect(frame))
    except Exception:
        raise HTTPException(status_code=500, detail="Inference failed") from None

