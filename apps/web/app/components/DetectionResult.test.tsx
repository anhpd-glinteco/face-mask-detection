import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DetectionResult } from "./DetectionResult";
import type { DetectionResponse } from "@/lib/inference";

afterEach(cleanup);
const result: DetectionResponse = { schema_version: "1.0", image: { width: 100, height: 100 }, model: { name: "fixture", version: "1" }, timing_ms: { preprocess: 0, inference: 0, postprocess: 0 }, detections: [
  { class_id: 1, label: "with_mask", confidence: .1499, bbox: { x1: 0, y1: 0, x2: 10, y2: 10 } },
  { class_id: 2, label: "without_mask", confidence: .15, bbox: { x1: 0, y1: 0, x2: 10, y2: 10 } },
  { class_id: 3, label: "mask_worn_incorrectly", confidence: .1501, bbox: { x1: 0, y1: 0, x2: 10, y2: 10 } },
] };
it("uses raw confidence at the boundary, preserves all labels and separates counts", () => {
  render(<DetectionResult result={result} phase="success" />);
  const rows = screen.getAllByRole("listitem");
  expect(rows).toHaveLength(3);
  expect(within(rows[0]).getByText(/Chưa chắc chắn/)).toBeInTheDocument();
  expect(rows[0]).toHaveTextContent("1. Có khẩu trang");
  expect(rows[0]).toHaveTextContent("15%");
  expect(rows[1]).not.toHaveTextContent("Chưa chắc chắn");
  expect(rows[1]).toHaveTextContent("Không có khẩu trang");
  expect(rows[2]).not.toHaveTextContent("Chưa chắc chắn");
  expect(rows[2]).toHaveTextContent("Đeo sai cách");
  expect(screen.getByLabelText("Thống kê detection")).toHaveTextContent("Tổng: 3 · Đạt ngưỡng: 2 · Chưa chắc chắn: 1");
});
it("keeps all low-confidence detections without reporting an empty result", () => {
  render(<DetectionResult result={{ ...result, detections: result.detections.map(d => ({ ...d, confidence: .001 })) }} phase="success" />);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getByLabelText("Thống kê detection")).toHaveTextContent("Đạt ngưỡng: 0 · Chưa chắc chắn: 3");
});
it("reports zero counts for an empty response", () => {
  render(<DetectionResult result={{ ...result, detections: [] }} phase="success" />);
  expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument();
  expect(screen.getByLabelText("Thống kê detection")).toHaveTextContent("Tổng: 0 · Đạt ngưỡng: 0 · Chưa chắc chắn: 0");
});
