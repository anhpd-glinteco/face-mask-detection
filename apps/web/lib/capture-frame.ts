import { detectImage, MAX_UPLOAD_BYTES, type DetectionResponse } from "./inference";

export interface FrameSnapshot {
  file: File;
  timestamp: number;
  result: DetectionResponse;
}

export async function captureFrame(video: HTMLVideoElement, signal: AbortSignal, name: string): Promise<FrameSnapshot> {
  if (video.paused || video.seeking || video.ended || video.readyState < 2) {
    throw new Error("Video chưa sẵn sàng. Hãy chờ tải rồi phát lại.");
  }
  const width = video.videoWidth;
  const height = video.videoHeight;
  // shortcut: cap local capture at 20 MP for memory, revisit for larger video requirements.
  if (!width || !height || width * height > 20_000_000) throw new Error("Kích thước frame không hợp lệ hoặc vượt quá 20 triệu pixel.");
  const timestamp = video.currentTime;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Trình duyệt không hỗ trợ chụp frame.");
  context.drawImage(video, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (value) => value ? resolve(value) : reject(new Error("Không thể chụp frame video.")), "image/jpeg", 0.9,
  ));
  signal.throwIfAborted();
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("Frame vượt quá dung lượng ảnh cho phép.");
  const file = new File([blob], name, { type: "image/jpeg" });
  const result = await detectImage(file, { signal });
  signal.throwIfAborted();
  if (result.image.width !== width || result.image.height !== height) throw new Error("Kích thước kết quả không khớp frame video.");
  return { file, timestamp, result };
}
