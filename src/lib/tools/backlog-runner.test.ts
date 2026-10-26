import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { inspectBacklog, inspectBacklogWorker, type BacklogRequest } from "./backlog-runner";
import type { BacklogReport } from "./backlog-core";

type Reply = { ok: boolean; result?: BacklogReport; code?: string };
class WorkerHarness {
  static created: WorkerHarness[] = [];
  onmessage: ((event: MessageEvent<Reply>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { WorkerHarness.created.push(this); }
}
const request: BacklogRequest = { kind: "ndjson", input: '{"id":1}', options: {} };
beforeEach(() => { vi.useFakeTimers(); WorkerHarness.created = []; vi.stubGlobal("Worker", WorkerHarness); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("inspector Worker lifecycle (native Worker results covered by browser tests)", () => {
  it("avoids starting an already cancelled job", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(inspectBacklogWorker(request, controller.signal)).rejects.toMatchObject({ code: "CANCELLED" });
    expect(WorkerHarness.created).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("terminates on cancellation and ignores an already queued late reply", async () => {
    const controller = new AbortController();
    const task = inspectBacklogWorker(request, controller.signal);
    const rejected = expect(task).rejects.toMatchObject({ code: "CANCELLED" });
    const worker = WorkerHarness.created[0]!;
    const reply = worker.onmessage!;
    controller.abort();
    reply({ data: { ok: true, result: inspectBacklog(request) } } as MessageEvent<Reply>);
    await rejected;
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.onmessage).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("terminates and clears its watchdog after a successful result", async () => {
    const controller = new AbortController();
    const task = inspectBacklogWorker(request, controller.signal);
    const worker = WorkerHarness.created[0]!;
    expect(worker.postMessage).toHaveBeenCalledWith(request);
    const result = inspectBacklog(request);
    worker.onmessage!({ data: { ok: true, result } } as MessageEvent<Reply>);
    await expect(task).resolves.toEqual(result);
    controller.abort();
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("terminates an unresponsive job at five seconds", async () => {
    const task = inspectBacklogWorker(request, new AbortController().signal);
    const rejected = expect(task).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(5000);
    await rejected;
    expect(WorkerHarness.created[0]!.terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("surfaces worker failures without running a blocking fallback", async () => {
    const task = inspectBacklogWorker(request, new AbortController().signal);
    const rejected = expect(task).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    WorkerHarness.created[0]!.onmessage!({ data: { ok: false, code: "INVALID_REQUEST" } } as MessageEvent<Reply>);
    await rejected;
    expect(WorkerHarness.created[0]!.terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
