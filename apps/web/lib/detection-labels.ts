import type { MaskLabel } from "./inference";

export const LABELS: Record<MaskLabel, string> = {
  with_mask: "Có khẩu trang",
  without_mask: "Không có khẩu trang",
  mask_worn_incorrectly: "Đeo sai cách",
};
