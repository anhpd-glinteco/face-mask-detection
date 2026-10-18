import type { FrameStatistics as Statistics } from "@/lib/frame-sampler";

export function FrameStatistics({ statistics }: { statistics: Statistics }) {
  return <section aria-label="Thống kê lấy mẫu">
    <dl>
      <div><dt>Frame đã xử lý</dt><dd>{statistics.processed}</dd></div>
      <div><dt>Lượt lấy mẫu bỏ qua do bận</dt><dd>{statistics.skipped}</dd></div>
      <div><dt>FPS xử lý</dt><dd>{statistics.fps.toFixed(2)}</dd></div>
      <div><dt>Latency frame gần nhất</dt><dd>{statistics.latencyMs === null ? "—" : `${statistics.latencyMs.toFixed(0)} ms`}</dd></div>
    </dl>
    <p className="helper-text">Nhịp mục tiêu 200 ms. Lượt bỏ qua không phải frame camera bị mất; FPS xử lý không phải FPS nguồn. Latency gồm chụp frame và chờ kết quả API.</p>
  </section>;
}
