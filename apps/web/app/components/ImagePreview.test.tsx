import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DetectionResponse } from "@/lib/inference";
import { ImagePreview } from "./ImagePreview";

const result: DetectionResponse = {
  schema_version: "1.0", image: { width: 1200, height: 800 },
  model: { name: "synthetic-fixture", version: "fixture-v1" },
  detections: [
    { class_id: 1, label: "with_mask", confidence: 0.98, bbox: { x1: 0, y1: 0, x2: 200, y2: 200 } },
    { class_id: 2, label: "without_mask", confidence: 0.87, bbox: { x1: 500, y1: 300, x2: 700, y2: 600 } },
    { class_id: 3, label: "mask_worn_incorrectly", confidence: 0.76, bbox: { x1: 1100, y1: 700, x2: 1200, y2: 800 } },
  ], timing_ms: { preprocess: 1, inference: 2, postprocess: 1 },
};

const context = {
  setTransform: vi.fn(), strokeRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 200 })),
};
let size = { width: 600, height: 400 };
let resize: () => void;
const disconnect = vi.fn();
const props = { file: new File(["synthetic"], "fixture.png"), previewUrl: "blob:fixture", isLoading: false,
  onReplace: vi.fn(), onDimensions: vi.fn(), onError: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  size = { width: 600, height: 400 };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLImageElement.prototype, "getBoundingClientRect").mockImplementation(() => size as DOMRect);
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect = disconnect;
  });
  vi.stubGlobal("devicePixelRatio", 2);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("image overlay", () => {
  it("scales original boxes to the displayed image, redraws on resize and cleans up", () => {
    const { container, unmount } = render(<ImagePreview {...props} result={result} />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(800);
    expect(canvas.style.width).toBe("600px");
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(context.strokeRect.mock.calls).toEqual([[0, 0, 100, 100], [250, 150, 100, 150], [550, 350, 50, 50]]);
    expect(context.fillText.mock.calls.map((call) => call[0])).toEqual([
      "1. Có khẩu trang 98%", "2. Không có khẩu trang 87%", "3. Đeo sai cách 76%",
    ]);
    for (const [left, top, width, height] of context.fillRect.mock.calls) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(left + width).toBeLessThanOrEqual(600);
      expect(top + height).toBeLessThanOrEqual(400);
    }
    context.strokeRect.mockClear();
    size = { width: 300, height: 200 };
    resize();
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(400);
    expect(context.strokeRect.mock.calls).toEqual([[0, 0, 50, 50], [125, 75, 50, 75], [275, 175, 25, 25]]);
    unmount();
    expect(disconnect).toHaveBeenCalled();
    context.strokeRect.mockClear();
    window.dispatchEvent(new Event("resize"));
    expect(context.strokeRect).not.toHaveBeenCalled();
  });

  it("keeps portrait labels inside the image, including a full-image edge box", () => {
    size = { width: 200, height: 300 };
    const portrait = { ...result, image: { width: 800, height: 1200 }, detections: [
      { ...result.detections[0], bbox: { x1: 0, y1: 0, x2: 800, y2: 1200 } },
      { ...result.detections[2], bbox: { x1: 790, y1: 1190, x2: 800, y2: 1200 } },
    ] };
    render(<ImagePreview {...props} result={portrait} />);
    expect(context.strokeRect.mock.calls).toEqual([[0, 0, 200, 300], [197.5, 297.5, 2.5, 2.5]]);
    for (const [left, top, width, height] of context.fillRect.mock.calls) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(left + width).toBeLessThanOrEqual(200);
      expect(top + height).toBeLessThanOrEqual(300);
    }
  });

  it("removes the canvas and disconnects its observer when the result clears", () => {
    const { container, rerender } = render(<ImagePreview {...props} result={result} />);
    rerender(<ImagePreview {...props} result={null} />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(disconnect).toHaveBeenCalled();
  });

  it("does not create an overlay for a successful empty response", () => {
    const { container } = render(<ImagePreview {...props} result={{ ...result, detections: [] }} />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(context.strokeRect).not.toHaveBeenCalled();
  });

  it("uses positive text sizing and padding on a tiny valid image", () => {
    size = { width: 1, height: 1 };
    render(<ImagePreview {...props} result={{ ...result, image: { width: 1, height: 1 },
      detections: [{ ...result.detections[0], bbox: { x1: 0, y1: 0, x2: 1, y2: 1 } }] }} />);
    expect((context as typeof context & { font: string }).font).toBe("1px sans-serif");
    expect(context.fillText).toHaveBeenCalledWith("1. Có khẩu trang 98%", 0.25, 0.5, 0.5);
  });
});
