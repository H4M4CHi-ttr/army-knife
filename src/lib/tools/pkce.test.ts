import { webcrypto, createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createPkce } from "./pkce";

const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("PKCE S256", () => {
  it("matches RFC 7636 Appendix B with no padding", async () => {
    expect(await createPkce({ mode: "derive", verifier })).toEqual({ verifier, challenge, method: "S256", state: null });
  });
  it.each([43, 128])("hashes all unreserved characters exactly at length %i", async (length) => {
    const input = "aB9-._~".repeat(20).slice(0, length);
    const result = await createPkce({ mode: "derive", verifier: input });
    expect(result.challenge).toBe(createHash("sha256").update(input, "ascii").digest("base64url"));
    expect(result.verifier).toBe(input);
    expect(result.challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
  it.each(["", "a".repeat(42), "a".repeat(129), "a".repeat(100000), verifier + " ", "\n" + verifier,
    verifier.slice(1) + "é", verifier.slice(1) + "=", verifier.slice(1) + "/", verifier.slice(1) + "\ud800"])(
    "rejects invalid verifier input without echoing it", async (input) => {
      await expect(createPkce({ mode: "derive", verifier: input })).rejects.toMatchObject({ code: "PKCE_VERIFIER", message: "PKCE_VERIFIER" });
    },
  );
  it.each([[43, 0], [43, 16], [128, 128], [64, 32]])("generates bounded independent random strings (%i/%i)", async (verifierLength, stateLength) => {
    const first = await createPkce({ mode: "generate", verifierLength, stateLength });
    const second = await createPkce({ mode: "generate", verifierLength, stateLength });
    expect(first.verifier).toHaveLength(verifierLength);
    expect(first.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first.challenge).toBe(createHash("sha256").update(first.verifier, "ascii").digest("base64url"));
    expect(first.verifier).not.toBe(second.verifier);
    if (stateLength) {
      expect(first.state).toHaveLength(stateLength);
      expect(first.state).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(first.state).not.toBe(second.state);
      expect(first.state).not.toBe(first.verifier);
    } else expect(first.state).toBeNull();
  });
  it.each([0, 42, 129, 43.5, NaN, Infinity, "43"])("rejects malformed verifier length %s", async (value) => {
    await expect(createPkce({ mode: "generate", verifierLength: value as number, stateLength: 32 })).rejects.toMatchObject({ code: "PKCE_LENGTH" });
  });
  it.each([-1, 1, 15, 129, 16.5, NaN, Infinity, "32"])("rejects malformed state length %s", async (value) => {
    await expect(createPkce({ mode: "generate", verifierLength: 43, stateLength: value as number })).rejects.toMatchObject({ code: "PKCE_STATE_LENGTH" });
  });
  it("fails closed without Web Crypto", async () => {
    vi.stubGlobal("crypto", undefined);
    await expect(createPkce({ mode: "generate", verifierLength: 43, stateLength: 32 })).rejects.toMatchObject({ code: "PKCE_CRYPTO" });
  });
  it("sanitizes crypto failures without revealing the verifier", async () => {
    vi.stubGlobal("crypto", { subtle: { digest: () => Promise.reject(new Error(verifier)) } });
    await expect(createPkce({ mode: "derive", verifier })).rejects.toMatchObject({ code: "PKCE_CRYPTO", message: "PKCE_CRYPTO" });
  });
  it("rejects an already aborted request", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(createPkce({ mode: "derive", verifier }, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
  it("cancels an in-flight digest and ignores its late result", async () => {
    let finish!: (value: ArrayBuffer) => void;
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise<ArrayBuffer>((resolve) => { finish = resolve; }) } });
    const controller = new AbortController();
    const pending = createPkce({ mode: "derive", verifier }, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    finish(new ArrayBuffer(32));
  });
  it("stops waiting after exactly five seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise(() => {}) } });
    const pending = createPkce({ mode: "derive", verifier });
    const rejected = expect(pending).rejects.toMatchObject({ code: "PKCE_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(5000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
});
