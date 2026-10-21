/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import type { DetectionResponse } from "@/lib/inference";
import { presentDetection } from "@/lib/detection-labels";

interface ImagePreviewProps {
  file: File;
  previewUrl: string;
  isLoading: boolean;
  onReplace: () => void;
  replaceLabel?: string;
  result: DetectionResponse | null;
  onDimensions: (width: number, height: number) => void;
  onError: () => void;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePreview({ file, previewUrl, isLoading, onReplace, replaceLabel = "Thay ảnh", result, onDimensions, onError }: ImagePreviewProps) {
  const [dimensions, setDimensions] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !result) return;

    function draw() {
      if (!image || !canvas || !result) return;
      const { width, height } = image.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const scaleX = width / result.image.width;
      const scaleY = height / result.image.height;
      const tokens = getComputedStyle(document.documentElement);
      const colors = {
        with_mask: tokens.getPropertyValue("--success"),
        without_mask: tokens.getPropertyValue("--danger"),
        mask_worn_incorrectly: tokens.getPropertyValue("--warning"),
      };
      result.detections.forEach((detection, index) => {
        const { x1, y1, x2, y2 } = detection.bbox;
        const presentation = presentDetection(detection);
        const color = presentation.uncertain ? "#6150a3" : colors[detection.label].trim();
        context.setLineDash(presentation.uncertain ? [6, 4] : []);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);
        const text = `${index + 1}. ${presentation.text}`;
        const labelHeight = Math.min(24, height);
        context.font = `${Math.min(14, Math.max(1, labelHeight - 4))}px sans-serif`;
        context.textBaseline = "middle";
        const labelWidth = Math.min(width, context.measureText(text).width + 8);
        const left = Math.max(0, Math.min(x1 * scaleX, width - labelWidth));
        const top = Math.max(0, Math.min(y1 * scaleY - labelHeight, height - labelHeight));
        context.fillStyle = color;
        context.fillRect(left, top, labelWidth, labelHeight);
        context.fillStyle = "#fff";
        const padding = Math.min(4, labelWidth / 4);
        context.fillText(text, left + padding, top + labelHeight / 2, labelWidth - padding * 2);
      });
    }

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(image);
    window.addEventListener("resize", draw);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [result]);
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
        <button className="secondary-button" type="button" onClick={onReplace}>{replaceLabel}</button>
      </div>
      <div className="preview-canvas">
        <img
          ref={imageRef}
          src={previewUrl}
          alt={`Ảnh đã chọn: ${file.name}`}
          onLoad={(event) => {
            const image = event.currentTarget;
            setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
            onDimensions(image.naturalWidth, image.naturalHeight);
          }}
          onError={onError}
        />
        {result && result.detections.length > 0 && <canvas ref={canvasRef} className="detection-canvas" aria-hidden="true" />}
        {isLoading && (
          <div className="preview-overlay">
            <span className="spinner" aria-hidden="true" /><span>Đang phân tích ảnh…</span>
          </div>
        )}
      </div>
    </div>
  );
}
