// Cancellation invalidates work immediately; the busy lock lasts until it settles.
export function createFrameSampler<T>(options: {
  process: (signal: AbortSignal) => Promise<T>;
  onResult: (result: T) => void;
  onError: (error: unknown) => void;
}) {
  let generation = 0;
  let running = false;
  let busy = false;
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function stop() {
    running = false;
    generation += 1;
    clearTimeout(timer);
    controller?.abort();
  }

  async function tick() {
    if (!running || busy) return;
    busy = true;
    const current = generation;
    const request = new AbortController();
    controller = request;
    try {
      const result = await options.process(request.signal);
      if (running && current === generation) options.onResult(result);
    } catch (error) {
      if (running && current === generation) {
        stop();
        options.onError(error);
      }
    } finally {
      busy = false;
      controller = null;
      if (running) timer = setTimeout(() => void tick(), 200);
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      void tick();
    },
    stop,
  };
}
