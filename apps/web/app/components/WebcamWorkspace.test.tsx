import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureFrame } from "@/lib/capture-frame";
import { WebcamWorkspace } from "./WebcamWorkspace";

vi.mock("@/lib/capture-frame", () => ({ captureFrame: vi.fn() }));
const capture = vi.mocked(captureFrame);
const getUserMedia = vi.fn();

function stream() {
  const track = { stop: vi.fn(), onended: null as (() => void) | null, readyState: "live" };
  return { track, media: { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream };
}
const result = { schema_version: "1.0" as const, image: { width: 120, height: 80 }, model: { name: "fixture", version: "p8" }, detections: [], timing_ms: { preprocess: 1, inference: 2, postprocess: 1 } };
const frame = { file: new File(["jpeg"], "webcam-frame.jpg", { type: "image/jpeg" }), timestamp: 1.25, result };
async function flush() { await act(async () => { await vi.advanceTimersByTimeAsync(0); }); }
async function start() { fireEvent.click(screen.getByRole("button", { name: "Bắt đầu" })); await flush(); }

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  getUserMedia.mockReset();
  capture.mockReset().mockResolvedValue(frame);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
    fireEvent.playing(this);
    return Promise.resolve();
  });
  vi.spyOn(URL, "revokeObjectURL");
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("webcam", () => {
  it("opens only on click without audio, renders snapshot/statistics and stops tracks/request/URLs", async () => {
    const { media, track } = stream(); getUserMedia.mockResolvedValue(media);
    render(<WebcamWorkspace />);
    expect(getUserMedia).not.toHaveBeenCalled();
    await start();
    expect(getUserMedia).toHaveBeenCalledExactlyOnceWith({ video: true, audio: false });
    expect(capture).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Frame đã phân tích · 1.25/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Thống kê lấy mẫu" })).toHaveTextContent("Frame đã xử lý1");
    const video = screen.getByLabelText("Camera trực tiếp") as HTMLVideoElement;
    expect(video.srcObject).toBe(media);
    expect(video.muted).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Dừng" }));
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(video.srcObject).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:webcam-frame.jpg");
    expect(screen.queryByRole("region", { name: "Frame đã phân tích" })).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["stop", "unmount"])("stops a permission stream that arrives after %s", async (action) => {
    let finish!: (value: MediaStream) => void;
    getUserMedia.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const view = render(<WebcamWorkspace />); await start();
    if (action === "stop") fireEvent.click(screen.getByRole("button", { name: "Dừng" }));
    else view.unmount();
    const { media, track } = stream();
    await act(async () => { finish(media); });
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(capture).not.toHaveBeenCalled();
  });

  it.each([["NotAllowedError", "từ chối"], ["SecurityError", "từ chối"], ["NotFoundError", "Không tìm thấy"], ["NotReadableError", "đang bận"], ["AbortError", "đang bận"]])("reports %s and allows explicit retry", async (name, message) => {
    getUserMedia.mockRejectedValueOnce(new DOMException("fixture", name)).mockResolvedValue(stream().media);
    render(<WebcamWorkspace />); await start();
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    await start();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it.each(["insecure", "unsupported"])("reports %s without requesting camera", async (kind) => {
    if (kind === "insecure") vi.stubGlobal("isSecureContext", false);
    else Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    render(<WebcamWorkspace />); await start();
    expect(screen.getByRole("alert")).toHaveTextContent(kind === "insecure" ? "HTTPS" : "không hỗ trợ");
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it.each(["ended", "stop", "unmount", "error"])("discards old capture after %s and releases the camera", async (action) => {
    let finish!: (value: typeof frame) => void;
    capture.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { media, track } = stream(); getUserMedia.mockResolvedValue(media);
    const view = render(<WebcamWorkspace />); await start();
    const signal = capture.mock.calls[0][1];
    if (action === "ended") act(() => track.onended?.());
    else if (action === "unmount") view.unmount();
    else if (action === "error") fireEvent.error(screen.getByLabelText("Camera trực tiếp"));
    else fireEvent.click(screen.getByRole("button", { name: "Dừng" }));
    expect(signal.aborted).toBe(true);
    expect(track.stop).toHaveBeenCalledTimes(1);
    await act(async () => { finish(frame); });
    expect(screen.queryByText(/Frame đã phân tích ·/)).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops the camera on API failure and releases it on play failure", async () => {
    const first = stream(); getUserMedia.mockResolvedValue(first.media);
    capture.mockRejectedValueOnce(new Error("API fixture failed"));
    render(<WebcamWorkspace />); await start();
    expect(screen.getByRole("alert")).toHaveTextContent("API fixture failed");
    expect(first.track.stop).toHaveBeenCalledTimes(1);
    const second = stream(); getUserMedia.mockResolvedValue(second.media);
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error("play failed"));
    await start();
    expect(second.track.stop).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeEnabled();
  });
});
