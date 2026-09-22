/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

interface ImagePreviewProps {
  file: File;
  previewUrl: string;
  isLoading: boolean;
  onReplace: () => void;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePreview({ file, previewUrl, isLoading, onReplace }: ImagePreviewProps) {
  const [dimensions, setDimensions] = useState<string | null>(null);
  return (
    <div className="preview-frame">
      <div className="preview-toolbar">
        <div className="preview-file">
          <span className="file-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h8l4 4v14H6zM14 3v5h5" strokeLinejoin="round" /></svg></span>
          <div>
            <strong title={file.name}>{file.name}</strong>
            <span>{dimensions ?? "Đang đọc kích thước"} · {formatBytes(file.size)}</span>
          </div>
        </div>
        <button className="secondary-button" type="button" onClick={onReplace}>Thay ảnh</button>
      </div>
      <div className="preview-canvas">
        <img
          src={previewUrl}
          alt={`Ảnh đã chọn: ${file.name}`}
          onLoad={(event) => {
            const image = event.currentTarget;
            setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
          }}
        />
        {isLoading && (
          <div className="preview-overlay">
            <span className="spinner" aria-hidden="true" /><span>Đang phân tích ảnh…</span>
          </div>
        )}
      </div>
    </div>
  );
}
