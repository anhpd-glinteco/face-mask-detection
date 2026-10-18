"use client";

import { useEffect, useRef, useState } from "react";
import { captureFrame, type FrameSnapshot as Snapshot } from "@/lib/capture-frame";
import { createFrameSampler, EMPTY_FRAME_STATISTICS } from "@/lib/frame-sampler";
import { messageForError } from "@/lib/detection-errors";
import { ImagePreview } from "./ImagePreview";
import { DetectionResult } from "./DetectionResult";
import { FrameStatistics } from "./FrameStatistics";

export function VideoWorkspace({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceRef = useRef<string | null>(null);
  const snapshotUrlRef = useRef<string | null>(null);
  const [statistics, setStatistics] = useState(EMPTY_FRAME_STATISTICS);
  const [source, setSource] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [snapshot, setSnapshot] = useState<(Snapshot & { url: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const blockedRef = useRef(false);
  const samplerRef = useRef<ReturnType<typeof createFrameSampler<Snapshot>> | null>(null);
  const [previousActive, setPreviousActive] = useState(active);
  if (previousActive !== active) {
    setPreviousActive(active);
    setSource(null);
    setSnapshot(null);
    setReady(false);
    setRunning(false);
    setError(null);
  }

  useEffect(() => {
    const sampler = createFrameSampler<Snapshot>({
      async process(signal) {
        const video = videoRef.current;
        if (!video || video.paused || video.seeking || video.ended || video.readyState < 2) {
          throw new Error("Video chưa sẵn sàng. Hãy chờ tải rồi phát lại.");
        }
        return captureFrame(video, signal, "video-frame.jpg");
      },
      onStatistics: setStatistics,
      onResult(value) {
        const url = URL.createObjectURL(value.file);
        if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
        snapshotUrlRef.current = url;
        setSnapshot({ ...value, url });
      },
      onError(caught) {
        blockedRef.current = true;
        setRunning(false);
        setError(messageForError(caught));
      },
    });
    samplerRef.current = sampler;
    return () => {
      sampler.stop();
      samplerRef.current = null;
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current);
      if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
    };
  }, []);

  function clearSnapshot() {
    if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
    snapshotUrlRef.current = null;
    setSnapshot(null);
  }

  function invalidate() {
    samplerRef.current?.stop();
    setRunning(false);
    clearSnapshot();
  }

  useEffect(() => {
    if (!active) {
      samplerRef.current?.stop();
      videoRef.current?.pause();
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current);
      sourceRef.current = null;
      if (snapshotUrlRef.current) URL.revokeObjectURL(snapshotUrlRef.current);
      snapshotUrlRef.current = null;
    }
  }, [active]);

  function start() {
    const video = videoRef.current;
    if (!active || blockedRef.current || !video || video.paused || video.seeking || video.ended || video.readyState < 2) return;
    setRunning(true);
    samplerRef.current?.start();
  }

  return (
    <section hidden={!active} className="video-workspace" aria-label="Phân tích video">
      <h2>Video local</h2>
      <p>Chọn video rồi phát. Chỉ frame ảnh được gửi để phân tích; toàn bộ video ở trình duyệt.</p>
      <label className="control-label" htmlFor="video-input">Video đầu vào</label>
      <input id="video-input" type="file" accept="video/*" onChange={(event) => {
        const file = event.target.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        invalidate();
        setStatistics(EMPTY_FRAME_STATISTICS);
        videoRef.current?.pause();
        if (sourceRef.current) URL.revokeObjectURL(sourceRef.current);
        sourceRef.current = null;
        setSource(null);
        setName(file.name);
        setReady(false);
        setDecodeFailed(false);
        blockedRef.current = false;
        setError(null);
        if (!file.size || !file.type.startsWith("video/")) {
          setDecodeFailed(true);
          setError("Vui lòng chọn file video không rỗng có định dạng được trình duyệt hỗ trợ.");
          return;
        }
        const url = URL.createObjectURL(file);
        sourceRef.current = url;
        setSource(url);
      }} />
      {source && <div className="video-preview">
        <p>{name}</p>
        {/* The local media has no authored caption track; analysis remains available as text below. */}
        <video key={source} ref={videoRef} src={source} controls playsInline preload="metadata" aria-label="Video đã chọn"
          onLoadedData={() => setReady(true)} onPlaying={start} onSeeked={start}
          onPause={invalidate} onSeeking={invalidate} onEnded={invalidate}
          onError={() => {
            invalidate();
            blockedRef.current = true;
            setDecodeFailed(true);
            setReady(false);
            setError("Không thể đọc video hoặc codec chưa được hỗ trợ. Vui lòng chọn video khác.");
          }} />
      </div>}
      {error && <div className="error-row" role="alert"><span>{error}</span>
        {source && ready && !decodeFailed && <button type="button" className="retry-button" onClick={() => {
          blockedRef.current = false;
          setError(null);
          if (videoRef.current?.paused) {
            void videoRef.current.play().catch(() => setError("Không thể phát video. Hãy dùng nút phát trên video."));
          } else start();
        }}>Thử lại</button>}
      </div>}
      <FrameStatistics statistics={statistics} />
      <p role="status">{running ? "Đang phân tích từng frame…" : "Phát video để phân tích frame."}</p>
      {snapshot && <section aria-label="Frame đã phân tích">
        <h3>Frame đã phân tích · {snapshot.timestamp.toFixed(2)} giây</h3>
        <ImagePreview key={snapshot.url} file={snapshot.file} previewUrl={snapshot.url} result={snapshot.result} replaceLabel="Thay video"
          isLoading={false} onReplace={() => document.getElementById("video-input")?.click()}
          onDimensions={() => undefined} onError={() => {
            invalidate();
            blockedRef.current = true;
            setError("Không thể đọc snapshot. Vui lòng thử lại.");
          }} />
        <DetectionResult phase="success" result={snapshot.result} />
        <p className="helper-text">Số lượng chỉ thuộc frame này, không phải tổng người trong video.</p>
      </section>}
    </section>
  );
}
