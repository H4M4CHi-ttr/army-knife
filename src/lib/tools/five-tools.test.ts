import { describe, expect, it } from "vite-plus/test";
import {
  generateIdentifier, generateIdentifiers, generateOgTags, generateSecrets,
  inspectIdentifier, inspectJwt, inspectTimestamp,
  type SecretOptions,
} from "./five-tools";

describe("timestamp converter (#3)", () => {
  it("parses offsets and retains exact negative epoch milliseconds", () => {
    const utc = inspectTimestamp("2026-10-12T12:30:00+09:00", "iso", "UTC");
    expect(utc.utc).toBe("2026-10-12T03:30:00.000Z");
    expect(utc.unixMilliseconds).toBe(String(Date.parse(utc.utc)));
    expect(inspectTimestamp("-0.001", "seconds", "UTC")).toMatchObject({
      unixSeconds: "-0.001", unixMilliseconds: "-1",
      utc: "1969-12-31T23:59:59.999Z",
    });
    expect(inspectTimestamp("-1", "milliseconds", "Asia/Tokyo").unixMilliseconds).toBe("-1");
  });
  it("handles post-2038 times and an IANA daylight-saving transition", () => {
    expect(inspectTimestamp("2038-01-19T03:14:08Z", "iso", "UTC").unixSeconds).toBe("2147483648");
    expect(inspectTimestamp("2024-03-10T07:30:00Z", "iso", "America/New_York").zoned)
      .toContain("03:30:00");
    expect(inspectTimestamp("0000-02-29T00:00:00Z", "iso", "UTC").utc).toContain("0000-02-29");
  });
  it("rejects normalized-invalid dates, missing offsets, unit ambiguity and bounds", () => {
    for (const raw of ["2024-02-30T00:00:00Z", "2024-03-10T02:30:00",
      "2024-13-01T00:00:00Z", "2024-12-01T00:00:60Z", "2024-03-01T00:00:00.1234Z"]) {
      expect(() => inspectTimestamp(raw, "iso", "UTC")).toThrow();
    }
    expect(() => inspectTimestamp("1.5", "milliseconds", "UTC")).toThrow();
    expect(() => inspectTimestamp("8640000000000001", "milliseconds", "UTC")).toThrow();
    expect(() => inspectTimestamp("0", "seconds", "Invalid/Timezone")).toThrow();
  });
});

describe("JWT inspector (#17)", () => {
  function b64(json: object): string {
    return btoa(JSON.stringify(json)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  it("displays header, claims and dates without treating them as verified", () => {
    const token = b64({ alg: "none", typ: "JWT" }) + "." +
      b64({ sub: "demo", iat: -1, nbf: 0, exp: 1_000 }) + ".";
    const result = inspectJwt(token, 2_000);
    expect(result.algorithm).toBe("none");
    expect(result.signaturePresent).toBe(false);
    expect(result.expired).toBe(true);
    expect(result.notYetValid).toBe(false);
    expect(result.claimsTimes.map((x) => x.name)).toEqual(["iat", "nbf", "exp"]);
    expect(result.payload).toContain("demo");
    // Real JWS signatures are arbitrary bytes and must not be interpreted as UTF-8.
    const signed = inspectJwt(b64({ alg: "HS256" }) + "." + b64({ sub: "demo" }) + ".____");
    expect(signed.signaturePresent).toBe(true);
  });
  it("rejects invalid JSON, corrupt base64url, non-object claims and oversized input", () => {
    expect(() => inspectJwt("a.b.c")).toThrow();
    expect(() => inspectJwt(b64({ alg: "HS256" }) + "." + b64([1]) + ".")).toThrow();
    expect(() => inspectJwt(b64({}) + "." + b64({}) + ".abc=")).toThrow();
    expect(() => inspectJwt("A".repeat(65_537))).toThrow();
  });
});

describe("UUID v4/v7 and ULID (#21)", () => {
  it("sets UUID versions, variant and 48-bit v7 timestamp correctly", () => {
    const v4 = generateIdentifier("v4", 1_700_000_000_000);
    const v7 = generateIdentifier("v7", 1_700_000_000_000);
    expect(v4).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab]/);
    expect(v7).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/);
    expect(inspectIdentifier(v7).utc).toBe(new Date(1_700_000_000_000).toISOString());
    expect(inspectIdentifier(v4).utc).toBeNull();
  });
  it("encodes ULID time and validates its alphabet", () => {
    const value = generateIdentifier("ulid", 0);
    expect(value).toMatch(/^0{10}[0-9A-HJKMNP-TV-Z]{16}$/);
    expect(inspectIdentifier(value.toLowerCase())).toMatchObject({
      normalized: value, format: "ULID", utc: "1970-01-01T00:00:00.000Z",
    });
    expect(() => inspectIdentifier("8" + value.slice(1))).toThrow(); // overflowed 48-bit time
    expect(() => inspectIdentifier("I" + value.slice(1))).toThrow();
    expect(() => inspectIdentifier("not an identifier")).toThrow();
  });
  it("enforces batch limits", () => {
    expect(generateIdentifiers("v7", 100)).toHaveLength(100);
    expect(() => generateIdentifiers("v7", 101)).toThrow();
    expect(() => generateIdentifiers("v4", 0)).toThrow();
  });
});

describe("passwords and tokens (#22)", () => {
  const base: SecretOptions = {
    mode: "password", length: 24, count: 10, lower: true, upper: true,
    digits: true, symbols: false, exclude: "oO0",
  };
  it("uses secure generated values with each required group and exclusions", () => {
    const result = generateSecrets(base);
    expect(result.values).toHaveLength(10);
    expect(result.estimatedBits).toBeGreaterThan(100);
    for (const value of result.values) {
      expect(value).toHaveLength(24);
      expect(value).toMatch(/[a-z]/);
      expect(value).toMatch(/[A-Z]/);
      expect(value).toMatch(/[1-9]/);
      expect(value).not.toMatch(/[oO0]/);
    }
    expect(new Set(result.values).size).toBe(10);
  });
  it("generates even-length hex, rejects empty groups and strict boundaries", () => {
    expect(generateSecrets({ ...base, mode: "hex", length: 8 }).values[0])
      .toMatch(/^[0-9a-f]{8}$/);
    expect(() => generateSecrets({ ...base, mode: "hex", length: 9 })).toThrow();
    expect(() => generateSecrets({ ...base, lower: false, upper: false, digits: false })).toThrow();
    expect(() => generateSecrets({ ...base, exclude: "0123456789" })).toThrow();
    expect(() => generateSecrets({ ...base, length: 129 })).toThrow();
    expect(() => generateSecrets({ ...base, count: 21 })).toThrow();
  });
});

describe("Open Graph markup (#104)", () => {
  const fields = {
    title: 'Title " & <script>alert(1)</script>', description: "日本語 & test",
    url: "https://example.com/path?a=1&b=2", image: "", locale: "ja_JP",
    type: "website" as const,
  };
  it("escapes HTML attributes and emits local-only tag strings", () => {
    const result = generateOgTags(fields);
    expect(result.host).toBe("example.com");
    expect(result.html).toContain("Title &quot; &amp; &lt;script&gt;");
    expect(result.html).toContain("summary");
    expect(result.html).toContain("og:description");
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("a=1&amp;b=2");
  });
  it("rejects missing required fields, unsafe URLs, credentials and oversize", () => {
    expect(() => generateOgTags({ ...fields, title: "" })).toThrow();
    expect(() => generateOgTags({ ...fields, url: "javascript:alert(1)" })).toThrow();
    expect(() => generateOgTags({ ...fields, url: "https://secret:secret@example.com" })).toThrow();
    expect(() => generateOgTags({ ...fields, title: "x".repeat(201) })).toThrow();
    expect(() => generateOgTags({ ...fields, locale: "../../bad" })).toThrow();
  });
});
