import type { DetectionPhase } from "../page";
import type { DetectionResponse } from "@/lib/inference";
import { LABELS } from "@/lib/detection-labels";

interface DetectionResultProps {
  result: DetectionResponse | null;
  phase: DetectionPhase;
}

export function DetectionResult({ result, phase }: DetectionResultProps) {
  if (phase === "idle") return <div className="result-empty"><span className="result-glyph" aria-hidden="true">○</span><p>Chưa có ảnh để phân tích.</p></div>;
  if (phase === "loading") return <div className="result-empty"><span className="mini-spinner" aria-hidden="true" /><p>Đang chờ kết quả…</p></div>;
  if (phase === "error") return <div className="result-empty"><span className="result-glyph error-glyph" aria-hidden="true">!</span><p>Kết quả chưa khả dụng.</p></div>;
  if (!result || result.detections.length === 0) return <div className="result-empty success-empty" role="status" aria-live="polite"><span className="result-glyph" aria-hidden="true">✓</span><p>Không phát hiện đối tượng</p><small>Mô hình không trả về đối tượng trong ảnh này.</small></div>;
  return (
    <div className="result-content" role="status" aria-live="polite">
      <div className="result-count"><strong>{result.detections.length}</strong><span>đối tượng</span></div>
      <ul className="detection-list" aria-label="Danh sách đối tượng phát hiện">
        {result.detections.map((detection, index) => (
          <li key={`${detection.class_id}-${index}`}>
            <span className={`status-dot status-${detection.label}`} aria-hidden="true" />
            <span>{index + 1}. {LABELS[detection.label]}</span>
            <strong>{Math.round(detection.confidence * 100)}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
