export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type MaskLabel = "with_mask" | "without_mask" | "mask_worn_incorrectly";
export type DetectionErrorCode = "FILE_TOO_LARGE" | "UNSUPPORTED_TYPE" | "INVALID_IMAGE" | "NETWORK_ERROR" | "SERVER_ERROR" | "INVALID_RESPONSE";

export interface DetectionResponse {
  schema_version: "1.0";
  image: { width: number; height: number };
  model: { name: string; version: string };
  detections: Array<{ class_id: number; label: MaskLabel; confidence: number; bbox: { x1: number; y1: number; x2: number; y2: number } }>;
  timing_ms: { preprocess: number; inference: number; postprocess: number };
}

export class DetectionApiError extends Error {
  constructor(public readonly code: DetectionErrorCode, public readonly status?: number, message?: string) {
    super(message ?? code);
    this.name = "DetectionApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isDetectionResponse(value: unknown): value is DetectionResponse {
  if (!isRecord(value) || value.schema_version !== "1.0" || !isRecord(value.image) || !isRecord(value.model) || !Array.isArray(value.detections)) return false;
  const timingMs = value.timing_ms;
  if (!isRecord(timingMs)) return false;
  const imageWidth = value.image.width;
  const imageHeight = value.image.height;
  if (typeof imageWidth !== "number" || !Number.isInteger(imageWidth) || imageWidth < 1 || typeof imageHeight !== "number" || !Number.isInteger(imageHeight) || imageHeight < 1) return false;
  if (typeof value.model.name !== "string" || typeof value.model.version !== "string") return false;
  if (!["preprocess", "inference", "postprocess"].every((key) => isFiniteNonNegative(timingMs[key]))) return false;
  return value.detections.every((item) => {
    if (!isRecord(item)) return false;
    const classId = item.class_id;
    const confidence = item.confidence;
    const bbox = item.bbox;
    if (typeof classId !== "number" || !Number.isInteger(classId) || classId < 0 || !["with_mask", "without_mask", "mask_worn_incorrectly"].includes(item.label as string) || !isFiniteNonNegative(confidence) || confidence > 1 || !isRecord(bbox)) return false;
    return ["x1", "y1", "x2", "y2"].every((key) => isFiniteNonNegative(bbox[key]));
  });
}

function errorCodeForStatus(status: number): DetectionErrorCode {
  if (status === 413) return "FILE_TOO_LARGE";
  if (status === 415) return "UNSUPPORTED_TYPE";
  if (status === 422) return "INVALID_IMAGE";
  return "SERVER_ERROR";
}

export async function detectImage(file: File, options: { signal?: AbortSignal } = {}): Promise<DetectionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_INFERENCE_API_URL;
  if (!apiUrl) throw new DetectionApiError("SERVER_ERROR", undefined, "Thiếu NEXT_PUBLIC_INFERENCE_API_URL.");
  const body = new FormData();
  body.append("image", file);
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/v1/detect`, { method: "POST", body, signal: options.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new DetectionApiError("NETWORK_ERROR", undefined, "Không thể kết nối tới dịch vụ phân tích.");
  }
  if (!response.ok) throw new DetectionApiError(errorCodeForStatus(response.status), response.status);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DetectionApiError("INVALID_RESPONSE", response.status);
  }
  if (!isDetectionResponse(payload)) throw new DetectionApiError("INVALID_RESPONSE", response.status);
  return payload;
}
