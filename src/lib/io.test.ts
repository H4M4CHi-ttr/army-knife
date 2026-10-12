import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { prepareLargeText, LARGE_TEXT_PREVIEW, LARGE_TEXT_THRESHOLD } from "./io";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<{ id: number; ok: boolean; text?: string; code?: string }>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    FakeWorker.instances.push(this);
  }
  finish(value: { id: number; ok: boolean; text?: string; code?: string }) {
    this.onmessage?.({ data: value } as MessageEvent<typeof value>);
  }
}

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
});
afterEach(() => vi.unstubAllGlobals());

describe("large text input transport", () => {
  it("has a strict bounded live-editor preview", () => {
    expect(LARGE_TEXT_THRESHOLD).toBe(128 * 1024);
    expect(LARGE_TEXT_PREVIEW).toBe(2048);
  });

  it("rejects an over-limit pasted string before allocating a Worker", async () => {
    await expect(prepareLargeText("x".repeat(120), 100)).rejects.toThrow("INPUT_TOO_LARGE");
    expect(FakeWorker.instances).toHaveLength(0);
  });

  it("validates clipboard text via a Worker and terminates on success", async () => {
    const job = prepareLargeText("INFO local", 1024);
    const worker = FakeWorker.instances[0]!;
    expect(worker.postMessage).toHaveBeenCalledWith({
      id: 1,
      maxBytes: 1024,
      source: { kind: "text", value: "INFO local" },
    });
    worker.finish({ id: 1, ok: true, text: "INFO local" });
    await expect(job).resolves.toBe("INFO local");
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("does not decode File bytes on the caller thread", async () => {
    const file = new File(["INFO test"], "log.txt");
    const job = prepareLargeText(file, 1_000);
    const worker = FakeWorker.instances[0]!;
    expect(worker.postMessage).toHaveBeenCalledWith({
      id: 1, maxBytes: 1_000, source: { kind: "file", file },
    });
    worker.finish({ id: 1, ok: true, text: "INFO test" });
    await expect(job).resolves.toBe("INFO test");
  });

  it("cancels a pending import and ignores its late worker response", async () => {
    const controller = new AbortController();
    const job = prepareLargeText("private", 1024, controller.signal);
    const worker = FakeWorker.instances[0]!;
    const oldHandler = worker.onmessage!;
    controller.abort();
    oldHandler({ data: { id: 1, ok: true, text: "private" } } as MessageEvent<any>);
    await expect(job).rejects.toThrow("CANCELLED");
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
