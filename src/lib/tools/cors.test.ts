import { describe, expect, it } from "vite-plus/test";
import { CORS_LIMITS, inspectCors, type CorsInput } from "./cors";

const simple: CorsInput = {
  origin: "https://app.example", method: "GET", credentials: false,
  unsafeHeaders: "", forcePreflight: false, actualHeaders: "Access-Control-Allow-Origin: *",
  preflightHeaders: "", preflightStatus: "204",
};
const complex: CorsInput = {
  ...simple, method: "PUT", credentials: true, unsafeHeaders: "Authorization, Content-Type",
  actualHeaders: "Access-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Credentials: true\nVary: Origin",
  preflightHeaders: "Access-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Credentials: true\nAccess-Control-Allow-Methods: PUT\nAccess-Control-Allow-Headers: authorization, content-type\nVary: Origin",
};
const report = (changes: Partial<CorsInput> = {}) => inspectCors({ ...simple, ...changes });
const preflight = (changes: Partial<CorsInput> = {}) => inspectCors({ ...complex, ...changes });

describe("offline CORS conditions", () => {
  it("accepts a simple wildcard request without inventing a preflight", () => {
    expect(report()).toMatchObject({ outcome: "possible", preflightRequired: false, method: "GET" });
    expect(report().checks).toHaveLength(1);
  });
  it("checks a separate credentialed preflight and actual response", () => {
    expect(preflight().outcome).toBe("possible");
    expect(preflight({ actualHeaders: "" }).outcome).toBe("blocked");
    expect(preflight({ preflightHeaders: "" }).outcome).toBe("blocked");
    expect(preflight().checks.every((row) => row.state === "pass")).toBe(true);
  });
  it.each(["https://APP.example", "https://app.example/", "https://app.example:443", "https://other.example", "https://app.example, https://other.example", "null", ""])("requires exact Allow-Origin: %s", (value) => {
    expect(report({ actualHeaders: "Access-Control-Allow-Origin: " + value }).outcome).toBe("blocked");
  });
  it.each(["https://app.example/", "HTTPS://app.example", "https://app.example:443", "https://user:pass@app.example", "https://例.example", "https://app.example?x", "file:///tmp/x", "data:text/plain,x", " https://app.example", "https://app.example\n"])("rejects a nonserialized origin: %s", (origin) => {
    expect(() => report({ origin })).toThrow("CORS_ORIGIN");
  });
  it("accepts serialized IPv6, punycode and null origins and warns about null", () => {
    for (const origin of ["https://[2001:db8::1]:8443", "https://xn--fsq.example", "null"])
      expect(report({ origin, actualHeaders: "Access-Control-Allow-Origin: " + origin })).toMatchObject({ outcome: "possible", nullOrigin: origin === "null" });
  });
  it("never treats an origin wildcard as valid with credentials included", () => {
    expect(report({ credentials: true, actualHeaders: "Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true" }).outcome).toBe("blocked");
  });
  it.each(["True", "TRUE", "false", "true, true", ""])("requires exact lowercase credentials true: %s", (value) => {
    expect(preflight({ actualHeaders: `Access-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Credentials: ${value}` }).outcome).toBe("blocked");
    expect(preflight({ preflightHeaders: complex.preflightHeaders.replace("Credentials: true", "Credentials: " + value) }).outcome).toBe("blocked");
  });
  it("ignores Allow-Credentials without credentials include", () => {
    expect(report({ actualHeaders: simple.actualHeaders + "\nAccess-Control-Allow-Credentials: false" }).outcome).toBe("possible");
  });
  it("rejects repeated singleton headers even with identical values", () => {
    const duplicateOrigin = report({ actualHeaders: simple.actualHeaders + "\naccess-control-allow-origin: *" });
    expect(duplicateOrigin.checks[0]).toMatchObject({ state: "fail", reason: "duplicate" });
    expect(preflight({ actualHeaders: complex.actualHeaders + "\nAccess-Control-Allow-Credentials: true" }).outcome).toBe("blocked");
  });
  it("combines repeated allow-list headers, trims HTTP whitespace and ignores empty list members", () => {
    const headers = complex.preflightHeaders.replace("authorization, content-type", "\tauthorization, \t\nAccess-Control-Allow-Headers: , content-type,");
    expect(preflight({ preflightHeaders: headers }).outcome).toBe("possible");
    expect(report({ actualHeaders: "aCcEsS-CoNtRoL-AlLoW-OrIgIn:\t* \t\r\n" }).outcome).toBe("possible");
  });
  it("applies wildcard method/header semantics and the Authorization exception", () => {
    const headers = "Access-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: *\nAccess-Control-Allow-Headers: *";
    expect(report({ method: "PATCH", unsafeHeaders: "X-Trace", preflightHeaders: headers }).outcome).toBe("possible");
    expect(report({ method: "PATCH", unsafeHeaders: "Authorization", preflightHeaders: headers }).outcome).toBe("blocked");
    expect(report({ method: "PATCH", unsafeHeaders: "Authorization", preflightHeaders: headers + ", Authorization" }).outcome).toBe("possible");
    expect(preflight({ preflightHeaders: complex.preflightHeaders.replace("Methods: PUT", "Methods: *") }).outcome).toBe("blocked");
    expect(preflight({ preflightHeaders: complex.preflightHeaders.replace("authorization, content-type", "authorization, *") }).outcome).toBe("blocked");
  });
  it("normalizes only Fetch's six standard methods and matches custom method case", () => {
    expect(report({ method: "get" }).method).toBe("GET");
    expect(preflight({ method: "put" }).outcome).toBe("possible");
    const headers = complex.preflightHeaders.replace("Methods: PUT", "Methods: PATCH");
    expect(preflight({ method: "PATCH", preflightHeaders: headers }).outcome).toBe("possible");
    expect(preflight({ method: "patch", preflightHeaders: headers }).outcome).toBe("blocked");
    expect(preflight({ preflightHeaders: complex.preflightHeaders.replace("Methods: PUT", "Methods: put") }).outcome).toBe("blocked");
  });
  it("GET/HEAD/POST need no Allow-Methods, but unsafe names still need permission", () => {
    for (const method of ["GET", "HEAD", "POST"]) {
      const headers = complex.preflightHeaders.replace("Access-Control-Allow-Methods: PUT\n", "");
      expect(preflight({ method, preflightHeaders: headers }).outcome).toBe("possible");
      expect(preflight({ method, preflightHeaders: "Access-Control-Allow-Origin: *" }).outcome).toBe("blocked");
    }
  });
  it("evaluates an actual OPTIONS method separately from a preflight's method", () => {
    expect(report({ method: "OPTIONS", preflightHeaders: "Access-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: OPTIONS" }).outcome).toBe("possible");
  });
  it("honors the explicit preflight flag, including absent Allow-Methods", () => {
    expect(report({ forcePreflight: true, preflightHeaders: simple.actualHeaders })).toMatchObject({ preflightRequired: true, outcome: "possible" });
    expect(preflight({ forcePreflight: true, preflightHeaders: complex.preflightHeaders.replace("Access-Control-Allow-Methods: PUT\n", "") }).outcome).toBe("possible");
    expect(preflight({ forcePreflight: true, preflightHeaders: complex.preflightHeaders.replace("Methods: PUT", "Methods: GET") }).outcome).toBe("blocked");
  });
  it.each(["200", "204", "299", "199", "300", "403", "599"])("evaluates preflight status %s", (preflightStatus) => {
    expect(preflight({ preflightStatus }).outcome).toBe(Number(preflightStatus) >= 200 && Number(preflightStatus) <= 299 ? "possible" : "blocked");
  });
  it.each(["", "2e2", "0204", "200.0", " 204", "600", "099"])("rejects ambiguous status %s", (preflightStatus) => {
    expect(() => preflight({ preflightStatus })).toThrow("CORS_STATUS");
  });
  it("uses Vary only as an advisory and handles case, repeated fields and wildcard", () => {
    expect(preflight({ actualHeaders: complex.actualHeaders.replace("\nVary: Origin", "") })).toMatchObject({ outcome: "possible", checks: expect.arrayContaining([expect.objectContaining({ rule: "vary", state: "warning" })]) });
    for (const vary of ["Vary: origin", "Vary: Accept\nVary: ORIGIN", "Vary: *"])
      expect(report({ actualHeaders: "Access-Control-Allow-Origin: https://app.example\n" + vary }).checks.some((row) => row.rule === "vary")).toBe(false);
  });
  it.each(["HTTP/1.1 200 OK", " Bad: folded", "Bad Name: value", "X: x\rY: y", "X: x\u0000", "X: 日本語", "X: x\u007f"])("rejects malformed header blocks: %s", (actualHeaders) => {
    expect(() => report({ actualHeaders })).toThrow("CORS_HEADER");
    expect(() => report({ preflightHeaders: actualHeaders })).toThrow("CORS_HEADER");
  });
  it.each(["CONNECT", "trace", "TRACK", "GET POST", "", "A".repeat(33)])("rejects invalid/forbidden method %s", (method) => {
    expect(() => report({ method })).toThrow("CORS_METHOD");
  });
  it.each(["cookie", "Origin", "Sec-Fetch-Site", "Proxy-Authorization", "X-HTTP-Method-Override", "*"])("rejects unsupported request name %s", (unsafeHeaders) => {
    expect(() => report({ unsafeHeaders })).toThrow("CORS_UNSAFE_HEADERS");
  });
  it("rejects malformed relevant allow lists even when method/header conditions would pass", () => {
    for (const suffix of ["\nAccess-Control-Allow-Methods: \"PUT\"", "\nAccess-Control-Allow-Headers: x:y"])
      expect(() => preflight({ preflightHeaders: complex.preflightHeaders + suffix })).toThrow("CORS_LIST");
  });
  it("bounds bytes, physical lines and list items without partial reports", () => {
    expect(() => report({ actualHeaders: "X:" + "x".repeat(CORS_LIMITS.blockBytes - 1) })).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(report({ actualHeaders: "X:" + "x".repeat(CORS_LIMITS.blockBytes - 2) }).outcome).toBe("blocked");
    expect(() => report({ actualHeaders: "X:" + "é".repeat(CORS_LIMITS.blockBytes / 2) })).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(report({ actualHeaders: "\n".repeat(99) }).outcome).toBe("blocked");
    expect(() => report({ actualHeaders: "\n".repeat(100) })).toThrow("CORS_LINES");
    expect(() => report({ unsafeHeaders: Array(33).fill("x").join(",") })).toThrow("CORS_LIST_LIMIT");
    expect(() => preflight({ preflightHeaders: complex.preflightHeaders + "\nAccess-Control-Allow-Headers: " + Array(129).fill("x").join(",") })).toThrow("CORS_LIST_LIMIT");
    expect(() => report({ origin: "x".repeat(2049) })).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => report({ unsafeHeaders: "x".repeat(2049) })).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
  });
  it("does not echo irrelevant header values or mutate the input", () => {
    const input = { ...simple, actualHeaders: simple.actualHeaders + "\nSet-Cookie: PRIVATE_VALUE\nX-Test: <script>alert(1)</script>" };
    const before = JSON.stringify(input);
    expect(JSON.stringify(inspectCors(input))).not.toMatch(/PRIVATE_VALUE|script/);
    expect(JSON.stringify(input)).toBe(before);
  });
});
