import type { MaskLabel } from "./inference";

export const LABELS: Record<MaskLabel, string> = {
  with_mask: "Có khẩu trang",
  without_mask: "Không có khẩu trang",
  mask_worn_incorrectly: "Đeo sai cách",
};

// P4 validation-locked threshold; presentation only, never changes the API class.
export const OPERATING_THRESHOLD = 0.15;
export function presentDetection(detection: { label: MaskLabel; confidence: number }) {
  const uncertain = detection.confidence < OPERATING_THRESHOLD;
  return { uncertain, text: `${LABELS[detection.label]} ${Math.round(detection.confidence * 100)}%${uncertain ? " · Chưa chắc chắn" : ""}` };
}
