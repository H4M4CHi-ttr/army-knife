import { assertInputSize, ToolError } from "./errors";

export const CORS_LIMITS = {
  blockBytes: 16 * 1024, lines: 100, originBytes: 2048,
  methodCharacters: 32, unsafeBytes: 2048, unsafeNames: 32,
  allowTokens: 128, deferredCharacters: 2048,
} as const;

export interface CorsInput {
  origin: string;
  method: string;
  credentials: boolean;
  unsafeHeaders: string;
  forcePreflight: boolean;
  actualHeaders: string;
  preflightHeaders: string;
  preflightStatus: string;
}
export type CorsRule = "origin" | "credentials" | "status" | "method" | "headers" | "vary";
export interface CorsCheck {
  phase: "actual" | "preflight";
  rule: CorsRule;
  state: "pass" | "fail" | "warning";
  reason: "origin-match" | "origin-wildcard" | "origin-fail" | "credentials-match"
    | "credentials-fail" | "status-ok" | "status-fail" | "method-safe"
    | "method-match" | "method-fail" | "headers-match" | "headers-fail"
    | "vary-missing" | "duplicate";
  detail: string;
}
export interface CorsReport {
  outcome: "possible" | "blocked";
  origin: string;
  method: string;
  preflightRequired: boolean;
  unsafeHeaders: string[];
  nullOrigin: boolean;
  checks: CorsCheck[];
}

const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const ows = (value: string) => value.replace(/^[\t ]+|[\t ]+$/g, "");
const SAFE_METHODS = new Set(["GET", "HEAD", "POST"]);
const NORMAL_METHODS = new Set(["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"]);
const FORBIDDEN_HEADERS = new Set([
  "accept-charset", "accept-encoding", "access-control-request-headers",
  "access-control-request-method", "connection", "content-length", "cookie", "cookie2",
  "date", "dnt", "expect", "host", "keep-alive", "origin", "permissions-policy",
  "referer", "set-cookie", "te", "trailer", "transfer-encoding", "upgrade", "via",
  // Values determine whether these override headers are forbidden; not modeled here.
  "x-http-method", "x-http-method-override", "x-method-override",
]);

function requestOrigin(value: string): string {
  assertInputSize(value, CORS_LIMITS.originBytes);
  if (value === "null") return value;
  try {
    const parsed = new URL(value);
    if (["http:", "https:"].includes(parsed.protocol) && parsed.origin === value) return value;
  } catch { /* Only a serialized HTTP(S) origin is accepted. */ }
  throw new ToolError("CORS_ORIGIN");
}

type HeaderBlock = Map<string, string[]>;
function parseBlock(source: string): HeaderBlock {
  assertInputSize(source, CORS_LIMITS.blockBytes);
  const lines = source.split(/\r\n|\n/);
  if (lines.length > CORS_LIMITS.lines) throw new ToolError("CORS_LINES");
  const block: HeaderBlock = new Map();
  for (const line of lines) {
    if (line === "") continue;
    const colon = line.indexOf(":");
    const name = line.slice(0, colon);
    const value = line.slice(colon + 1);
    // Reject obs-fold, bare CR, control bytes, and characters outside HTTP ByteString.
    if (colon < 1 || !TOKEN.test(name) || /[^\t\x20-\x7e\x80-\xff]/.test(value))
      throw new ToolError("CORS_HEADER");
    const key = name.toLowerCase();
    block.set(key, [...(block.get(key) ?? []), ows(value)]);
  }
  return block;
}

function list(value: string, limit: number): string[] {
  if (!value) return [];
  const parts = value.split(",").map(ows);
  if (parts.length > limit) throw new ToolError("CORS_LIST_LIMIT");
  // HTTP #list grammar permits empty comma-separated elements.
  const tokens = parts.filter(Boolean);
  if (tokens.some((part) => !TOKEN.test(part))) throw new ToolError("CORS_LIST");
  return tokens;
}

/** A bounded static check, never an actual Fetch request or a security guarantee. */
export function inspectCors(input: CorsInput): CorsReport {
  const origin = requestOrigin(input.origin);
  if (!TOKEN.test(input.method) || input.method.length > CORS_LIMITS.methodCharacters
    || /^(CONNECT|TRACE|TRACK)$/i.test(input.method)) throw new ToolError("CORS_METHOD");
  const upper = input.method.toUpperCase();
  const method = NORMAL_METHODS.has(upper) ? upper : input.method;
  assertInputSize(input.unsafeHeaders, CORS_LIMITS.unsafeBytes);
  const unsafeHeaders = [...new Set(list(input.unsafeHeaders, CORS_LIMITS.unsafeNames)
    .map((name) => name.toLowerCase()))];
  if (unsafeHeaders.some((name) => FORBIDDEN_HEADERS.has(name)
    || name.startsWith("sec-") || name.startsWith("proxy-") || name === "*"))
    throw new ToolError("CORS_UNSAFE_HEADERS");
  const preflightRequired = input.forcePreflight || !SAFE_METHODS.has(method) || unsafeHeaders.length > 0;
  const actual = parseBlock(input.actualHeaders);
  // Validate both supplied blocks even if one is not needed; never silently accept malformed input.
  const preflight = parseBlock(input.preflightHeaders);
  const checks: CorsCheck[] = [];
  function add(phase: CorsCheck["phase"], rule: CorsRule, state: CorsCheck["state"],
    reason: CorsCheck["reason"], detail = "") {
    checks.push({ phase, rule, state, reason, detail });
  }
  function response(block: HeaderBlock, phase: CorsCheck["phase"]) {
    const origins = block.get("access-control-allow-origin") ?? [];
    const allowed = origins[0];
    const matches = origins.length === 1 && (allowed === origin || (allowed === "*" && !input.credentials));
    add(phase, "origin", matches ? "pass" : "fail", origins.length > 1 ? "duplicate"
      : !matches ? "origin-fail" : allowed === "*" ? "origin-wildcard" : "origin-match");
    if (input.credentials) {
      const values = block.get("access-control-allow-credentials") ?? [];
      const valid = values.length === 1 && values[0] === "true";
      add(phase, "credentials", valid ? "pass" : "fail", values.length > 1 ? "duplicate"
        : valid ? "credentials-match" : "credentials-fail");
    }
    if (allowed && allowed !== "*") {
      const vary = list((block.get("vary") ?? []).join(","), CORS_LIMITS.allowTokens)
        .map((name) => name.toLowerCase());
      if (!vary.includes("origin") && !vary.includes("*"))
        add(phase, "vary", "warning", "vary-missing");
    }
  }
  response(actual, "actual");
  if (preflightRequired) {
    if (!/^[1-5][0-9]{2}$/.test(input.preflightStatus)) throw new ToolError("CORS_STATUS");
    const status = Number(input.preflightStatus);
    add("preflight", "status", status >= 200 && status <= 299 ? "pass" : "fail",
      status >= 200 && status <= 299 ? "status-ok" : "status-fail", input.preflightStatus);
    response(preflight, "preflight");
    const methods = list((preflight.get("access-control-allow-methods") ?? []).join(","), CORS_LIMITS.allowTokens);
    const names = list((preflight.get("access-control-allow-headers") ?? []).join(","), CORS_LIMITS.allowTokens)
      .map((name) => name.toLowerCase());
    // Fetch substitutes the method if the explicit use-CORS-preflight flag is set and ACAM is absent.
    const implicitForcedMethod = input.forcePreflight && !preflight.has("access-control-allow-methods");
    const methodAllowed = SAFE_METHODS.has(method) || methods.includes(method) || implicitForcedMethod
      || (!input.credentials && methods.includes("*"));
    add("preflight", "method", methodAllowed ? "pass" : "fail", SAFE_METHODS.has(method)
      ? "method-safe" : methodAllowed ? "method-match" : "method-fail", method);
    const denied = unsafeHeaders.filter((name) => !names.includes(name)
      && (name === "authorization" || input.credentials || !names.includes("*")));
    add("preflight", "headers", denied.length ? "fail" : "pass",
      denied.length ? "headers-fail" : "headers-match", denied.join(", "));
  }
  return {
    outcome: checks.some((check) => check.state === "fail") ? "blocked" : "possible",
    origin, method, preflightRequired, unsafeHeaders, nullOrigin: origin === "null", checks,
  };
}
