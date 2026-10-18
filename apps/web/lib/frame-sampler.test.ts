import { afterEach, describe, expect, it, vi } from "vitest";
import { createFrameSampler } from "./frame-sampler";

afterEach(() => vi.useRealTimers());

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("serial frame sampler", () => {
  it("holds one lock through cancellation, restarts only after settlement and ignores stale results", async () => {
    vi.useFakeTimers();
    const old = deferred<number>();
    const next = deferred<number>();
    const process = vi.fn().mockReturnValueOnce(old.promise).mockReturnValue(next.promise);
    const onResult = vi.fn();
    const onError = vi.fn();
    const sampler = createFrameSampler({ process, onResult, onError });
    sampler.start();
    const signal = process.mock.calls[0][0] as AbortSignal;
    sampler.stop();
    sampler.start();
    sampler.stop();
    sampler.start();
    await vi.advanceTimersByTimeAsync(5000);
    expect(process).toHaveBeenCalledTimes(1);
    expect(signal.aborted).toBe(true);
    old.resolve(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(process).toHaveBeenCalledTimes(2);
    expect(onResult).not.toHaveBeenCalled();
    next.resolve(2);
    await vi.advanceTimersByTimeAsync(0);
    expect(onResult).toHaveBeenCalledExactlyOnceWith(2);
    sampler.stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(process).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops after error until explicit start and ignores stale errors", async () => {
    vi.useFakeTimers();
    const old = deferred<number>();
    const onError = vi.fn();
    const process = vi.fn().mockReturnValueOnce(old.promise).mockRejectedValue(new Error("503"));
    const sampler = createFrameSampler({ process, onResult: vi.fn(), onError });
    sampler.start(); sampler.stop();
    old.reject(new Error("late"));
    await vi.advanceTimersByTimeAsync(5000);
    expect(onError).not.toHaveBeenCalled();
    sampler.start();
    await vi.advanceTimersByTimeAsync(5000);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
