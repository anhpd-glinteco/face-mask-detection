import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DetectionResult } from "./DetectionResult";
import type { DetectionResponse } from "@/lib/inference";

afterEach(cleanup);
const result: DetectionResponse = { schema_version: "1.0", image: { width: 100, height: 100 }, model: { name: "fixture", version: "1" }, timing_ms: { preprocess: 0, inference: 0, postprocess: 0 }, detections: [
  { class_id: 1, label: "with_mask", confidence: .1499, bbox: { x1: 0, y1: 0, x2: 10, y2: 10 } },
  { class_id: 2, label: "without_mask", confidence: .15, bbox: { x1: 0, y1: 0, x2: 10, y2: 10 } },
  { class_id: 3, label: "mask_worn_incorrectly", confidence: .1501, bbox: { x1: 0, y1: 0, x2: 10, y2: 10 } },
] };
it("filters raw boundary scores and reveals weak rows with shared numbering", async () => {
  const { rerender } = render(<DetectionResult result={result} phase="success" />);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("1. Không có khẩu trang");
  rerender(<DetectionResult result={result} phase="success" showUncertain />);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getAllByRole("listitem")[2]).toHaveTextContent("3. Có khẩu trang");
  expect(screen.getAllByRole("listitem")[2]).toHaveTextContent("Chưa chắc chắn");
});
it("shows a distinct empty accepted group while retaining weak raw predictions", () => {
  render(<DetectionResult result={{ ...result, detections: result.detections.map(d => ({ ...d, confidence: .001 })) }} phase="success" />);
  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  expect(screen.getByText("Chưa có phát hiện đạt ngưỡng")).toBeInTheDocument();
  expect(screen.getByLabelText("Thống kê detection")).toHaveTextContent("0 phát hiện đạt ngưỡng trong frame · 3 chưa chắc chắn");
});
it("reports an empty response", () => {
  render(<DetectionResult result={{ ...result, detections: [] }} phase="success" />);
  expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument();
});
it("renders two accepted predictions out of one hundred until expanded", () => {
  const detections = Array.from({ length: 100 }, (_, i) => ({ ...result.detections[0], confidence: i < 2 ? .8 : .01 }));
  const { rerender } = render(<DetectionResult result={{ ...result, detections }} phase="success" />);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  rerender(<DetectionResult result={{ ...result, detections }} phase="success" showUncertain />);
  expect(screen.getAllByRole("listitem")).toHaveLength(100);
});
