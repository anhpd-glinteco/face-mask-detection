export interface FrameStatistics {
  processed: number;
  skipped: number;
  fps: number;
  latencyMs: number | null;
}

export const EMPTY_FRAME_STATISTICS: FrameStatistics = { processed: 0, skipped: 0, fps: 0, latencyMs: null };

// Cancellation invalidates work immediately; the busy lock lasts until it settles.
export function createFrameSampler<T>(options: {
  process: (signal: AbortSignal) => Promise<T>;
  onResult: (result: T) => void;
  onError: (error: unknown) => void;
  onStatistics?: (statistics: FrameStatistics) => void;
}) {
  let generation = 0;
  let running = false;
  let busy = false;
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  let started = 0;
  let statistics = { ...EMPTY_FRAME_STATISTICS };

  function publish() {
    const elapsed = performance.now() - started;
    statistics = { ...statistics, fps: elapsed > 0 ? statistics.processed * 1000 / elapsed : 0 };
    options.onStatistics?.({ ...statistics });
  }

  function stop() {
    if (running) publish();
    running = false;
    generation += 1;
    clearInterval(timer);
    controller?.abort();
  }

  async function tick() {
    if (!running) return;
    if (busy) {
      statistics.skipped += 1;
      publish();
      return;
    }
    busy = true;
    const current = generation;
    const request = new AbortController();
    controller = request;
    const captured = performance.now();
    try {
      const result = await options.process(request.signal);
      if (running && current === generation) {
        statistics.processed += 1;
        statistics.latencyMs = performance.now() - captured;
        publish();
        options.onResult(result);
      }
    } catch (error) {
      if (running && current === generation) {
        stop();
        options.onError(error);
      }
    } finally {
      busy = false;
      controller = null;
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      started = performance.now();
      statistics = { ...EMPTY_FRAME_STATISTICS };
      publish();
      timer = setInterval(() => void tick(), 200);
      void tick();
    },
    stop,
  };
}
