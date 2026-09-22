import type { DetectionPhase } from "../page";

interface DetectionStatusProps {
  phase: DetectionPhase;
  error: string | null;
  onRetry: () => void;
  canRetry: boolean;
}

export function DetectionStatus({ phase, error, onRetry, canRetry }: DetectionStatusProps) {
  if (phase === "loading") return <p className="status-line" role="status" aria-live="polite">Đang phân tích ảnh…</p>;
  if (phase !== "error" || !error) return null;
  return (
    <div className="error-row" role="alert">
      <span>{error}</span>
      {canRetry && <button className="retry-button" type="button" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}
