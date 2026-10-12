import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { EngineError, runEngine } from "./client";
import { ENGINE_LIMITS } from "./types";
import type { CsvRequest, CsvResult, EngineEnvelope, WorkerRequest, WorkerResponse } from "./types";

const csvRequest: CsvRequest = {
  operation: "csv",
  text: "id\n1",
  delimiter: ",",
  header: true,
  trim: false,
};
const csvResult: CsvResult = {
  operation: "csv",
  rows: 1,
  columns: 1,
  raggedRows: 0,
  duplicateHeaders: [],
  profiles: [],
  preview: [["1"]],
  truncatedPreview: false,
};

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn<(request: WorkerRequest) => void>();
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  deliver(response: EngineEnvelope) {
    this.onmessage?.({ data: { id: 1, response } } as MessageEvent<WorkerResponse>);
  }
}

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("WASM worker ownership and cancellation", () => {
  it("returns results and releases worker memory on success", async () => {
    const promise = runEngine(csvRequest);
    const worker = FakeWorker.instances[0]!;
    expect(worker.postMessage).toHaveBeenCalledWith({ id: 1, request: csvRequest });
    worker.deliver({ ok: true, result: csvResult });
    await expect(promise).resolves.toEqual(csvResult);
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.onmessage).toBeNull();
  });

  it("propagates stable Rust errors and terminates the worker", async () => {
    const promise = runEngine(csvRequest);
    const worker = FakeWorker.instances[0]!;
    worker.deliver({ ok: false, error: { code: "INVALID_CSV", message: "Unclosed quote." } });
    await expect(promise).rejects.toMatchObject({
      code: "INVALID_CSV",
      message: "Unclosed quote.",
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("rejects a pre-aborted job before creating any worker", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(runEngine(csvRequest, { signal: controller.signal })).rejects.toMatchObject({
      code: "CANCELLED",
    });
    expect(FakeWorker.instances).toHaveLength(0);
  });

  it("cancels in-flight WASM by terminating its worker", async () => {
    const controller = new AbortController();
    const promise = runEngine(csvRequest, { signal: controller.signal });
    const worker = FakeWorker.instances[0]!;
    const oldHandler = worker.onmessage!;
    controller.abort();
    // A late event queued before termination must never resolve a cancelled job.
    oldHandler({
      data: { id: 1, response: { ok: true, result: csvResult } },
    } as MessageEvent<WorkerResponse>);
    await expect(promise).rejects.toMatchObject({ code: "CANCELLED" });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("stops a worker that never responds at the deadline", async () => {
    vi.useFakeTimers();
    const promise = runEngine(csvRequest, { timeoutMs: 50 });
    const rejection = expect(promise).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(51);
    await rejection;
    expect(FakeWorker.instances[0]!.terminate).toHaveBeenCalledOnce();
  });

  it("keeps separate requests isolated when one is cancelled", async () => {
    const controller = new AbortController();
    const first = runEngine(csvRequest, { signal: controller.signal });
    const second = runEngine(csvRequest);
    controller.abort();
    FakeWorker.instances[1]!.deliver({ ok: true, result: csvResult });
    await expect(first).rejects.toBeInstanceOf(EngineError);
    await expect(second).resolves.toEqual(csvResult);
    expect(FakeWorker.instances[0]!.terminate).toHaveBeenCalledOnce();
    expect(FakeWorker.instances[1]!.terminate).toHaveBeenCalledOnce();
  });

  it("rejects unavailable workers without a heavy main-thread fallback", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        constructor() {
          throw new Error("Not supported");
        }
      },
    );
    await expect(runEngine(csvRequest)).rejects.toMatchObject({ code: "WASM_UNAVAILABLE" });
  });

  it("defers full Unicode UTF-8 sizing to the worker instead of blocking the UI", async () => {
    const text = "あ".repeat(Math.floor(ENGINE_LIMITS.inputBytes / 3) + 1);
    const promise = runEngine({ ...csvRequest, text });
    const worker = FakeWorker.instances[0]!;
    expect(worker).toBeDefined();
    worker.deliver({
      ok: false,
      error: { code: "INPUT_TOO_LARGE", message: "INPUT_TOO_LARGE" },
    });
    await expect(promise).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("applies the same combined size limit to both set inputs", async () => {
    await expect(
      runEngine({
        operation: "sets",
        left: "a".repeat(ENGINE_LIMITS.inputBytes),
        right: "b",
        mode: "union",
        trim: false,
        caseInsensitive: false,
        ignoreEmpty: false,
      }),
    ).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
    expect(FakeWorker.instances).toHaveLength(0);
  });

  it("defers multibyte regex limits to the worker", async () => {
    const promise = runEngine({
      operation: "logs",
      text: "log",
      pattern: "あ".repeat(1_366),
      caseInsensitive: false,
    });
    const worker = FakeWorker.instances[0]!;
    worker.deliver({
      ok: false,
      error: { code: "REGEX_TOO_LARGE", message: "REGEX_TOO_LARGE" },
    });
    await expect(promise).rejects.toMatchObject({ code: "REGEX_TOO_LARGE" });
  });
});
