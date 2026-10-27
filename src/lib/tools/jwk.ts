import { assertInputSize, ToolError } from "./errors";
import { parseJsonSafely, type JsonValue } from "./json";

export const JWK_LIMITS = Object.freeze({ bytes: 64 * 1024, keys: 32, deferredCharacters: 2048,
  modulusBytes: 1024, exponentBytes: 8, metadataCharacters: 256, operations: 8, timeoutMs: 5000 });
export { JWK_SAMPLE } from "./jwk-sample";
export type JwkWarning = "duplicateKid" | "duplicateKey" | "smallRsa" | "usageMismatch" |
  "unknownUse" | "unknownOperation" | "privateOperation" | "ignoredMembers";
export interface JwkKeyReport {
  index: number;
  kty: "RSA" | "EC" | "OKP";
  kid: string | null;
  alg: string | null;
  use: string | null;
  keyOps: string[] | null;
  curve: string | null;
  modulusBits: number | null;
  exponent: string | null;
  algorithmAssessment: "notSpecified" | "familyMatch" | "mismatch" | "unassessed";
  canonical: string;
  thumbprint: string;
  ignoredMembers: number;
  warnings: JwkWarning[];
}
export interface JwkReport {
  kind: "JWK" | "JWKS";
  keys: JwkKeyReport[];
  ignoredTopLevelMembers: number;
}
type ObjectValue = { [key: string]: JsonValue };
const privateMembers = ["d", "p", "q", "dp", "dq", "qi", "oth", "k"];
const knownOperations = ["sign", "verify", "encrypt", "decrypt", "wrapKey", "unwrapKey", "deriveKey", "deriveBits"];
const privateOperations = ["sign", "decrypt", "unwrapKey", "deriveKey", "deriveBits"];
const ecSizes: Record<string, number> = { "P-256": 32, "P-384": 48, "P-521": 66 };
const okpSizes: Record<string, number> = { Ed25519: 32, Ed448: 57, X25519: 32, X448: 56 };
function object(value: JsonValue): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ToolError("JWK_SHAPE");
  return value;
}
function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decode(value: JsonValue | undefined, maxBytes: number): Uint8Array {
  if (typeof value !== "string" || !value || value.length > Math.ceil(maxBytes * 4 / 3) ||
    !/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new ToolError("JWK_MATERIAL");
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  } catch { throw new ToolError("JWK_MATERIAL"); }
  if (bytes.length > maxBytes || encode(bytes) !== value) throw new ToolError("JWK_MATERIAL");
  return bytes;
}
function integer(bytes: Uint8Array): bigint {
  if (!bytes[0]) throw new ToolError("JWK_MATERIAL");
  let result = 0n;
  for (const byte of bytes) result = (result << 8n) | BigInt(byte);
  return result;
}
function validString(value: unknown, max: number, allowEmpty = true): value is string {
  return typeof value === "string" && (allowEmpty || value.length > 0) && value.length <= max &&
    !/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u.test(value);
}
function metadata(key: ObjectValue, name: string): string | null {
  if (!Object.hasOwn(key, name)) return null;
  const value = key[name];
  if (!validString(value, JWK_LIMITS.metadataCharacters)) throw new ToolError("JWK_METADATA");
  return value;
}

type Purpose = "sig" | "enc" | "agreement";
/** Only these exact JOSE families are assessed. No crypto import/validation. */
function algorithm(key: JwkKeyReport): Purpose | null {
  const alg = key.alg;
  if (alg === null) return null;
  let matches: boolean;
  let purpose: Purpose = "sig";
  if (/^(RS|PS)(256|384|512)$/.test(alg)) matches = key.kty === "RSA";
  else if (/^RSA-OAEP(?:-(256|384|512))?$/.test(alg) || alg === "RSA1_5") {
    matches = key.kty === "RSA"; purpose = "enc";
  } else if (["ES256", "ES384", "ES512"].includes(alg)) {
    matches = key.kty === "EC" && key.curve === ({ ES256: "P-256", ES384: "P-384", ES512: "P-521" } as Record<string, string>)[alg];
  } else if (alg === "EdDSA") matches = key.kty === "OKP" && ["Ed25519", "Ed448"].includes(key.curve!);
  else if (/^ECDH-ES(?:\+A(128|192|256)KW)?$/.test(alg)) {
    matches = key.kty === "EC" || (key.kty === "OKP" && ["X25519", "X448"].includes(key.curve!)); purpose = "agreement";
  } else if (alg === "none" || /^HS(256|384|512)$/.test(alg)) matches = false;
  else { key.algorithmAssessment = "unassessed"; return null; }
  key.algorithmAssessment = matches ? "familyMatch" : "mismatch";
  return purpose;
}
function inspectKey(value: JsonValue, index: number): JwkKeyReport {
  const key = object(value);
  if (key.kty === "oct" || privateMembers.some(name => Object.hasOwn(key, name))) throw new ToolError("JWK_PRIVATE");
  if (typeof key.kty !== "string") throw new ToolError("JWK_SHAPE");
  if (!["RSA", "EC", "OKP"].includes(key.kty)) throw new ToolError("JWK_UNSUPPORTED");
  const result: JwkKeyReport = { index: index + 1, kty: key.kty as JwkKeyReport["kty"],
    kid: metadata(key, "kid"), alg: metadata(key, "alg"), use: metadata(key, "use"),
    keyOps: null, curve: null, modulusBits: null, exponent: null, algorithmAssessment: "notSpecified",
    canonical: "", thumbprint: "", ignoredMembers: 0, warnings: [] };
  if (Object.hasOwn(key, "key_ops")) {
    if (!Array.isArray(key.key_ops) || key.key_ops.length > JWK_LIMITS.operations ||
      key.key_ops.some(op => !validString(op, 32, false)) ||
      new Set(key.key_ops).size !== key.key_ops.length) throw new ToolError("JWK_METADATA");
    result.keyOps = key.key_ops as string[];
  }
  let publicMembers: ObjectValue;
  if (key.kty === "RSA") {
    const n = decode(key.n, JWK_LIMITS.modulusBytes);
    integer(n);
    const e = integer(decode(key.e, JWK_LIMITS.exponentBytes));
    if (e <= 1n || e % 2n === 0n) throw new ToolError("JWK_MATERIAL");
    result.modulusBits = (n.length - 1) * 8 + (32 - Math.clz32(n[0]!));
    result.exponent = e.toString();
    if (result.modulusBits < 2048) result.warnings.push("smallRsa");
    publicMembers = { e: key.e!, kty: "RSA", n: key.n! };
  } else {
    if (typeof key.crv !== "string" || !Object.hasOwn(key.kty === "EC" ? ecSizes : okpSizes, key.crv))
      throw new ToolError("JWK_UNSUPPORTED");
    result.curve = key.crv;
    const length = (key.kty === "EC" ? ecSizes : okpSizes)[key.crv]!;
    const x = decode(key.x, length);
    if (x.length !== length) throw new ToolError("JWK_MATERIAL");
    if (key.kty === "EC") {
      const y = decode(key.y, length);
      if (y.length !== length || (key.crv === "P-521" && (x[0]! > 1 || y[0]! > 1))) throw new ToolError("JWK_MATERIAL");
      publicMembers = { crv: key.crv, kty: "EC", x: key.x!, y: key.y! };
    } else publicMembers = { crv: key.crv, kty: "OKP", x: key.x! };
  }
  result.canonical = JSON.stringify(publicMembers);
  const allow = new Set([...Object.keys(publicMembers), "kid", "alg", "use", "key_ops"]);
  result.ignoredMembers = Object.keys(key).filter(name => !allow.has(name)).length;
  if (result.ignoredMembers) result.warnings.push("ignoredMembers");
  const purpose = algorithm(result);
  if (result.use !== null && !["sig", "enc"].includes(result.use)) result.warnings.push("unknownUse");
  const ops = result.keyOps ?? [];
  if (ops.some(op => !knownOperations.includes(op))) result.warnings.push("unknownOperation");
  if (ops.some(op => privateOperations.includes(op))) result.warnings.push("privateOperation");
  const operationPurposes: Purpose[] = ops.filter(op => knownOperations.includes(op)).map(op =>
    ["sign", "verify"].includes(op) ? "sig" : ["deriveKey", "deriveBits"].includes(op) ? "agreement" : "enc");
  // EC and X25519/X448 agree on keys; they do not perform direct encrypt/wrap
  // operations. Ed25519/Ed448 only sign. These contradictions are knowable even
  // with no alg, without importing a key or claiming mathematical validity.
  const capabilities: Purpose[] = result.kty === "RSA" ? ["sig", "enc"] : result.kty === "EC" ? ["sig", "agreement"] :
    [result.curve!.startsWith("Ed") ? "sig" : "agreement"];
  const usePurpose = result.use === "sig" ? "sig" : result.use === "enc" ? "enc" : null;
  const broad = (value: Purpose) => value === "sig" ? "sig" : "enc";
  if ((usePurpose && !capabilities.some(value => broad(value) === usePurpose)) ||
    (usePurpose && purpose && usePurpose !== broad(purpose)) ||
    operationPurposes.some(value => !capabilities.includes(value) ||
      (purpose !== null && value !== purpose) || (usePurpose !== null && broad(value) !== usePurpose)) ||
    new Set(operationPurposes).size > 1) result.warnings.push("usageMismatch");
  return result;
}

/** A single deadline for the set. Cancellation stops waiting and subsequent hashes. */
function thumbprints(report: JwkReport, signal?: AbortSignal): Promise<JwkReport> {
  if (!globalThis.crypto?.subtle?.digest) return Promise.reject(new ToolError("JWK_CRYPTO"));
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      if (error) reject(error); else resolve(report);
    };
    const abort = () => finish(new DOMException("Operation aborted", "AbortError"));
    const timeout = setTimeout(() => finish(new ToolError("JWK_TIMEOUT")), JWK_LIMITS.timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    void (async () => {
      try {
        for (const key of report.keys) {
          if (settled) return;
          const hash = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(key.canonical));
          if (settled) return;
          key.thumbprint = encode(new Uint8Array(hash));
        }
        finish();
      } catch { finish(new ToolError("JWK_CRYPTO")); }
    })();
  });
}

export async function inspectJwk(input: string, signal?: AbortSignal): Promise<JwkReport> {
  if (signal?.aborted) throw new DOMException("Operation aborted", "AbortError");
  assertInputSize(input, JWK_LIMITS.bytes);
  let parsed: JsonValue;
  try { parsed = parseJsonSafely(input); } catch { throw new ToolError("JWK_JSON"); }
  const root = object(parsed);
  const isSet = Object.hasOwn(root, "keys");
  if (isSet && (!Array.isArray(root.keys) || Object.hasOwn(root, "kty"))) throw new ToolError("JWK_SHAPE");
  const values = isSet ? root.keys as JsonValue[] : [root];
  if (values.length > JWK_LIMITS.keys) throw new ToolError("JWK_LIMIT");
  const report: JwkReport = { kind: isSet ? "JWKS" : "JWK", keys: values.map(inspectKey),
    ignoredTopLevelMembers: isSet ? Object.keys(root).length - 1 : 0 };
  const kids = new Map<string, number>(), materials = new Map<string, number>();
  for (const key of report.keys) {
    if (key.kid !== null) kids.set(key.kid, (kids.get(key.kid) ?? 0) + 1);
    materials.set(key.canonical, (materials.get(key.canonical) ?? 0) + 1);
  }
  for (const key of report.keys) {
    if (key.kid !== null && kids.get(key.kid)! > 1) key.warnings.push("duplicateKid");
    if (materials.get(key.canonical)! > 1) key.warnings.push("duplicateKey");
  }
  return report.keys.length ? thumbprints(report, signal) : report;
}
