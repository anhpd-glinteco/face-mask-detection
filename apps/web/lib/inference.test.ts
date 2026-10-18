import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DetectionApiError, detectImage, type DetectionResponse } from "./inference";

const response: DetectionResponse = {
  schema_version: "1.0",
  image: { width: 10, height: 8 },
  model: { name: "stub", version: "0.0.0" },
  detections: [],
  timing_ms: { preprocess: 0, inference: 0, postprocess: 0 },
};

const file = new File(["image"], "sample.png", { type: "image/png" });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_INFERENCE_API_URL", "http://localhost:8000");
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("detectImage", () => {
  it("posts the image and validates the response contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(detectImage(file)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/detect", expect.objectContaining({ method: "POST", body: expect.any(FormData) }));
  });

  it.each([
    [413, "FILE_TOO_LARGE"],
    [415, "UNSUPPORTED_TYPE"],
    [422, "INVALID_IMAGE"],
    [500, "SERVER_ERROR"],
    [503, "MODEL_NOT_READY"],
  ] as const)("maps HTTP %s to %s", async (status, code) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
    await expect(detectImage(file)).rejects.toMatchObject({ code, status });
  });

  it("maps a connection failure to NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(detectImage(file)).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });

  it("rejects a response that does not satisfy the contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ schema_version: "1.0" }), { status: 200 })));
    const request = detectImage(file);
    await expect(request).rejects.toBeInstanceOf(DetectionApiError);
    await expect(request).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it.each([
    { x1: -1, y1: 0, x2: 5, y2: 5 },
    { x1: 3, y1: 0, x2: 3, y2: 5 },
    { x1: 4, y1: 0, x2: 3, y2: 5 },
    { x1: 0, y1: 2, x2: 5, y2: 2 },
    { x1: 0, y1: 0, x2: 11, y2: 5 },
    { x1: 0, y1: 0, x2: 5, y2: 9 },
    { x1: 0, y1: 0, x2: Infinity, y2: 5 },
    { x1: 0, y1: NaN, x2: 5, y2: 5 },
  ])("rejects invalid bbox %j", async (bbox) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({
      ...response, detections: [{ class_id: 1, label: "with_mask", confidence: 0.9, bbox }],
    }) }));
    await expect(detectImage(file)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("accepts fractional coordinates and boxes touching every image edge", async () => {
    const payload = { ...response, detections: [
      { class_id: 1, label: "with_mask", confidence: 0.9, bbox: { x1: 0, y1: 0, x2: 10, y2: 8 } },
      { class_id: 2, label: "without_mask", confidence: 0.8, bbox: { x1: 0.5, y1: 1.5, x2: 9.5, y2: 7.5 } },
    ] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));
    await expect(detectImage(file)).resolves.toEqual(payload);
  });

  it.each(["headers", "body"])("times out after 30 seconds while waiting for %s", async (stage) => {
    vi.useFakeTimers();
    let signal: AbortSignal;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options) => {
      signal = options.signal;
      const pending = () => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
      return stage === "headers" ? pending() : Promise.resolve({ ok: true, status: 200, json: pending });
    }));
    const rejected = expect(detectImage(file)).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(29_999);
    expect(signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
    expect(signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses one deadline for headers and body together", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options) => new Promise((resolve) => {
      setTimeout(() => resolve({ ok: true, status: 200, json: () => new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
      }) }), 15_000);
    })));
    const rejected = expect(detectImage(file)).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(30_000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([200, 503, 500])("cleans the deadline and caller listener after HTTP %s", async (status) => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status })));
    await detectImage(file, { signal: controller.signal }).catch(() => undefined);
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it("forwards cancellation during body read without reporting a timeout", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url, options) => ({
      ok: true, status: 200, json: () => new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
      }),
    })));
    const rejected = expect(detectImage(file, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it("does not fetch when the caller already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(detectImage(file, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
