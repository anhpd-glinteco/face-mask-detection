"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captureFrame, type FrameSnapshot } from "@/lib/capture-frame";
import { createFrameSampler, EMPTY_FRAME_STATISTICS } from "@/lib/frame-sampler";
import { messageForError } from "@/lib/detection-errors";
import { ImagePreview } from "./ImagePreview";
import { DetectionResult } from "./DetectionResult";
import { FrameStatistics } from "./FrameStatistics";

function cameraError(error: unknown) {
  const name = error && typeof error === "object" && "name" in error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Quyền camera bị từ chối. Hãy cho phép camera trong trình duyệt rồi thử lại.";
  if (name === "NotFoundError") return "Không tìm thấy camera. Hãy kết nối camera rồi thử lại.";
  if (name === "NotReadableError" || name === "AbortError") return "Không thể mở camera; camera có thể đang bận. Hãy đóng ứng dụng khác rồi thử lại.";
  return "Không thể khởi động camera. Hãy kiểm tra thiết bị rồi thử lại.";
}

export function WebcamWorkspace() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generationRef = useRef(0);
  const snapshotUrlRef = useRef<string | null>(null);
  const samplerRef = useRef<ReturnType<typeof createFrameSampler<FrameSnapshot>> | null>(null);
  const [phase, setPhase] = useState<"idle" | "opening" | "running">("idle");
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState(EMPTY_FRAME_STATISTICS);
  const [snapshot, setSnapshot] = useState<(FrameSnapshot & { url: string }) | null>(null);

  const release = useCallback(() => {
    generationRef.current += 1;
    samplerRef.current?.stop();
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => { track.onended = null; track.stop(); });
    if (videoRef.current) videoRef.current.srcObject = null;
    if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
    snapshotUrlRef.current = null;
  }, []);

  function stop() {
    release();
    setPhase("idle");
    setSnapshot(null);
  }

  useEffect(() => {
    const sampler = createFrameSampler<FrameSnapshot>({
      process: (signal) => {
        if (!videoRef.current || !streamRef.current) throw new Error("Camera chưa sẵn sàng.");
        return captureFrame(videoRef.current, signal, "webcam-frame.jpg");
      },
      onStatistics: setStatistics,
      onResult(value) {
        const url = URL.createObjectURL(value.file);
        if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
        snapshotUrlRef.current = url;
        setSnapshot({ ...value, url });
      },
      onError(caught) {
        release();
        setPhase("idle");
        setSnapshot(null);
        setError(messageForError(caught));
      },
    });
    samplerRef.current = sampler;
    return () => {
      release();
      samplerRef.current = null;
    };
  }, [release]);

  async function start() {
    stop();
    setError(null);
    setStatistics(EMPTY_FRAME_STATISTICS);
    if (!window.isSecureContext) {
      setError("Camera cần HTTPS hoặc localhost. Hãy mở ứng dụng trong môi trường an toàn.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ truy cập camera.");
      return;
    }
    const generation = generationRef.current;
    setPhase("opening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (!stream.getVideoTracks().some((track) => track.readyState === "live")) throw new Error("No live camera track");
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          stop();
          setError("Camera đã ngắt kết nối. Hãy kết nối lại rồi bấm Bắt đầu.");
        };
      });
      const video = videoRef.current;
      if (!video) throw new Error("Camera preview unavailable");
      video.srcObject = stream;
      await video.play();
      if (generation !== generationRef.current) return;
      setPhase("running");
    } catch (caught) {
      if (generation !== generationRef.current) return;
      stop();
      setError(cameraError(caught));
    }
  }

  return <section className="video-workspace" aria-label="Phân tích webcam">
    <h2>Webcam</h2>
    <p>Chỉ mở camera khi bấm Bắt đầu. Không thu âm; chỉ frame JPEG được gửi để phân tích.</p>
    <button type="button" className="secondary-button" disabled={phase !== "idle"} onClick={() => void start()}>Bắt đầu</button>
    <button type="button" className="secondary-button" disabled={phase === "idle"} onClick={stop}>Dừng</button>
    {error && <p role="alert">{error}</p>}
    <p role="status">{phase === "opening" ? "Đang mở camera…" : phase === "running" ? "Đang phân tích webcam…" : "Camera đã dừng."}</p>
    <div className="video-preview" hidden={phase === "idle"}>
      <video ref={videoRef} muted playsInline aria-label="Camera trực tiếp" onPlaying={() => {
        if (streamRef.current) samplerRef.current?.start();
      }} onError={() => {
        stop();
        setError("Không thể đọc hình ảnh camera. Hãy bấm Bắt đầu để thử lại.");
      }} />
    </div>
    <FrameStatistics statistics={statistics} />
    {snapshot && <section aria-label="Frame đã phân tích">
      <h3>Frame đã phân tích · {snapshot.timestamp.toFixed(2)} giây</h3>
      <ImagePreview key={snapshot.url} file={snapshot.file} previewUrl={snapshot.url} result={snapshot.result}
        replaceLabel="Dừng camera" isLoading={false} onReplace={stop} onDimensions={() => undefined}
        onError={() => { stop(); setError("Không thể đọc snapshot. Hãy bấm Bắt đầu để thử lại."); }} />
      <DetectionResult phase="success" result={snapshot.result} />
      <p className="helper-text">Số lượng chỉ thuộc frame này, không phải tổng người trước camera.</p>
    </section>}
  </section>;
}
