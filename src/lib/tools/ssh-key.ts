import { assertInputSize, ToolError } from "./errors";

export const SSH_KEY_LIMITS = Object.freeze({
  inputBytes: 16 * 1024, referenceBytes: 128, blobBytes: 4096,
  commentBytes: 4096, exponentBytes: 256, outputBytes: 32 * 1024,
  deferredCharacters: 2048, timeoutMs: 5000,
});
export { SSH_KEY_SAMPLE, SSH_KEY_SAMPLE_FINGERPRINT } from "./ssh-key-sample";
const types = [
  "ssh-ed25519", "ssh-rsa",
  "ecdsa-sha2-nistp256", "ecdsa-sha2-nistp384", "ecdsa-sha2-nistp521",
] as const;
export type SshKeyType = typeof types[number];
export interface SshKeyReport {
  type: SshKeyType;
  keyBits: number;
  blobBytes: number;
  exponent: string | null;
  curve: string | null;
  comment: string;
  fingerprint: string;
  expectedFingerprint: string | null;
  matches: boolean | null;
}
const curves: Record<string, { width: number; bits: number }> = {
  nistp256: { width: 32, bits: 256 }, nistp384: { width: 48, bits: 384 },
  nistp521: { width: 66, bits: 521 },
};
function text(value: string): void {
  if (value.startsWith("\ufeff") || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(value))
    throw new ToolError("SSH_TEXT");
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new ToolError("SSH_TEXT");
    } else if (c >= 0xdc00 && c <= 0xdfff) throw new ToolError("SSH_TEXT");
  }
}
function binary(bytes: Uint8Array): string {
  // All callers are bounded to <=4KiB; no unbounded spread/argument list.
  return String.fromCharCode(...bytes);
}
function base64(value: string, maxBytes: number, code: string): Uint8Array {
  if (value.length > 4 * Math.ceil(maxBytes / 3)) throw new ToolError("SSH_LIMIT");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 === 1 ||
    (value.includes("=") && value.length % 4 !== 0)) throw new ToolError(code);
  let decoded: string;
  try { decoded = atob(value + "=".repeat((4 - value.length % 4) % 4)); }
  catch { throw new ToolError(code); }
  if (decoded.length > maxBytes) throw new ToolError("SSH_LIMIT");
  const canonical = btoa(decoded);
  if (value.includes("=") ? value !== canonical : value !== canonical.replace(/=+$/, ""))
    throw new ToolError(code);
  return Uint8Array.from(decoded, c => c.charCodeAt(0));
}
class Reader {
  private offset = 0;
  private readonly view: DataView;
  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  string(): Uint8Array {
    if (this.bytes.length - this.offset < 4) throw new ToolError("SSH_STRUCTURE");
    const length = this.view.getUint32(this.offset, false);
    this.offset += 4;
    if (length > this.bytes.length - this.offset) throw new ToolError("SSH_STRUCTURE");
    const value = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }
  end(): void {
    if (this.offset !== this.bytes.length) throw new ToolError("SSH_STRUCTURE");
  }
}
function positive(value: Uint8Array, maxBytes: number): Uint8Array {
  if (!value.length || value[0]! >= 128) throw new ToolError("SSH_RSA");
  if (value[0] === 0) {
    if (value.length < 2 || value[1]! < 128) throw new ToolError("SSH_RSA");
    value = value.subarray(1);
  }
  if (value.length > maxBytes) throw new ToolError("SSH_LIMIT");
  return value;
}
function reference(value: string): string | null {
  const trimmed = value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
  if (!trimmed) return null;
  if (!/^SHA256:[A-Za-z0-9+/]{43}$/.test(trimmed)) throw new ToolError("SSH_FINGERPRINT");
  base64(trimmed.slice(7), 32, "SSH_FINGERPRINT");
  return trimmed;
}
function parse(input: string): { blob: Uint8Array; report: SshKeyReport } {
  const line = input.endsWith("\r\n") ? input.slice(0, -2) : input.endsWith("\n") ? input.slice(0, -1) : input;
  if (/[\r\n]/.test(line)) throw new ToolError("SSH_FORMAT");
  const match = /^[ \t]*([^ \t]+)[ \t]+([^ \t]+)(?:[ \t]+([\s\S]*))?$/.exec(line);
  if (!match) throw new ToolError("SSH_FORMAT");
  const type = types.find(type => type === match[1]);
  if (!type) throw new ToolError("SSH_TYPE");
  const comment = match[3] ?? "";
  if (comment.length > SSH_KEY_LIMITS.commentBytes ||
    new TextEncoder().encode(comment).byteLength > SSH_KEY_LIMITS.commentBytes) throw new ToolError("SSH_LIMIT");
  const blob = base64(match[2]!, SSH_KEY_LIMITS.blobBytes, "SSH_BASE64");
  const reader = new Reader(blob);
  if (binary(reader.string()) !== type) throw new ToolError("SSH_STRUCTURE");
  const report: SshKeyReport = { type, keyBits: 0, blobBytes: blob.length,
    exponent: null, curve: null, comment, fingerprint: "", expectedFingerprint: null, matches: null };
  if (type === "ssh-ed25519") {
    if (reader.string().length !== 32) throw new ToolError("SSH_STRUCTURE");
    report.keyBits = 256;
  } else if (type === "ssh-rsa") {
    const e = positive(reader.string(), SSH_KEY_LIMITS.exponentBytes);
    const n = positive(reader.string(), SSH_KEY_LIMITS.blobBytes);
    let exponent = 0n;
    for (const byte of e) exponent = (exponent << 8n) | BigInt(byte);
    report.exponent = exponent.toString();
    report.keyBits = (n.length - 1) * 8 + 32 - Math.clz32(n[0]!);
  } else {
    const curve = type.slice("ecdsa-sha2-".length);
    if (binary(reader.string()) !== curve) throw new ToolError("SSH_EC");
    const { width, bits } = curves[curve]!;
    const point = reader.string();
    if (point.length !== 1 + 2 * width || point[0] !== 4 ||
      (bits === 521 && (point[1]! > 1 || point[1 + width]! > 1))) throw new ToolError("SSH_EC");
    report.curve = curve; report.keyBits = bits;
  }
  reader.end();
  return { blob, report };
}
function aborted(): DOMException { return new DOMException("Operation aborted", "AbortError"); }
/** Native digest cannot be interrupted; abort/deadline stop waiting and publication. */
function digest(blob: Uint8Array, api: Crypto, signal?: AbortSignal): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, value?: ArrayBuffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      if (error) reject(error); else resolve(value!);
    };
    const abort = () => finish(aborted());
    const timeout = setTimeout(() => finish(new ToolError("SSH_TIMEOUT")), SSH_KEY_LIMITS.timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    try {
      api.subtle.digest("SHA-256", new Uint8Array(blob)).then(
        value => finish(undefined, value),
        () => finish(new ToolError("SSH_CRYPTO")),
      );
    } catch { finish(new ToolError("SSH_CRYPTO")); }
  });
}
export async function inspectSshKey(input: string, expected = "", signal?: AbortSignal): Promise<SshKeyReport> {
  if (signal?.aborted) throw aborted();
  assertInputSize(input, SSH_KEY_LIMITS.inputBytes);
  assertInputSize(expected, SSH_KEY_LIMITS.referenceBytes);
  text(input); text(expected);
  const { blob, report } = parse(input);
  report.expectedFingerprint = reference(expected);
  const api = globalThis.crypto;
  if (!api?.subtle?.digest) throw new ToolError("SSH_CRYPTO");
  const bytes = await digest(blob, api, signal);
  if (signal?.aborted) throw aborted();
  if (bytes.byteLength !== 32) throw new ToolError("SSH_CRYPTO");
  report.fingerprint = "SHA256:" + btoa(binary(new Uint8Array(bytes))).replace(/=+$/, "");
  report.matches = report.expectedFingerprint === null ? null : report.expectedFingerprint === report.fingerprint;
  if (new TextEncoder().encode(JSON.stringify(report, null, 2)).byteLength > SSH_KEY_LIMITS.outputBytes)
    throw new ToolError("SSH_OUTPUT_LIMIT");
  return report;
}
