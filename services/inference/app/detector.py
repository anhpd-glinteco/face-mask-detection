"""CPU SSDLite adapter; model files are supplied locally, never downloaded."""
import hashlib
import io
import json
import time
from pathlib import Path

import torch
from torchvision.models.detection import ssdlite320_mobilenet_v3_large
from torchvision.transforms.functional import pil_to_tensor

CLASS_MAP = {"0": "__background__", "1": "with_mask", "2": "without_mask", "3": "mask_worn_incorrectly"}
MODEL_CONFIG = {
    "builder": "torchvision.models.detection.ssdlite320_mobilenet_v3_large",
    "weights": None, "weights_backbone": None, "num_classes": 4, "input_size": [320, 320],
}


class Detector:
    def __init__(self, path: str, checksum: str):
        # Hash and deserialize the same bytes so a replaced file cannot bypass verification.
        payload = Path(path).read_bytes()
        if len(checksum) != 64 or hashlib.sha256(payload).hexdigest() != checksum:
            raise ValueError("checkpoint checksum mismatch")
        checkpoint = torch.load(io.BytesIO(payload), map_location="cpu", weights_only=True)
        config = checkpoint["config"]
        if (checkpoint["schema_version"] != 1 or config["model"] != MODEL_CONFIG
                or config["class_map"] != CLASS_MAP
                or checkpoint["config_sha256"] != hashlib.sha256(
                    json.dumps(config, sort_keys=True).encode()).hexdigest()):
            raise ValueError("unsupported checkpoint metadata")
        state = checkpoint["model"]
        if not state or any(not torch.isfinite(value).all() for value in state.values()):
            raise ValueError("invalid checkpoint parameters")
        torch.set_num_threads(2)
        self.model = ssdlite320_mobilenet_v3_large(
            weights=None, weights_backbone=None, num_classes=4,
            score_thresh=0.001, nms_thresh=0.55, detections_per_img=100, topk_candidates=300,
        ).cpu()
        self.model.load_state_dict(state, strict=True)
        self.model.eval()
        self.metadata = {"name": "ssdlite320_mobilenet_v3_large", "version": checksum}

    def detect(self, image):
        started = time.perf_counter()
        tensor = pil_to_tensor(image.convert("RGB")).float().div(255)
        preprocessed = time.perf_counter()
        with torch.inference_mode():
            prediction = self.model([tensor])[0]
        inferred = time.perf_counter()
        boxes, labels, scores = (prediction[key].detach().cpu() for key in ("boxes", "labels", "scores"))
        width, height = image.size
        if (boxes.ndim != 2 or boxes.shape[1] != 4 or len(boxes) > 100
                or labels.shape != (len(boxes),) or scores.shape != (len(boxes),)
                or labels.dtype != torch.int64 or not torch.isfinite(boxes).all()
                or not torch.isfinite(scores).all() or not ((labels >= 1) & (labels <= 3)).all()
                or not ((scores >= 0) & (scores <= 1)).all()
                or not ((boxes[:, 0] >= 0) & (boxes[:, 1] >= 0)
                        & (boxes[:, 2] <= width) & (boxes[:, 3] <= height)
                        & (boxes[:, 0] <= boxes[:, 2]) & (boxes[:, 1] <= boxes[:, 3])).all()):
            raise ValueError("invalid model output")
        detections = []
        for box, label, score in zip(boxes.tolist(), labels.tolist(), scores.tolist()):
            if box[0] < box[2] and box[1] < box[3]:
                detections.append({"class_id": label, "label": CLASS_MAP[str(label)],
                                   "confidence": score, "bbox": dict(zip(("x1", "y1", "x2", "y2"), box))})
        finished = time.perf_counter()
        return {"image": {"width": width, "height": height}, "model": self.metadata,
                "detections": detections, "timing_ms": {
                    "preprocess": (preprocessed - started) * 1000,
                    "inference": (inferred - preprocessed) * 1000,
                    "postprocess": (finished - inferred) * 1000}}
