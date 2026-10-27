import { webcrypto, createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { inspectJwk } from "./jwk";

// Public RFC 8037 A.2/A.3 vector. No private key fixtures are needed.
const ed = { kty: "OKP", crv: "Ed25519", x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo" };
const thumbprint = "kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k";
const b64 = (bytes: number[]) => Buffer.from(bytes).toString("base64url");
const rsa = { kty: "RSA", n: b64([128, ...Array<number>(254).fill(0), 1]), e: "AQAB" };
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });
const inspect = (value: unknown) => inspectJwk(JSON.stringify(value));

describe("public JWK/JWKS structure and thumbprints", () => {
  it("matches the published RFC 8037 SHA-256 thumbprint and canonical input", async () => {
    const r = await inspect(ed);
    expect(r.kind).toBe("JWK");
    expect(r.keys[0]).toMatchObject({ kty: "OKP", curve: "Ed25519", thumbprint,
      canonical: '{"crv":"Ed25519","kty":"OKP","x":"11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo"}',
      algorithmAssessment: "notSpecified", warnings: [] });
  });
  it("excludes metadata, URLs, certificates and unknown extension values from the thumbprint/report", async () => {
    const r = await inspect({ ...ed, kid: "rotation-a", alg: "EdDSA", use: "sig", key_ops: ["verify"],
      x5u: "https://example.invalid/PRIVATE_SENTINEL", x5c: ["PRIVATE_SENTINEL"], custom: { password: "PRIVATE_SENTINEL" } });
    expect(r.keys[0]).toMatchObject({ kid: "rotation-a", alg: "EdDSA", keyOps: ["verify"], thumbprint,
      algorithmAssessment: "familyMatch", ignoredMembers: 3 });
    expect(JSON.stringify(r)).not.toContain("PRIVATE_SENTINEL");
    expect(r.keys[0]!.warnings).toContain("ignoredMembers");
  });
  it("separately flags repeated kid and repeated key material on every affected key", async () => {
    const r = await inspect({ keys: [{ ...ed, kid: "same" }, { ...rsa, kid: "same" }, { ...ed, kid: "different" }], extra: "OMITTED" });
    expect(r.kind).toBe("JWKS"); expect(r.ignoredTopLevelMembers).toBe(1);
    expect(r.keys[0]!.warnings).toEqual(expect.arrayContaining(["duplicateKid", "duplicateKey"]));
    expect(r.keys[1]!.warnings).toContain("duplicateKid");
    expect(r.keys[1]!.warnings).not.toContain("duplicateKey");
    expect(r.keys[2]!.warnings).toContain("duplicateKey");
    expect(r.keys[2]!.warnings).not.toContain("duplicateKid");
    expect(JSON.stringify(r)).not.toContain("OMITTED");
  });
  it("accepts an empty JWKS and never invents a key", async () => {
    expect((await inspect({ keys: [] })).keys).toEqual([]);
  });
  it("computes exact RSA bit length and exponent beyond Number's safe range", async () => {
    const r = await inspect({ ...rsa, e: "IAAAAAAAAQ" });
    expect(r.keys[0]).toMatchObject({ modulusBits: 2048, exponent: "9007199254740993" });
    expect(r.keys[0]!.canonical).toBe(`{"e":"IAAAAAAAAQ","kty":"RSA","n":"${rsa.n}"}`);
    expect(r.keys[0]!.thumbprint).toBe(createHash("sha256").update(r.keys[0]!.canonical).digest("base64url"));
    const small = await inspect({ ...rsa, n: "fw" });
    expect(small.keys[0]!.modulusBits).toBe(7);
    expect(small.keys[0]!.warnings).toContain("smallRsa");
  });
  it.each([["P-256", 32], ["P-384", 48], ["P-521", 66]] as const)("checks fixed-width EC coordinates for %s", async (crv, length) => {
    const x = b64(Array<number>(length).fill(0));
    const r = await inspect({ kty: "EC", crv, x, y: x });
    expect(r.keys[0]!.curve).toBe(crv);
    // Structural inspection deliberately does not call the zero point valid.
    expect(r.keys[0]!.canonical).toBe(JSON.stringify({ crv, kty: "EC", x, y: x }));
    await expect(inspect({ kty: "EC", crv, x: x.slice(1), y: x })).rejects.toMatchObject({ code: "JWK_MATERIAL" });
  });
  it.each([["Ed25519", 32], ["Ed448", 57], ["X25519", 32], ["X448", 56]] as const)("checks OKP public length for %s", async (crv, length) => {
    expect((await inspect({ kty: "OKP", crv, x: b64(Array<number>(length).fill(1)) })).keys[0]!.curve).toBe(crv);
    await expect(inspect({ kty: "OKP", crv, x: b64(Array<number>(length + 1).fill(1)) })).rejects.toMatchObject({ code: "JWK_MATERIAL" });
  });
  it.each(["", "A", "AQ=", "AQ+_", "AR", "AAE", "AA"])("rejects noncanonical/zero RSA integer %s", async (n) => {
    await expect(inspect({ ...rsa, n })).rejects.toMatchObject({ code: "JWK_MATERIAL" });
  });
  it.each(["AA", "AQ", "Ag", "AQAA"])("rejects zero, one and even RSA exponents %s", async (e) => {
    await expect(inspect({ ...rsa, e })).rejects.toMatchObject({ code: "JWK_MATERIAL" });
  });
  it("rejects too-large material and accepts the exact RSA byte boundary", async () => {
    const n = b64([128, ...Array<number>(1023).fill(1)]);
    expect((await inspect({ ...rsa, n })).keys[0]!.modulusBits).toBe(8192);
    await expect(inspect({ ...rsa, n: b64(Array<number>(1025).fill(1)) })).rejects.toMatchObject({ code: "JWK_MATERIAL" });
    await expect(inspect({ ...rsa, e: b64(Array<number>(9).fill(1)) })).rejects.toMatchObject({ code: "JWK_MATERIAL" });
  });
  it.each(["d", "p", "q", "dp", "dq", "qi", "oth", "k"])("rejects private member %s even with an empty value, without echo", async (field) => {
    for (const value of ["PRIVATE_SENTINEL", null, ""]) {
      await expect(inspect({ keys: [ed, { ...rsa, [field]: value }] })).rejects.toMatchObject({ code: "JWK_PRIVATE", message: "JWK_PRIVATE", detail: "" });
    }
  });
  it("rejects symmetric keys and unsupported curves/types explicitly", async () => {
    await expect(inspect({ kty: "oct", k: "PRIVATE_SENTINEL" })).rejects.toMatchObject({ code: "JWK_PRIVATE" });
    for (const key of [{ ...ed, crv: "future" }, { ...ed, kty: "future" }])
      await expect(inspect(key)).rejects.toMatchObject({ code: "JWK_UNSUPPORTED" });
  });
  it.each([null, [], 1, {}, { keys: {} }, { keys: [null] }, { keys: [], ...ed }])("rejects malformed root/key shapes %s", async value => {
    await expect(inspect(value)).rejects.toMatchObject({ code: "JWK_SHAPE" });
  });
  it("enforces key count, byte limit and strict duplicate/precision JSON parsing", async () => {
    expect((await inspect({ keys: Array(32).fill(ed) })).keys).toHaveLength(32);
    await expect(inspect({ keys: Array(33).fill(ed) })).rejects.toMatchObject({ code: "JWK_LIMIT" });
    await expect(inspectJwk(" ".repeat(65537))).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
    await expect(inspectJwk('{"kty":"OKP","kty":"RSA"}')).rejects.toMatchObject({ code: "JWK_JSON" });
    await expect(inspectJwk(JSON.stringify(ed).slice(0, -1) + ',"extra":9007199254740993}')).rejects.toMatchObject({ code: "JWK_JSON" });
    await expect(inspectJwk("PRIVATE_SENTINEL")).rejects.toMatchObject({ code: "JWK_JSON", message: "JWK_JSON" });
  });
  it.each([{ kid: 1 }, { kid: "a".repeat(257) }, { alg: null }, { use: [] }, { key_ops: "verify" },
    { key_ops: ["verify", "verify"] }, { key_ops: Array(9).fill("verify") }, { key_ops: [1] }, { key_ops: ["a".repeat(33)] }])("rejects malformed bounded metadata %s", async (metadata) => {
    await expect(inspect({ ...ed, ...metadata })).rejects.toMatchObject({ code: "JWK_METADATA" });
  });
  it.each([
    [{ ...ed, alg: "EdDSA" }, "familyMatch"],
    [{ ...ed, alg: "RS256" }, "mismatch"],
    [{ ...rsa, alg: "PS256" }, "familyMatch"],
    [{ ...ed, crv: "X25519", alg: "EdDSA" }, "mismatch"],
    [{ ...ed, crv: "X25519", alg: "ECDH-ES" }, "familyMatch"],
    [{ ...ed, alg: "new-alg" }, "unassessed"],
    [{ ...ed, alg: "none" }, "mismatch"],
    [{ ...ed, alg: "HS256" }, "mismatch"],
  ])("assesses only documented algorithm families %s", async (key, assessment) => {
    expect((await inspect(key)).keys[0]!.algorithmAssessment).toBe(assessment);
  });
  it("reports use/key_ops conflicts, private operations and unassessed metadata", async () => {
    const r = await inspect({ ...ed, alg: "EdDSA", use: "enc", key_ops: ["sign", "encrypt", "custom"] });
    expect(r.keys[0]!.warnings).toEqual(expect.arrayContaining(["usageMismatch", "privateOperation", "unknownOperation"]));
    expect((await inspect({ ...ed, use: "future" })).keys[0]!.warnings).toContain("unknownUse");
  });
  it.each([
    { ...ed, use: "enc", key_ops: ["encrypt"] },
    { ...ed, crv: "X25519", use: "sig", key_ops: ["verify"] },
    { ...ed, crv: "X25519", alg: "ECDH-ES", key_ops: ["encrypt"] },
    { ...ed, crv: "X25519", key_ops: ["wrapKey"] },
    { kty: "EC", crv: "P-256", x: b64(Array<number>(32).fill(0)), y: b64(Array<number>(32).fill(0)), key_ops: ["encrypt"] },
  ])("reports deterministic subtype/operation contradictions without relying on alg: %s", async key => {
    expect((await inspect(key)).keys[0]!.warnings).toContain("usageMismatch");
  });
  it("does not conflate signing, direct encryption and key agreement operations", async () => {
    for (const key of [{ ...ed, use: "sig", key_ops: ["verify"] },
      { ...rsa, alg: "RSA-OAEP-256", use: "enc", key_ops: ["encrypt", "wrapKey"] },
      { ...ed, crv: "X25519", alg: "ECDH-ES", use: "enc", key_ops: ["deriveBits"] }])
      expect((await inspect(key)).keys[0]!.warnings).not.toContain("usageMismatch");
  });
  it.each(["kid", "alg", "use", "key_ops"])("rejects isolated surrogates consistently in metadata %s", async field => {
    await expect(inspect({ ...ed, [field]: field === "key_ops" ? ["\ud800"] : "\ud800" })).rejects.toMatchObject({ code: "JWK_METADATA" });
  });
  it("sanitizes Web Crypto failures", async () => {
    vi.stubGlobal("crypto", { subtle: { digest: () => Promise.reject(new Error("PRIVATE_SENTINEL")) } });
    await expect(inspect(ed)).rejects.toMatchObject({ code: "JWK_CRYPTO", message: "JWK_CRYPTO" });
  });
  it("requires native SHA-256 support", async () => {
    vi.stubGlobal("crypto", undefined);
    await expect(inspect(ed)).rejects.toMatchObject({ code: "JWK_CRYPTO" });
  });
  it("cancels a pending digest, ignores late results and cleans up timers", async () => {
    vi.useFakeTimers();
    let finish!: (value: ArrayBuffer) => void;
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise<ArrayBuffer>(resolve => { finish = resolve; }) } });
    const controller = new AbortController();
    const pending = inspectJwk(JSON.stringify(ed), controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    finish(new ArrayBuffer(32));
    await Promise.resolve(); expect(vi.getTimerCount()).toBe(0);
    await expect(inspectJwk(JSON.stringify(ed), controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
  it("uses one five-second deadline for the full set, not one per key", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise(resolve => setTimeout(() => resolve(new ArrayBuffer(32)), 3000)) } });
    const pending = inspect({ keys: [ed, rsa] });
    const rejection = expect(pending).rejects.toMatchObject({ code: "JWK_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(5000); await rejection;
    await vi.runAllTimersAsync();
    expect(vi.getTimerCount()).toBe(0);
  });
});
