export type MaskLabel = "with_mask" | "without_mask" | "mask_worn_incorrectly";

export interface DetectionResponse {
  schema_version: "1.0";
  image: { width: number; height: number };
  model: { name: string; version: string };
  detections: Array<{
    class_id: number;
    label: MaskLabel;
    confidence: number;
    bbox: { x1: number; y1: number; x2: number; y2: number };
  }>;
  timing_ms: { preprocess: number; inference: number; postprocess: number };
}

export async function detectImage(file: File): Promise<DetectionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_INFERENCE_API_URL;
  if (!apiUrl) throw new Error("Thiếu NEXT_PUBLIC_INFERENCE_API_URL.");
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(`${apiUrl}/api/v1/detect`, { method: "POST", body });
  if (!response.ok) throw new Error(`Inference API trả lỗi ${response.status}.`);
  return response.json() as Promise<DetectionResponse>;
}

