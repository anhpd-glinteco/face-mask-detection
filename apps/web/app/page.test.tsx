import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  model: { name: "stub", version: "0.0.0" },
  detections: [],
  timing_ms: { preprocess: 0, inference: 0, postprocess: 0 },
};

const detectedResponse: DetectionResponse = {
  ...emptyResponse,
  detections: [{ class_id: 0, label: "with_mask", confidence: 0.98, bbox: { x1: 1, y1: 2, x2: 30, y2: 40 } }],
};

function file(name = "sample.png", type = "image/png", contents = "image") {
  return new File([contents], name, { type });
}

async function upload(selected = file()) {
  const input = screen.getByLabelText("Ảnh đầu vào") as HTMLInputElement;
  await userEvent.setup({ applyAccept: false }).upload(input, selected);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedDetectImage.mockResolvedValue(emptyResponse);
});
afterEach(() => cleanup());

describe("image detection flow", () => {
  it("previews a valid image, calls the stub, and shows the empty result", async () => {
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

  it("shows detections without rendering a canvas", async () => {
    mockedDetectImage.mockResolvedValue(detectedResponse);
    render(<Home />);
    await upload();
    await waitFor(() => expect(screen.getByText("Có khẩu trang")).toBeInTheDocument());
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
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
    expect(screen.queryByText("Có khẩu trang")).not.toBeInTheDocument();
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
});
