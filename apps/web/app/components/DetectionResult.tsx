import type { DetectionPhase } from "../page";
import type { DetectionResponse } from "@/lib/inference";
import { LABELS, presentDetection } from "@/lib/detection-labels";

interface DetectionResultProps {
  result: DetectionResponse | null;
  phase: DetectionPhase;
}

export function DetectionResult({ result, phase }: DetectionResultProps) {
  const total = result?.detections.length ?? 0;
  const uncertain = result?.detections.filter(d => presentDetection(d).uncertain).length ?? 0;
  const counts = <p aria-label="Thống kê detection">Tổng: {total} · Đạt ngưỡng: {total - uncertain} · Chưa chắc chắn: {uncertain}</p>;
  if (phase === "idle") return <div className="result-empty"><span className="result-glyph" aria-hidden="true">○</span><p>Chưa có ảnh để phân tích.</p></div>;
  if (phase === "loading") return <div className="result-empty"><span className="mini-spinner" aria-hidden="true" /><p>Đang chờ kết quả…</p></div>;
  if (phase === "error") return <div className="result-empty"><span className="result-glyph error-glyph" aria-hidden="true">!</span><p>Kết quả chưa khả dụng.</p></div>;
  if (!result || result.detections.length === 0) return <div className="result-empty success-empty" role="status" aria-live="polite"><span className="result-glyph" aria-hidden="true">✓</span><p>Không phát hiện đối tượng</p><small>Mô hình không trả về đối tượng trong ảnh này.</small>{counts}</div>;
  return (
    <div className="result-content" role="status" aria-live="polite">
      {counts}
      <div className="result-count"><strong>{result.detections.length}</strong><span>đối tượng</span></div>
      <ul className="detection-list" aria-label="Danh sách đối tượng phát hiện">
        {result.detections.map((detection, index) => (
          <li className={presentDetection(detection).uncertain ? "detection-uncertain" : undefined} key={`${detection.class_id}-${index}`}>
            <span className={`status-dot status-${presentDetection(detection).uncertain ? "uncertain" : detection.label}`} aria-hidden="true" />
            <span>{index + 1}. {LABELS[detection.label]}{presentDetection(detection).uncertain && <small className="uncertainty-badge">Chưa chắc chắn</small>}</span>
            <strong>{Math.round(detection.confidence * 100)}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
