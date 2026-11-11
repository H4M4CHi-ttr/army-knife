import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

type TestJob = { id: number; maxBytes: number; preserveBom?: boolean; source: { kind: "file"; file: File } };
const scope = {
  onmessage: null as null | ((event: { data: TestJob }) => Promise<void>),
  postMessage: vi.fn(),
};
beforeEach(async () => {
  scope.postMessage.mockClear(); scope.onmessage = null;
  vi.resetModules(); vi.stubGlobal("self", scope);
  await import("./text-input.worker");
});
afterEach(() => vi.unstubAllGlobals());

describe("actual text input worker file decoding", () => {
  it("keeps existing BOM stripping by default and preserves it only on opt-in", async () => {
    const file = new File(["\ufeffa"], "synthetic.txt");
    await scope.onmessage!({ data: { id: 1, maxBytes: 4, source: { kind: "file", file } } });
    expect(scope.postMessage).toHaveBeenLastCalledWith({ id: 1, ok: true, text: "a" });
    await scope.onmessage!({ data: { id: 2, maxBytes: 4, preserveBom: true, source: { kind: "file", file } } });
    expect(scope.postMessage).toHaveBeenLastCalledWith({ id: 2, ok: true, text: "\ufeffa" });
  });
  it("retains raw byte limits and fatal UTF-8 with BOM preservation enabled", async () => {
    await scope.onmessage!({ data: { id: 1, maxBytes: 3, preserveBom: true, source: { kind: "file", file: new File(["\ufeffa"], "synthetic.txt") } } });
    expect(scope.postMessage).toHaveBeenLastCalledWith({ id: 1, ok: false, code: "INPUT_TOO_LARGE" });
    await scope.onmessage!({ data: { id: 2, maxBytes: 4, preserveBom: true, source: { kind: "file", file: new File([Uint8Array.of(255)], "synthetic.txt") } } });
    expect(scope.postMessage).toHaveBeenLastCalledWith({ id: 2, ok: false, code: "INVALID_UTF8" });
  });
});
