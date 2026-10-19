import { ToolError } from "./errors";

export type PkceRequest =
  | { mode: "generate"; verifierLength: number; stateLength: number }
  | { mode: "derive"; verifier: string };
export interface PkceResult {
  verifier: string;
  challenge: string;
  method: "S256";
  state: string | null;
}
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function boundedInteger(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}
function abortError(): DOMException {
  return new DOMException("Operation aborted", "AbortError");
}
function randomString(length: number, api: Crypto): string {
  const bytes = new Uint8Array(length);
  try {
    api.getRandomValues(bytes);
    // 64 divides 256: each character has exactly four equally likely byte values.
    return Array.from(bytes, (byte) => ALPHABET[byte & 63]).join("");
  } catch {
    throw new ToolError("PKCE_CRYPTO");
  } finally {
    bytes.fill(0);
  }
}

/** Web Crypto cannot abort a digest; stop waiting and never publish its late result. */
function digest(verifier: string, api: Crypto, signal?: AbortSignal): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, value?: ArrayBuffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
      if (error) reject(error);
      else resolve(value!);
    };
    const onAbort = () => finish(abortError());
    const timeout = setTimeout(() => finish(new ToolError("PKCE_TIMEOUT")), 5000);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) { onAbort(); return; }
    try {
      api.subtle.digest("SHA-256", new TextEncoder().encode(verifier)).then(
        (value) => finish(undefined, value),
        () => finish(new ToolError("PKCE_CRYPTO")),
      );
    } catch {
      finish(new ToolError("PKCE_CRYPTO"));
    }
  });
}

export async function createPkce(request: PkceRequest, signal?: AbortSignal): Promise<PkceResult> {
  if (signal?.aborted) throw abortError();
  if (request.mode === "generate") {
    if (!boundedInteger(request.verifierLength, 43, 128)) throw new ToolError("PKCE_LENGTH");
    if (request.stateLength !== 0 && !boundedInteger(request.stateLength, 16, 128))
      throw new ToolError("PKCE_STATE_LENGTH");
  } else if (request.verifier.length < 43 || request.verifier.length > 128 ||
    !/^[A-Za-z0-9._~-]+$/.test(request.verifier)) {
    throw new ToolError("PKCE_VERIFIER");
  }
  const api = globalThis.crypto;
  if (!api?.subtle?.digest) throw new ToolError("PKCE_CRYPTO");
  const verifier = request.mode === "generate" ? randomString(request.verifierLength, api) : request.verifier;
  const state = request.mode === "generate" && request.stateLength ? randomString(request.stateLength, api) : null;
  const hash = new Uint8Array(await digest(verifier, api, signal));
  const challenge = btoa(String.fromCharCode(...hash)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge, method: "S256", state };
}
