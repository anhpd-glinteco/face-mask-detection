import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DetectionApiError, detectImage, type DetectionResponse } from "@/lib/inference";
import Home from "./page";

vi.mock("@/lib/inference", async () => {
  const actual = await vi.importActual<typeof import("@/lib/inference")>("@/lib/inference");
  return { ...actual, detectImage: vi.fn() };
});

const mockedDetectImage = vi.mocked(detectImage);

const emptyResponse: DetectionResponse = {
  schema_version: "1.0",
  image: { width: 120, height: 80 },
  model: { name: "synthetic-fixture", version: "fixture-v1" },
  detections: [],
  timing_ms: { preprocess: 0, inference: 0, postprocess: 0 },
};

const detectedResponse: DetectionResponse = {
  ...emptyResponse,
  detections: [{ class_id: 1, label: "with_mask", confidence: 0.98, bbox: { x1: 1, y1: 2, x2: 30, y2: 40 } }],
};

function file(name = "sample.png", type = "image/png", contents = "image") {
  return new File([contents], name, { type });
}

async function upload(selected = file()) {
  const input = screen.getByLabelText("Ảnh đầu vào") as HTMLInputElement;
  await userEvent.setup({ applyAccept: false }).upload(input, selected);
  const image = screen.queryByAltText(`Ảnh đã chọn: ${selected.name}`);
  if (image) loadPreview(image);
}

function loadPreview(image: HTMLElement, width = 120, height = 80) {
  Object.defineProperties(image, { naturalWidth: { configurable: true, value: width }, naturalHeight: { configurable: true, value: height } });
  fireEvent.load(image);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedDetectImage.mockResolvedValue(emptyResponse);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    setTransform: vi.fn(), strokeRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), measureText: () => ({ width: 100 }),
  } as unknown as CanvasRenderingContext2D);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("image detection flow", () => {
  it("shows a retryable error when the model is not ready", async () => {
    mockedDetectImage.mockRejectedValueOnce(new DetectionApiError("MODEL_NOT_READY", 503));
    render(<Home />);
    await upload();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Mô hình chưa sẵn sàng"));
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByText("Không phát hiện đối tượng")).not.toBeInTheDocument();
  });
  it("previews a valid image and shows the empty result", async () => {
    render(<Home />);
    await upload();
    expect(mockedDetectImage).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText("Ảnh đã chọn: sample.png")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument());
  });

  it("blocks unsupported types and oversized files before calling the API", async () => {
    render(<Home />);
    await upload(file("notes.txt", "text/plain"));
    expect(mockedDetectImage).not.toHaveBeenCalled();
    expect(screen.getByText(/Định dạng không được hỗ trợ/)).toBeInTheDocument();

    await upload(file("large.png", "image/png", "x".repeat(10 * 1024 * 1024 + 1)));
    expect(mockedDetectImage).not.toHaveBeenCalled();
    expect(screen.getByText(/vượt quá dung lượng tối đa 10.0 MB/)).toBeInTheDocument();
  });

  it("keeps the preview visible while loading", async () => {
    let resolveRequest: (response: DetectionResponse) => void = () => undefined;
    mockedDetectImage.mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    render(<Home />);
    await upload();
    expect(screen.getAllByText("Đang phân tích ảnh…").length).toBeGreaterThan(0);
    expect(screen.getByAltText("Ảnh đã chọn: sample.png")).toBeInTheDocument();
    resolveRequest(emptyResponse);
    await waitFor(() => expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument());
  });

  it("shows numbered detections, a canvas and response model metadata", async () => {
    mockedDetectImage.mockResolvedValue(detectedResponse);
    render(<Home />);
    await upload();
    await waitFor(() => expect(screen.getByText("1. Có khẩu trang")).toBeInTheDocument());
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(document.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("synthetic-fixture")).toBeInTheDocument();
    expect(screen.getByText("fixture-v1")).toBeInTheDocument();
  });

  it("maps API errors and retries with the selected file", async () => {
    mockedDetectImage.mockRejectedValueOnce(new DetectionApiError("FILE_TOO_LARGE", 413));
    render(<Home />);
    await upload();
    await waitFor(() => expect(screen.getByText(/vượt quá dung lượng tối đa/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();

    mockedDetectImage.mockResolvedValueOnce(emptyResponse);
    await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument());
    expect(mockedDetectImage).toHaveBeenCalledTimes(2);
  });

  it("resets the previous result when a new image is selected", async () => {
    render(<Home />);
    await upload();
    await waitFor(() => expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument());
    let resolveSecond: (response: DetectionResponse) => void = () => undefined;
    mockedDetectImage.mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
    await upload(file("second.jpg", "image/jpeg"));
    expect(screen.queryByText("Không phát hiện đối tượng")).not.toBeInTheDocument();
    expect(screen.getAllByText("Đang phân tích ảnh…").length).toBeGreaterThan(0);
    resolveSecond(emptyResponse);
  });

  it("aborts the previous request and ignores a stale response", async () => {
    const resolvers: Array<(response: DetectionResponse) => void> = [];
    const signals: AbortSignal[] = [];
    mockedDetectImage.mockImplementation((_file, options) => {
      if (options?.signal) signals.push(options.signal);
      return new Promise((resolve) => resolvers.push(resolve));
    });
    render(<Home />);
    await upload(file("first.png"));
    await upload(file("second.png"));
    expect(signals[0]?.aborted).toBe(true);
    resolvers[0]?.(detectedResponse);
    expect(screen.queryByText("1. Có khẩu trang")).not.toBeInTheDocument();
    resolvers[1]?.(emptyResponse);
    await waitFor(() => expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument());
  });

  it("does not start API work for unavailable video and webcam modes", async () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /Video/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Webcam/ })).toBeDisabled();
    expect(screen.getAllByText("Sẽ triển khai ở tuần sau")).toHaveLength(2);
  });

  it("keeps status and error regions accessible", async () => {
    mockedDetectImage.mockRejectedValueOnce(new DetectionApiError("NETWORK_ERROR"));
    render(<Home />);
    await upload();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Không thể kết nối"));
    expect(screen.getByLabelText("Ảnh đầu vào")).toHaveAttribute("aria-describedby");
  });

  it("allows the hidden file input to be reset and re-used", async () => {
    render(<Home />);
    const input = screen.getByLabelText("Ảnh đầu vào") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file()] } });
    expect(input.value).toBe("");
  });

  it("revokes object URLs when replacing an image and unmounting", async () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const { unmount } = render(<Home />);
    await upload(file("first.png"));
    await upload(file("second.png"));
    expect(revokeSpy).toHaveBeenCalledWith("blob:first.png");
    unmount();
    expect(revokeSpy).toHaveBeenCalledWith("blob:second.png");
    revokeSpy.mockRestore();
  });

  it("waits for preview decoding before exposing a result", async () => {
    mockedDetectImage.mockResolvedValue(detectedResponse);
    render(<Home />);
    fireEvent.change(screen.getByLabelText("Ảnh đầu vào"), { target: { files: [file()] } });
    await act(async () => {});
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    expect(screen.queryByText("1. Có khẩu trang")).not.toBeInTheDocument();
    loadPreview(screen.getByAltText("Ảnh đã chọn: sample.png"));
    await waitFor(() => expect(screen.getByText("1. Có khẩu trang")).toBeInTheDocument());
  });

  it("rejects mismatched dimensions and allows retry without showing detections", async () => {
    mockedDetectImage.mockResolvedValueOnce({ ...detectedResponse, image: { width: 80, height: 120 } });
    render(<Home />);
    await upload();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Kích thước kết quả không khớp"));
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    expect(screen.queryByText("1. Có khẩu trang")).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument());
  });

  it("aborts on preview decode failure and ignores the late result", async () => {
    let resolve: (response: DetectionResponse) => void = () => undefined;
    let signal: AbortSignal | undefined;
    mockedDetectImage.mockImplementationOnce((_file, options) => {
      signal = options?.signal;
      return new Promise((done) => { resolve = done; });
    });
    render(<Home />);
    await upload();
    fireEvent.error(screen.getByAltText("Ảnh đã chọn: sample.png"));
    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole("alert")).toHaveTextContent("Không thể đọc ảnh");
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    await act(async () => resolve(detectedResponse));
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    await upload(file("replacement.png"));
    await waitFor(() => expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument());
  });

  it("clears an already displayed overlay when decoding fails", async () => {
    mockedDetectImage.mockResolvedValue(detectedResponse);
    render(<Home />);
    await upload();
    await waitFor(() => expect(document.querySelector("canvas")).toBeInTheDocument());
    fireEvent.error(screen.getByAltText("Ảnh đã chọn: sample.png"));
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    expect(screen.queryByText("1. Có khẩu trang")).not.toBeInTheDocument();
  });

  it("shows a distinct timeout error and retries with the same image", async () => {
    mockedDetectImage.mockRejectedValueOnce(new DetectionApiError("TIMEOUT"));
    render(<Home />);
    await upload();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("30 giây"));
    expect(screen.getByAltText("Ảnh đã chọn: sample.png")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument());
  });

  it("clears the overlay on replacement and aborts pending work on unmount", async () => {
    mockedDetectImage.mockResolvedValueOnce(detectedResponse);
    const { unmount } = render(<Home />);
    await upload();
    await waitFor(() => expect(document.querySelector("canvas")).toBeInTheDocument());
    let signal: AbortSignal | undefined;
    let reject: (error: Error) => void = () => undefined;
    mockedDetectImage.mockImplementationOnce((_file, options) => {
      signal = options?.signal;
      return new Promise((_resolve, fail) => { reject = fail; });
    });
    await upload(file("second.png"));
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => reject(new Error("late failure")));
  });
});
