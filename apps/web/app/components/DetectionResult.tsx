import type { DetectionPhase } from "../page";
import type { DetectionResponse } from "@/lib/inference";
import { LABELS, presentDetection, visibleDetections } from "@/lib/detection-labels";

interface DetectionResultProps {
  result: DetectionResponse | null;
  phase: DetectionPhase;
  showUncertain?: boolean;
  onShowUncertain?: (show: boolean) => void;
}

export function DetectionResult({ result, phase, showUncertain = false, onShowUncertain }: DetectionResultProps) {
  const total = result?.detections.length ?? 0;
  const uncertain = result?.detections.filter(d => presentDetection(d).uncertain).length ?? 0;
  const counts = <p aria-label="Thống kê detection">{total - uncertain} phát hiện đạt ngưỡng trong frame · {uncertain} chưa chắc chắn</p>;
  if (phase === "idle") return <div className="result-empty"><span className="result-glyph" aria-hidden="true">○</span><p>Chưa có ảnh để phân tích.</p></div>;
  if (phase === "loading") return <div className="result-empty"><span className="mini-spinner" aria-hidden="true" /><p>Đang chờ kết quả…</p></div>;
  if (phase === "error") return <div className="result-empty"><span className="result-glyph error-glyph" aria-hidden="true">!</span><p>Kết quả chưa khả dụng.</p></div>;
  if (!result || result.detections.length === 0) return <div className="result-empty success-empty" role="status" aria-live="polite"><span className="result-glyph" aria-hidden="true">✓</span><p>Không phát hiện đối tượng</p><small>Mô hình không trả về đối tượng trong ảnh này.</small>{counts}</div>;
  function rows(detections: DetectionResponse["detections"], offset: number) {
    return detections.map((detection, index) => (
      <li className={presentDetection(detection).uncertain ? "detection-uncertain" : undefined} key={offset + index}>
        <span className={`status-dot status-${presentDetection(detection).uncertain ? "uncertain" : detection.label}`} aria-hidden="true" />
        <span>{offset + index + 1}. {LABELS[detection.label]}{presentDetection(detection).uncertain && <small className="uncertainty-badge">Chưa chắc chắn</small>}</span>
        <strong>{Math.round(detection.confidence * 100)}%</strong>
      </li>
    ));
  }
  const accepted = visibleDetections(result.detections, false);
  const weak = visibleDetections(result.detections, true).slice(accepted.length);
  return <div className="result-content">
    {counts}
    <div className="result-count"><strong>{accepted.length}</strong><span>phát hiện đạt ngưỡng trong frame</span></div>
    {!accepted.length && <p role="status">Chưa có phát hiện đạt ngưỡng</p>}
    <ul className="detection-list" aria-label="Danh sách đối tượng phát hiện">{rows(accepted, 0)}</ul>
    {weak.length > 0 && <div>
      <button type="button" className="secondary-button" aria-expanded={showUncertain} onClick={() => onShowUncertain?.(!showUncertain)}>Xem dự đoán chưa chắc chắn ({weak.length})</button>
      {showUncertain && <ul className="detection-list" aria-label="Dự đoán chưa chắc chắn">{rows(weak, accepted.length)}</ul>}
    </div>}
  </div>;
}
