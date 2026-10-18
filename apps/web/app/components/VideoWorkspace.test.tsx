import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectImage, DetectionApiError, type DetectionResponse } from "@/lib/inference";
import { VideoWorkspace } from "./VideoWorkspace";

vi.mock("@/lib/inference", async () => ({
  ...await vi.importActual<typeof import("@/lib/inference")>("@/lib/inference"), detectImage: vi.fn(),
}));

const response: DetectionResponse = {
  schema_version: "1.0", image: { width: 120, height: 80 }, model: { name: "fixture", version: "v1" },
  detections: [], timing_ms: { preprocess: 0, inference: 1, postprocess: 0 },
};
const detect = vi.mocked(detectImage);
let paused = false;
let seeking = false;
let encode: (callback: BlobCallback) => void;

beforeEach(() => {
  vi.useFakeTimers();
  paused = false; seeking = false;
  encode = (callback) => callback(new Blob(["frame"], { type: "image/jpeg" }));
  detect.mockReset().mockResolvedValue(response);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => encode(cb));
  vi.spyOn(URL, "revokeObjectURL");
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function select(name = "clip.webm", type = "video/webm") {
  fireEvent.change(screen.getByLabelText("Video đầu vào"), { target: { files: [new File(["video"], name, { type })] } });
  const video = screen.queryByLabelText("Video đã chọn") as HTMLVideoElement | null;
  if (video) Object.defineProperties(video, {
    videoWidth: { configurable: true, value: 120 }, videoHeight: { configurable: true, value: 80 },
    readyState: { configurable: true, value: 2 }, currentTime: { configurable: true, value: 1.25 },
    paused: { configurable: true, get: () => paused }, seeking: { configurable: true, get: () => seeking },
  });
  return video!;
}
async function flush() { await act(async () => { await vi.advanceTimersByTimeAsync(0); }); }

describe("local video", () => {
  it("sends only a JPEG frame, displays the analyzed timestamp and clears results on pause", async () => {
    render(<VideoWorkspace active />);
    const video = select();
    fireEvent.playing(video);
    await flush();
    expect(detect).toHaveBeenCalledTimes(1);
    const frame = detect.mock.calls[0][0];
    expect(frame.type).toBe("image/jpeg");
    expect(frame.name).toBe("video-frame.jpg");
    expect(screen.getByText(/Frame đã phân tích · 1.25 giây/)).toBeInTheDocument();
    expect(screen.getByText("Không phát hiện đối tượng")).toBeInTheDocument();
    paused = true; fireEvent.pause(video);
    expect(screen.queryByRole("region", { name: "Frame đã phân tích" })).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(detect).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:video-frame.jpg");
  });

  it("invalidates encoding on seek and holds the lock until encoding settles", async () => {
    let finish!: BlobCallback;
    encode = (cb) => { finish = cb; };
    render(<VideoWorkspace active />);
    const video = select(); fireEvent.playing(video);
    seeking = true; fireEvent.seeking(video);
    seeking = false; fireEvent.seeked(video);
    expect(detect).not.toHaveBeenCalled();
    await act(async () => { finish(new Blob(["old"])); });
    expect(detect).not.toHaveBeenCalled();
    encode = (cb) => cb(new Blob(["new"]));
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    expect(detect).toHaveBeenCalledTimes(1);
  });

  it.each(["pause", "seeking", "ended", "replace", "inactive", "unmount"])("discards a late API result after %s", async (event) => {
    let finish!: (value: DetectionResponse) => void;
    detect.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const view = render(<VideoWorkspace active />);
    const video = select(); fireEvent.playing(video); await flush();
    const signal = detect.mock.calls[0][1]?.signal;
    if (event === "replace") select("other.webm");
    else if (event === "inactive") view.rerender(<VideoWorkspace active={false} />);
    else if (event === "unmount") view.unmount();
    else fireEvent[event as "pause" | "seeking" | "ended"](video);
    expect(signal?.aborted).toBe(true);
    await act(async () => { finish(response); });
    expect(screen.queryByText(/Frame đã phân tích ·/)).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([new DetectionApiError("MODEL_NOT_READY"), new DetectionApiError("TIMEOUT")])("stops on API error and retries explicitly (%s)", async (error) => {
    detect.mockRejectedValueOnce(error);
    render(<VideoWorkspace active />);
    const video = select(); fireEvent.loadedData(video); fireEvent.playing(video); await flush();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.playing(video);
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(detect).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" })); await flush();
    expect(detect).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("blocks invalid/corrupt video and reports failed frame capture", async () => {
    render(<VideoWorkspace active />);
    select("text.txt", "text/plain");
    expect(screen.getByRole("alert")).toHaveTextContent("file video");
    const video = select(); fireEvent.error(video);
    expect(screen.getByRole("alert")).toHaveTextContent("codec");
    expect(detect).not.toHaveBeenCalled();
    const other = select("other.webm");
    encode = (cb) => cb(null);
    fireEvent.playing(other); await flush();
    expect(screen.getByRole("alert")).toHaveTextContent("Không thể chụp frame");
    expect(detect).not.toHaveBeenCalled();
  });

  it("rejects response dimensions and releases media URLs on deactivation", async () => {
    detect.mockResolvedValue({ ...response, image: { width: 1, height: 1 } });
    const view = render(<VideoWorkspace active />);
    const video = select(); fireEvent.playing(video); await flush();
    expect(screen.getByRole("alert")).toHaveTextContent("không khớp frame");
    view.rerender(<VideoWorkspace active={false} />);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:clip.webm");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects capture dimensions and encoded payloads above the local limits", async () => {
    render(<VideoWorkspace active />);
    const video = select();
    Object.defineProperty(video, "videoWidth", { configurable: true, value: 300_000 });
    fireEvent.loadedData(video); fireEvent.playing(video); await flush();
    expect(screen.getByRole("alert")).toHaveTextContent("20 triệu pixel");
    expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled();
    const other = select("other.webm");
    encode = (cb) => cb(new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]));
    fireEvent.playing(other); await flush();
    expect(screen.getByRole("alert")).toHaveTextContent("Frame vượt quá");
    expect(detect).not.toHaveBeenCalled();
  });
});
