import { assertInputSize, ToolError } from "./errors";

export const WEBSOCKET_ACCEPT_LIMITS = { inputBytes: 128, timeoutMs: 5000 } as const;
export const WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
export interface WebSocketAcceptReport {
  key: string;
  nonceHex: string;
  sha1Hex: string;
  expectedAccept: string;
  recordedAccept: string | null;
  matches: boolean | null;
  responseHeader: string;
}

function field(input: string, response: boolean): string {
  assertInputSize(input, WEBSOCKET_ACCEPT_LIMITS.inputBytes);
  const code = response ? "WS_ACCEPT_RESPONSE" : "WS_ACCEPT_KEY";
  for (let index = 0; index < input.length; index++) {
    const character = input.charCodeAt(index);
    if (character !== 9 && (character < 32 || character > 126)) throw new ToolError(code);
  }
  const value = input.replace(/^[ \t]+|[ \t]+$/g, "");
  const syntax = response ? /^[A-Za-z0-9+/]{27}=$/ : /^[A-Za-z0-9+/]{22}==$/;
  if (!syntax.test(value)) throw new ToolError(code);
  // Reject nonzero pad bits rather than silently hashing a repaired key.
  if (btoa(atob(value)) !== value) throw new ToolError(code);
  return value;
}

function aborted(): DOMException { return new DOMException("Operation aborted", "AbortError"); }
function hex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

/** Native digests cannot be interrupted. Abort/timeout stop waiting and discard late results. */
function digest(text: string, api: Crypto, signal?: AbortSignal): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, value?: ArrayBuffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (error) reject(error); else resolve(value!);
    };
    const onAbort = () => finish(aborted());
    const timer = setTimeout(() => finish(new ToolError("WS_ACCEPT_TIMEOUT")), WEBSOCKET_ACCEPT_LIMITS.timeoutMs);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) { onAbort(); return; }
    try {
      api.subtle.digest("SHA-1", new TextEncoder().encode(text)).then(
        value => finish(undefined, value),
        () => finish(new ToolError("WS_ACCEPT_CRYPTO")),
      );
    } catch { finish(new ToolError("WS_ACCEPT_CRYPTO")); }
  });
}

export async function inspectWebSocketAccept(
  input: string, response = "", signal?: AbortSignal,
): Promise<WebSocketAcceptReport> {
  if (signal?.aborted) throw aborted();
  const key = field(input, false);
  const recordedAccept = response === "" ? null : field(response, true);
  const api = globalThis.crypto;
  if (!api?.subtle?.digest) throw new ToolError("WS_ACCEPT_CRYPTO");
  const hash = new Uint8Array(await digest(key + WEBSOCKET_GUID, api, signal));
  const expectedAccept = btoa(String.fromCharCode(...hash));
  return {
    key, nonceHex: hex(Uint8Array.from(atob(key), character => character.charCodeAt(0))),
    sha1Hex: hex(hash), expectedAccept, recordedAccept,
    matches: recordedAccept === null ? null : recordedAccept === expectedAccept,
    responseHeader: `Sec-WebSocket-Accept: ${expectedAccept}`,
  };
}
