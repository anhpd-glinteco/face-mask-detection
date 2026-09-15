"use client";

import { ChangeEvent, useState } from "react";
import { detectImage, type DetectionResponse } from "@/lib/inference";

type Mode = "image" | "video" | "webcam";

export default function Home() {
  const [mode, setMode] = useState<Mode>("image");
  const [status, setStatus] = useState("Chọn một nguồn để bắt đầu.");
  const [result, setResult] = useState<DetectionResponse | null>(null);

  async function onImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("Đang phân tích…");
    try {
      const response = await detectImage(file);
      setResult(response);
      setStatus(`Hoàn tất: ${response.detections.length} detection(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Không thể phân tích ảnh.");
    }
  }

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Computer Vision MVP</p>
        <h1>Face Mask Detection</h1>
        <p>Phát hiện trạng thái khẩu trang mà không nhận diện hoặc lưu danh tính.</p>
      </section>

      <nav aria-label="Chọn nguồn đầu vào" className="tabs">
        {(["image", "video", "webcam"] as Mode[]).map((item) => (
          <button key={item} aria-pressed={mode === item} onClick={() => setMode(item)}>
            {item === "image" ? "Ảnh" : item === "video" ? "Video" : "Webcam"}
          </button>
        ))}
      </nav>

      <section className="panel">
        {mode === "image" ? (
          <label className="picker">
            Chọn ảnh JPEG, PNG hoặc WebP
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} />
          </label>
        ) : (
          <p>
            Skeleton đã dành sẵn flow {mode === "video" ? "video sampling" : "webcam sampling"}.
            Triển khai trong Sprint 2 sau khi contract P0 được duyệt.
          </p>
        )}
        <p role="status">{status}</p>
        {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      </section>
    </main>
  );
}

