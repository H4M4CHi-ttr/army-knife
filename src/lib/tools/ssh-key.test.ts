import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { inspectSshKey } from "./ssh-key";

// Public RFC8037 A.2 material. SHA-256 is independently pinned with Python
// hashlib and read-only ssh-keygen -lf; no private key/generation is involved.
const ed = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1Ea army-knife-public-test-vector";
const fingerprint = "SHA256:bbXpuKG6zhzdmnxq256TlqzFBzRl2f6OOg722cYNbU8";
const edBody = ed.split(" ")[1]!;
const edOnly = "ssh-ed25519 " + edBody;
const edBytes = Buffer.from(edBody, "base64");
// Test-only standard wire encoder; expected fingerprints use independent Node
// crypto, never a parser/encoder/hash helper from the implementation under test.
function field(value: string | number[] | Uint8Array): Buffer {
  const bytes = typeof value === "string" ? Buffer.from(value) : Buffer.from(value);
  const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length);
  return Buffer.concat([length, bytes]);
}
function key(type: string, ...values: (string | number[] | Uint8Array)[]) {
  const blob = Buffer.concat([field(type), ...values.map(field)]);
  return { blob, input: type + " " + blob.toString("base64") };
}
const hash = (blob: Uint8Array) => "SHA256:" + createHash("sha256").update(blob).digest("base64").replace(/=+$/, "");
const rsa = (exponent: number[] = [1, 0, 1], modulus: number[] = [0, 128, ...Array<number>(254).fill(0), 1]) =>
  key("ssh-rsa", exponent, modulus);
const curveCases = [
  ["nistp256", 32, 256], ["nistp384", 48, 384], ["nistp521", 66, 521],
] as const;
const ec = (curve = "nistp256", width = 32, point?: number[]) =>
  key("ecdsa-sha2-" + curve, curve, point ?? [4, ...Array<number>(width * 2).fill(0)]);
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("SSH public-key structure and SHA-256 fingerprint", () => {
  it("hashes the public wire blob rather than text or comment", async () => {
    expect(await inspectSshKey(ed)).toEqual({
      type: "ssh-ed25519", keyBits: 256, blobBytes: 51, exponent: null,
      curve: null, comment: "army-knife-public-test-vector",
      fingerprint, expectedFingerprint: null, matches: null,
    });
  });
  it("compares an optional canonical reference and distinguishes omitted from mismatch", async () => {
    expect(await inspectSshKey(ed, " \t" + fingerprint + "\r\n")).toMatchObject({ expectedFingerprint: fingerprint, matches: true });
    expect(await inspectSshKey(ed, "SHA256:" + "A".repeat(43))).toMatchObject({ matches: false });
    expect(await inspectSshKey(ed, " \r\n\t")).toMatchObject({ expectedFingerprint: null, matches: null });
  });
  it("excludes line ending/separator/comment text from the digest while preserving the comment", async () => {
    const comment = 'hello \t世界 <img src="https://example.invalid/PRIVATE_SSH_COMMENT"> \u202e  ';
    const r = await inspectSshKey(" \t" + edOnly + "\t  " + comment + "\r\n");
    expect(r.comment).toBe(comment);
    expect(r.fingerprint).toBe(fingerprint);
    expect((await inspectSshKey(edOnly + "\n")).fingerprint).toBe(fingerprint);
    expect((await inspectSshKey(edOnly + "   ")).comment).toBe("");
  });
  it("reads RSA signed mpints and preserves an exponent above Number precision", async () => {
    const fixture = rsa([0x20, 0, 0, 0, 0, 0, 1]);
    const r = await inspectSshKey(fixture.input);
    expect(r).toMatchObject({ type: "ssh-rsa", keyBits: 2048, exponent: "9007199254740993", curve: null, fingerprint: hash(fixture.blob) });
    expect(r.blobBytes).toBe(fixture.blob.length);
    expect((await inspectSshKey(rsa([0, 128], [127]).input))).toMatchObject({ exponent: "128", keyBits: 7 });
  });
  it.each(curveCases)("inspects %s uncompressed shape without claiming curve membership", async (curve, width, bits) => {
    // The all-zero coordinates are deliberately not a valid curve point.
    const fixture = ec(curve, width);
    expect(await inspectSshKey(fixture.input)).toMatchObject({
      type: "ecdsa-sha2-" + curve, curve, keyBits: bits, exponent: null,
      fingerprint: hash(fixture.blob),
    });
  });
  it("accepts canonical padded/unpadded Base64 with identical decoded bytes", async () => {
    const fixture = ec();
    expect(fixture.input.endsWith("=")).toBe(true);
    expect((await inspectSshKey(fixture.input.replace(/=+$/, ""))).fingerprint).toBe(hash(fixture.blob));
    expect((await inspectSshKey(fixture.input)).fingerprint).toBe(hash(fixture.blob));
  });
  it.each(["", "ssh-ed25519", ed + "\n\n", "\n" + ed, ed + "\r", ed + "\nsecond",
    "-----BEGIN OPENSSH PRIVATE KEY-----\nPRIVATE\n-----END OPENSSH PRIVATE KEY-----"])(
    "rejects a missing or multiple-line public-key record %#", async value => {
      await expect(inspectSshKey(value)).rejects.toMatchObject({ code: "SSH_FORMAT" });
    });
  it.each(["ssh-dss", "ssh-ed448", "sk-ssh-ed25519@openssh.com", "ssh-ed25519-cert-v01@openssh.com",
    "example.invalid", 'command="echo', "SSH-ED25519"])("does not guess the unsupported outer type %s", async type => {
      await expect(inspectSshKey(type + " " + edBody)).rejects.toMatchObject({ code: "SSH_TYPE" });
    });
  it.each(["A", "AA===", "!!!!", "____", "AAAA=", "AB==", "AB"])("rejects malformed or noncanonical Base64 %s", async body => {
    await expect(inspectSshKey("ssh-ed25519 " + body)).rejects.toMatchObject({ code: "SSH_BASE64" });
  });
  it("rejects unused Base64 bits even when forgiving decoders produce the same bytes", async () => {
    const body = ec().input.split(" ")[1]!;
    const changed = body.slice(0, -2) + "B=";
    expect(Buffer.from(changed, "base64")).toEqual(Buffer.from(body, "base64"));
    await expect(inspectSshKey("ecdsa-sha2-nistp256 " + changed)).rejects.toMatchObject({ code: "SSH_BASE64" });
  });
  it.each([
    Buffer.from([255, 255, 255, 255]),
    edBytes.subarray(0, -1),
    Buffer.concat([edBytes, Buffer.from([0])]),
    Buffer.concat([field("ssh-ed25519")]),
    Buffer.concat([field("ssh-ed25519"), field(Array<number>(31).fill(0))]),
    Buffer.concat([field("ssh-ed25519"), field(Array<number>(33).fill(0))]),
    Buffer.concat([field("ssh-ed25519\0"), field(Array<number>(32).fill(0))]),
  ])("rejects overflow/truncated/trailing SSH fields %#", async blob => {
    await expect(inspectSshKey("ssh-ed25519 " + blob.toString("base64"))).rejects.toMatchObject({ code: "SSH_STRUCTURE" });
  });
  it("requires the embedded type and ECDSA curve to agree with the line", async () => {
    await expect(inspectSshKey("ssh-rsa " + edBody)).rejects.toMatchObject({ code: "SSH_STRUCTURE" });
    const wrong = key("ecdsa-sha2-nistp256", "nistp384", [4, ...Array<number>(64).fill(0)]);
    await expect(inspectSshKey(wrong.input)).rejects.toMatchObject({ code: "SSH_EC" });
  });
  it.each([[], [0], [0x80], [0, 1], [0, 0, 0x80]].map(value => ({ value })))("rejects nonpositive/nonminimal RSA exponent %#", async ({ value }) => {
    await expect(inspectSshKey(rsa(value).input)).rejects.toMatchObject({ code: "SSH_RSA" });
  });
  it.each([[], [0], [0x80], [0, 1]].map(value => ({ value })))("rejects nonpositive/nonminimal RSA modulus %#", async ({ value }) => {
    await expect(inspectSshKey(rsa([1, 0, 1], value).input)).rejects.toMatchObject({ code: "SSH_RSA" });
  });
  it("bounds RSA exponent magnitude before decimal conversion", async () => {
    const r = await inspectSshKey(rsa([1, ...Array<number>(255).fill(0)], [127]).input);
    expect(r.exponent).toBe((1n << 2040n).toString());
    await expect(inspectSshKey(rsa([1, ...Array<number>(256).fill(0)], [127]).input)).rejects.toMatchObject({ code: "SSH_LIMIT" });
  });
  it.each([[2, ...Array<number>(64).fill(0)], [4, ...Array<number>(63).fill(0)], [4, ...Array<number>(65).fill(0)]].map(point => ({ point })))(
    "refuses compressed/wrong-width EC points %#", async ({ point }) => {
      await expect(inspectSshKey(ec("nistp256", 32, point).input)).rejects.toMatchObject({ code: "SSH_EC" });
    });
  it("checks both P-521 coordinate high bits", async () => {
    const point = [4, ...Array<number>(132).fill(0)]; point[1] = 1; point[67] = 1;
    expect((await inspectSshKey(ec("nistp521", 66, point).input)).keyBits).toBe(521);
    point[1] = 2;
    await expect(inspectSshKey(ec("nistp521", 66, point).input)).rejects.toMatchObject({ code: "SSH_EC" });
    point[1] = 1; point[67] = 2;
    await expect(inspectSshKey(ec("nistp521", 66, point).input)).rejects.toMatchObject({ code: "SSH_EC" });
  });
  it.each(["\0", "\x01", "\x0b", "\x7f", "\x85", "\ud800", "\udc00"])("refuses invalid text/control input %#", async value => {
    await expect(inspectSshKey(ed + value)).rejects.toMatchObject({ code: "SSH_TEXT" });
  });
  it("keeps a UTF-8 BOM visible to validation rather than silently stripping it", async () => {
    await expect(inspectSshKey("\ufeff" + ed)).rejects.toMatchObject({ code: "SSH_TEXT" });
  });
  it("enforces the raw UTF-8 limit before trimming leading padding", async () => {
    const exact = " ".repeat(16384 - edOnly.length) + edOnly;
    expect((await inspectSshKey(exact)).fingerprint).toBe(fingerprint);
    await expect(inspectSshKey(" " + exact)).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
  });
  it("bounds comments in UTF-8 bytes without truncating the complete JSON", async () => {
    const comment = "界".repeat(1365) + "a";
    const r = await inspectSshKey(edOnly + " " + comment);
    expect(r.comment).toBe(comment);
    expect(Buffer.byteLength(JSON.stringify(r, null, 2))).toBeLessThanOrEqual(32768);
    await expect(inspectSshKey(edOnly + " " + comment + "b")).rejects.toMatchObject({ code: "SSH_LIMIT" });
    const exact = " ".repeat(16384 - Buffer.byteLength(edOnly + " " + comment)) + edOnly + " " + comment;
    expect((await inspectSshKey(exact)).comment).toBe(comment);
    await expect(inspectSshKey(exact + " ")).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
  });
  it("accepts exactly 4KiB of blob data and refuses a longer blob before parsing", async () => {
    const fixture = rsa([1, 0, 1], [0, 128, ...Array<number>(4071).fill(0), 1]);
    expect(fixture.blob.length).toBe(4096);
    expect((await inspectSshKey(fixture.input)).keyBits).toBe(32584);
    const longer = rsa([1, 0, 1], [0, 128, ...Array<number>(4072).fill(0), 1]);
    await expect(inspectSshKey(longer.input)).rejects.toMatchObject({ code: "SSH_LIMIT" });
  });
  it.each([fingerprint + "=", fingerprint.toLowerCase(), "SHA256:" + "A".repeat(42),
    "SHA256:" + "_".repeat(43), fingerprint.slice(0, -1) + "9", "SHA256:\n" + "A".repeat(43)])(
    "rejects a malformed/noncanonical reference %#", async expected => {
      await expect(inspectSshKey(ed, expected)).rejects.toMatchObject({ code: "SSH_FINGERPRINT" });
    });
  it("bounds the reference before whitespace removal and never exposes supplied values in errors", async () => {
    expect((await inspectSshKey(ed, " ".repeat(78) + fingerprint)).matches).toBe(true);
    await expect(inspectSshKey(ed, " ".repeat(79) + fingerprint)).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
    try { await inspectSshKey(ed, "PRIVATE_REFERENCE"); throw new Error("Expected rejection"); }
    catch (error) { expect(error).toMatchObject({ code: "SSH_FINGERPRINT", message: "SSH_FINGERPRINT", detail: "" }); }
  });
  it("requires native crypto rather than a fallback", async () => {
    vi.stubGlobal("crypto", undefined);
    await expect(inspectSshKey(ed)).rejects.toMatchObject({ code: "SSH_CRYPTO" });
  });
  it.each(["throw", "reject"])("converts native %s failures into an input-free code", async mode => {
    vi.stubGlobal("crypto", { subtle: { digest: () => {
      if (mode === "throw") throw new Error("PRIVATE_CRYPTO_DETAIL");
      return Promise.reject(new Error("PRIVATE_CRYPTO_DETAIL"));
    } } });
    await expect(inspectSshKey(ed)).rejects.toMatchObject({ code: "SSH_CRYPTO", message: "SSH_CRYPTO", detail: "" });
  });
  it("rejects an already-aborted request before starting native work", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(inspectSshKey(ed, "", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
  it("stops waiting on abort, discards late native completion and removes its watchdog", async () => {
    vi.useFakeTimers();
    let finish!: (value: ArrayBuffer) => void;
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise<ArrayBuffer>(resolve => { finish = resolve; }) } });
    const controller = new AbortController();
    const pending = inspectSshKey(ed, "", controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    finish(new ArrayBuffer(32)); await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("expires the native digest at five seconds and handles a late rejection", async () => {
    vi.useFakeTimers();
    let fail!: (reason: Error) => void;
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise<ArrayBuffer>((_, reject) => { fail = reject; }) } });
    const pending = inspectSshKey(ed);
    const rejected = expect(pending).rejects.toMatchObject({ code: "SSH_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(4999);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1); await rejected;
    fail(new Error("late native failure")); await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
  });
});
