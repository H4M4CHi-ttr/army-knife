import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { inspectWebSocketAccept } from "./websocket-accept";

const key = "dGhlIHNhbXBsZSBub25jZQ==";
const accept = "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=";
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("recorded WebSocket Accept", () => {
  it("matches RFC 6455 by hashing the encoded key with the protocol GUID", async () => {
    expect(await inspectWebSocketAccept(key, accept)).toEqual({
      key, nonceHex: "7468652073616d706c65206e6f6e6365",
      sha1Hex: "b37a4f2cc0624f1690f64606cf385945b2bec4ea",
      expectedAccept: accept, recordedAccept: accept, matches: true,
      responseHeader: "Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=",
    });
  });
  it("distinguishes omitted comparison from a well-formed mismatch", async () => {
    expect(await inspectWebSocketAccept(key)).toMatchObject({ recordedAccept: null, matches: null });
    expect(await inspectWebSocketAccept(key, "AAAAAAAAAAAAAAAAAAAAAAAAAAA=")).toMatchObject({
      expectedAccept: accept, recordedAccept: "AAAAAAAAAAAAAAAAAAAAAAAAAAA=", matches: false,
    });
    expect(await inspectWebSocketAccept(key, "S3pPLMBiTxaQ9kYGzzhZRbK+xOo=")).toMatchObject({ matches: false });
  });
  it("hashes different binary nonces through their encoded ASCII representation", async () => {
    for (let value = 0; value < 256; value += 17) {
      const nonce = Buffer.alloc(16, value), encoded = nonce.toString("base64");
      const hash = createHash("sha1").update(encoded + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", "ascii");
      const result = await inspectWebSocketAccept(encoded);
      expect(result.nonceHex).toBe(nonce.toString("hex"));
      expect(result.expectedAccept).toBe(hash.digest("base64"));
      expect(result.sha1Hex).toHaveLength(40);
    }
  });
  it("accepts only outer SP/HTAB and counts them in each raw 128-byte cap", async () => {
    expect(await inspectWebSocketAccept(" \t" + key + "\t ", "\t" + accept + " ")).toMatchObject({ key, recordedAccept: accept, matches: true });
    expect(await inspectWebSocketAccept(key + " ".repeat(104), accept + "\t".repeat(100))).toMatchObject({ matches: true });
    await expect(inspectWebSocketAccept(key + " ".repeat(105))).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
    await expect(inspectWebSocketAccept(key, accept + " ".repeat(101))).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
    await expect(inspectWebSocketAccept("é".repeat(65))).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
    await expect(inspectWebSocketAccept(key, "é".repeat(65))).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
  });
  it.each(["", " ", key.slice(0, -1), key + "=", "AAAAAAAAAAAAAAAAAAAAAA=", "AAAAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAAAAAAAAA=",
    "dGhlIHNhbXBsZSBub25jZR==", "_wAAAAAAAAAAAAAAAAAAAA==", "-wAAAAAAAAAAAAAAAAAAAA==",
    key.slice(0, 4) + " " + key.slice(4), "Sec-WebSocket-Key: " + key, key + "," + key,
    key + "\n", "\r" + key, "\v" + key, "\f" + key, "\0" + key, "\u00a0" + key, "\ufeff" + key,
    key + "\u200b", "\ud800", "<img src=PRIVATE_WS_KEY>"])("rejects invalid key %j without echoing it", async (input) => {
    await expect(inspectWebSocketAccept(input)).rejects.toMatchObject({ code: "WS_ACCEPT_KEY", message: "WS_ACCEPT_KEY" });
  });
  it.each([" ", "\t", accept.slice(0, -1), accept + "=", "AAAA", key,
    "s3pPLMBiTxaQ9kYGzzhZRbK+xOp=", "s3pPLMBiTxaQ9kYGzzhZRbK-xOo=", "s3pPLMBiTxaQ9kYGzzhZRbK_xOo=",
    "Sec-WebSocket-Accept: " + accept, accept + "," + accept,
    "\n" + accept, accept + "\r\n", "\u00a0" + accept, "\ufeff" + accept, "<script>PRIVATE_WS_ACCEPT</script>"])(
    "rejects an invalid supplied Accept atomically %j", async (input) => {
      await expect(inspectWebSocketAccept(key, input)).rejects.toMatchObject({ code: "WS_ACCEPT_RESPONSE", message: "WS_ACCEPT_RESPONSE" });
    },
  );
  it("fails explicitly when native cryptography is unavailable", async () => {
    vi.stubGlobal("crypto", undefined);
    await expect(inspectWebSocketAccept(key)).rejects.toMatchObject({ code: "WS_ACCEPT_CRYPTO" });
  });
  it.each([false, true])("sanitizes synchronous and asynchronous crypto errors (%s)", async (synchronous) => {
    vi.stubGlobal("crypto", { subtle: { digest: () => {
      if (synchronous) throw new Error(key);
      return Promise.reject(new Error(key));
    } } });
    await expect(inspectWebSocketAccept(key)).rejects.toMatchObject({ code: "WS_ACCEPT_CRYPTO", message: "WS_ACCEPT_CRYPTO" });
  });
  it("honors an already aborted request", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(inspectWebSocketAccept(key, "", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
  it("cancels waiting, clears the watchdog and ignores late success or rejection", async () => {
    vi.useFakeTimers();
    for (const lateReject of [false, true]) {
      let resolve!: (value: ArrayBuffer) => void, reject!: (reason: Error) => void;
      vi.stubGlobal("crypto", { subtle: { digest: () => new Promise<ArrayBuffer>((yes, no) => { resolve = yes; reject = no; }) } });
      const controller = new AbortController(), pending = inspectWebSocketAccept(key, "", controller.signal);
      controller.abort();
      await expect(pending).rejects.toMatchObject({ name: "AbortError" });
      expect(vi.getTimerCount()).toBe(0);
      if (lateReject) reject(new Error(key)); else resolve(new ArrayBuffer(20));
      await Promise.resolve();
    }
  });
  it("stops waiting at five seconds and cleans up after late completion", async () => {
    vi.useFakeTimers(); let finish!: (value: ArrayBuffer) => void;
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise<ArrayBuffer>((resolve) => { finish = resolve; }) } });
    const pending = inspectWebSocketAccept(key);
    const rejected = expect(pending).rejects.toMatchObject({ code: "WS_ACCEPT_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(4999); expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1); await rejected;
    expect(vi.getTimerCount()).toBe(0); finish(new ArrayBuffer(20));
  });
  it("removes the watchdog after a successful digest", async () => {
    vi.useFakeTimers(); await inspectWebSocketAccept(key, accept);
    expect(vi.getTimerCount()).toBe(0);
  });
});
