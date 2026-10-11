import { effectScope, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useToolExecution } from "./useToolExecution";

const scopes: ReturnType<typeof effectScope>[] = [];
function setup(options: Parameters<typeof useToolExecution<string>>[0]) {
  const scope = effectScope();
  scopes.push(scope);
  return scope.run(() => useToolExecution<string>(options))!;
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop());
  vi.useRealTimers();
});

describe("tool execution scheduling", () => {
  it("applies lightweight input synchronously, even with delayed auto apply disabled", () => {
    const input = ref("");
    const run = vi.fn(() => input.value.toUpperCase());
    const job = setup({
      source: input,
      canRun: () => !!input.value,
      mode: "instant",
      auto: false,
      execute: run,
    });
    expect(run).not.toHaveBeenCalled();
    input.value = "first";
    expect(job.result.value).toBe("FIRST");
    input.value = "second";
    expect(job.result.value).toBe("SECOND");
    input.value = "";
    expect(job.result.value).toBeNull();
    expect(job.control.value.status).toBe("empty");
  });

  it("debounces the latest complete input and shows the actual remaining time", async () => {
    const input = ref("");
    const run = vi.fn(() => input.value);
    const job = setup({ source: input, canRun: () => !!input.value, auto: true, execute: run });
    input.value = "first";
    expect(job.control.value.remainingMs).toBe(800);
    await vi.advanceTimersByTimeAsync(400);
    expect(job.control.value.remainingMs).toBe(400);
    expect(job.control.value.progress).toBe(0.5);
    input.value = "latest";
    expect(job.control.value.remainingMs).toBe(800);
    await vi.advanceTimersByTimeAsync(799);
    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(job.result.value).toBe("latest");
    expect(job.control.value.status).toBe("applied");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("manual apply cancels the scheduled duplicate", async () => {
    const input = ref("ready");
    const run = vi.fn(() => input.value);
    const job = setup({ source: input, canRun: () => !!input.value, auto: true, execute: run });
    await vi.advanceTimersByTimeAsync(100);
    await job.apply();
    expect(job.result.value).toBe("ready");
    await vi.advanceTimersByTimeAsync(2_000);
    expect(run).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("manual-only mode does not process input and changing auto mode controls the pending schedule", async () => {
    const input = ref("first");
    const auto = ref(false);
    const run = vi.fn(() => input.value);
    const job = setup({ source: input, canRun: () => !!input.value, auto, execute: run });
    await vi.advanceTimersByTimeAsync(2_000);
    expect(run).not.toHaveBeenCalled();
    expect(job.control.value.status).toBe("manual");
    auto.value = true;
    expect(job.control.value.pending).toBe(true);
    auto.value = false;
    await vi.advanceTimersByTimeAsync(2_000);
    expect(run).not.toHaveBeenCalled();
    await job.apply();
    expect(job.result.value).toBe("first");
    auto.value = true;
    expect(job.result.value).toBe("first");
    expect(job.control.value.pending).toBe(false);
  });

  it("immediately clears stale output and aborts superseded work, rejecting out-of-order completion", async () => {
    const input = ref("first");
    const tasks: { signal: AbortSignal; finish: (result: string) => void }[] = [];
    const job = setup({
      source: input,
      canRun: () => !!input.value,
      auto: false,
      execute: (signal) => new Promise((finish) => tasks.push({ signal, finish })),
    });
    const first = job.apply();
    input.value = "second";
    expect(tasks[0]!.signal.aborted).toBe(true);
    const second = job.apply();
    tasks[1]!.finish("SECOND");
    await second;
    expect(job.result.value).toBe("SECOND");
    tasks[0]!.finish("STALE");
    await first;
    expect(job.result.value).toBe("SECOND");
    input.value = "third";
    expect(job.result.value).toBeNull();
  });

  it("cancels both pending and running work without automatically restarting", async () => {
    const input = ref("first");
    let signal: AbortSignal | undefined;
    const run = vi.fn((value: AbortSignal) => {
      signal = value;
      return new Promise<string>(() => {});
    });
    const job = setup({ source: input, canRun: () => !!input.value, auto: true, execute: run });
    job.cancel();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(run).not.toHaveBeenCalled();
    void job.apply();
    expect(job.busy.value).toBe(true);
    job.cancel();
    expect(signal?.aborted).toBe(true);
    expect(job.busy.value).toBe(false);
    expect(job.control.value.status).toBe("cancelled");
    await vi.advanceTimersByTimeAsync(2_000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("disposes every scheduling timer on navigation", async () => {
    const input = ref("private input");
    const run = vi.fn(() => input.value);
    const job = setup({ source: input, canRun: () => !!input.value, auto: true, execute: run });
    scopes.at(-1)!.stop();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(2_000);
    await job.apply();
    expect(run).not.toHaveBeenCalled();
  });

  it("clears errors on edit and reports a typed input failure", () => {
    const input = ref("bad");
    const job = setup({
      source: input,
      canRun: () => !!input.value,
      mode: "instant",
      execute: () => {
        if (input.value === "bad") throw { code: "INVALID_INPUT" };
        return input.value;
      },
    });
    expect(job.error.value).toBe("INVALID_INPUT");
    input.value = "valid";
    expect(job.error.value).toBe("");
    expect(job.result.value).toBe("valid");
  });
});
