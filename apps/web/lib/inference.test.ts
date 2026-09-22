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
});
