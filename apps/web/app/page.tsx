"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  detectImage,
  type DetectionApiError,
  type DetectionResponse,
} from "@/lib/inference";
import { DetectionResult } from "./components/DetectionResult";
import { DetectionStatus } from "./components/DetectionStatus";
import { ImagePreview } from "./components/ImagePreview";
import { ImageUploader } from "./components/ImageUploader";

type Mode = "image" | "video" | "webcam";
export type DetectionPhase = "idle" | "ready" | "loading" | "success" | "error";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "image", label: "Ảnh" },
  { id: "video", label: "Video" },
  { id: "webcam", label: "Webcam" },
];

function ModeIcon({ mode }: { mode: Mode }) {
  const path = mode === "image"
    ? "M4 4h16v16H4z M8 9h.01 M6 18l4-4 3 3 2-2 3 3"
    : mode === "video"
      ? "M4 6h11v12H4z M15 10l5-3v10l-5-3z"
      : "M12 4a5 5 0 1 0 0 10a5 5 0 0 0 0-10z M3 21a9 9 0 0 1 18 0";
  return <svg aria-hidden="true" className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={path} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Định dạng không được hỗ trợ. Vui lòng chọn ảnh JPEG, PNG hoặc WebP.";
  }
  if (file.size > MAX_UPLOAD_BYTES) return `Ảnh vượt quá dung lượng tối đa ${formatBytes(MAX_UPLOAD_BYTES)}.`;
  return null;
}

function messageForError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as DetectionApiError).code;
    if (code === "FILE_TOO_LARGE") return `Ảnh vượt quá dung lượng tối đa ${formatBytes(MAX_UPLOAD_BYTES)}.`;
    if (code === "UNSUPPORTED_TYPE") return "Định dạng không được hỗ trợ. Vui lòng chọn ảnh JPEG, PNG hoặc WebP.";
    if (code === "INVALID_IMAGE") return "Không thể đọc ảnh. File có thể bị hỏng hoặc không phải ảnh hợp lệ.";
    if (code === "NETWORK_ERROR") return "Không thể kết nối tới dịch vụ phân tích. Vui lòng kiểm tra kết nối và thử lại.";
    if (code === "INVALID_RESPONSE") return "Dữ liệu trả về từ dịch vụ không hợp lệ.";
    if (code === "SERVER_ERROR") return "Dịch vụ phân tích đang gặp sự cố. Vui lòng thử lại.";
  }
  return error instanceof Error ? error.message : "Không thể phân tích ảnh. Vui lòng thử lại.";
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("image");
  const [phase, setPhase] = useState<DetectionPhase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    requestRef.current?.abort();
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  async function analyze(nextFile: File) {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    setPhase("loading");

    try {
      const response = await detectImage(nextFile, { signal: controller.signal });
      if (requestId !== requestIdRef.current) return;
      setResult(response);
      setPhase("success");
    } catch (caught) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setError(messageForError(caught));
      setPhase("error");
    } finally {
      if (requestId === requestIdRef.current) requestRef.current = null;
    }
  }

  function selectFile(nextFile: File) {
    requestRef.current?.abort();
    requestIdRef.current += 1;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    setFile(nextFile);
    setResult(null);
    setError(null);

    const validationError = validateFile(nextFile);
    if (validationError) {
      previewUrlRef.current = null;
      setPreviewUrl(null);
      setError(validationError);
      setPhase("error");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(nextFile);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setPhase("ready");
    void analyze(nextFile);
  }

  function onImage(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    event.currentTarget.value = "";
    if (nextFile) selectFile(nextFile);
  }

  function retry() {
    if (!file || !previewUrl || validateFile(file)) return;
    setError(null);
    void analyze(file);
  }

  const isBusy = phase === "loading";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">M</div>
          <div><strong>MaskCheck</strong><span>Không gian kiểm định mô hình</span></div>
        </div>
        <div className="header-tools">
          <span className="model-status"><i aria-hidden="true" /> API stub sẵn sàng</span>
          <button className="icon-button" type="button" aria-label="Trợ giúp">?</button>
          <button className="icon-button" type="button" aria-label="Tùy chọn khác">⋯</button>
        </div>
      </header>

      <div className="workspace">
        <nav className="source-rail" aria-label="Chọn nguồn đầu vào">
          {MODES.map((item) => (
            <button
              className={`source-item ${mode === item.id ? "selected" : ""}`}
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              disabled={item.id !== "image"}
              onClick={() => setMode(item.id)}
              title={item.id === "image" ? undefined : "Sẽ triển khai ở tuần sau"}
            >
              <ModeIcon mode={item.id} />
              <span>{item.label}</span>
              {item.id !== "image" && <small>Sẽ triển khai ở tuần sau</small>}
            </button>
          ))}
        </nav>

        <section className="media-workspace" aria-labelledby="workspace-title">
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">PHÂN TÍCH ẢNH</p>
              <h1 id="workspace-title">Kiểm định trạng thái khẩu trang</h1>
              <p className="subtitle">Tải lên một ảnh để nhận kết quả từ API stub.</p>
            </div>
            {file && <span className="file-chip">{file.name}</span>}
          </div>

          <div className={`media-stage ${previewUrl ? "has-preview" : ""}`}>
            {previewUrl && file ? (
                <ImagePreview key={previewUrl} file={file} previewUrl={previewUrl} isLoading={isBusy} onReplace={() => inputRef.current?.click()} />
            ) : (
              <div className="empty-stage">
                <div className="upload-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg></div>
                <h2>Chọn ảnh để bắt đầu</h2>
                <p>Ảnh JPEG, PNG hoặc WebP · tối đa {formatBytes(MAX_UPLOAD_BYTES)}</p>
              </div>
            )}
          </div>

          <ImageUploader inputRef={inputRef} onChange={onImage} disabled={false} error={error && !previewUrl ? error : null} />
          <DetectionStatus phase={phase} error={previewUrl ? error : null} onRetry={retry} canRetry={Boolean(file && previewUrl)} />
          <p className="privacy-note">Không nhận diện danh tính. Dữ liệu không được lưu trong phiên MVP.</p>
        </section>

        <aside className="result-panel" aria-labelledby="result-title">
          <div className="panel-kicker">KẾT QUẢ PHÂN TÍCH</div>
          <h2 id="result-title">Trạng thái phát hiện</h2>
          <DetectionResult result={result} phase={phase} />
          <details className="model-details">
            <summary>Thông tin mô hình</summary>
            <dl>
              <div><dt>Kiến trúc</dt><dd>API stub</dd></div>
              <div><dt>Schema</dt><dd>1.0</dd></div>
              <div><dt>Trạng thái</dt><dd>Stub sẵn sàng</dd></div>
            </dl>
          </details>
        </aside>
      </div>
    </main>
  );
}
