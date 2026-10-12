import { describe, expect, it } from "vite-plus/test";
import { inspectSetCookie, inspectUserAgent, TEXT_INSPECTOR_LIMITS } from "./text-inspectors";
import {
  convertEncoding, FILE_INSPECTOR_LIMITS, generateSri, inspectEncoding, inspectMagic, parseHexBytes,
} from "./file-inspectors";

const ascii = (value: string) => new TextEncoder().encode(value);
const utf16le = (value: string) =>
  Uint8Array.from(Array.from(value).flatMap((char) => [char.charCodeAt(0) & 255, char.charCodeAt(0) >>> 8]));

describe("User-Agent static hints (#65)", () => {
  it("distinguishes Edge, Firefox, Safari, iOS devices and crawlers", () => {
    const edge = inspectUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36 Edg/129.0");
    expect(edge.browser).toBe("Edg/129.0");
    expect(edge.engine).toContain("Blink");
    expect(edge.warnings).toContain("UA_UNTRUSTED");
    expect(inspectUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Gecko/20100101 Firefox/130.0").browser).toBe("Firefox/130.0");
    expect(inspectUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Mobile/15 Safari/604.1").device).toBe("Mobile");
    expect(inspectUserAgent("Googlebot/2.1 (+https://example.test/bot)").bot).toContain("Googlebot");
    expect(inspectUserAgent("MyUnknownAgent").browser).toBe("Unknown");
  });
  it("enforces an exact input cap", () => {
    try {
      inspectUserAgent("a".repeat(TEXT_INSPECTOR_LIMITS.userAgentBytes + 1));
      throw new Error("Expected input validation");
    } catch (error) {
      expect(error).toHaveProperty("code", "INPUT_TOO_LARGE");
    }
  });
});

describe("Set-Cookie static report (#54)", () => {
  it("handles comma-bearing Expires, prefixes, missing flags and repeated attrs", () => {
    const report = inspectSetCookie(
      "Set-Cookie: session=SUPERSECRET; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/; Secure; HttpOnly; SameSite=None\n" +
      "Set-Cookie: __Host-id=abc; Domain=example.test; Path=/; SameSite=None; SameSite=Invalid\n" +
      "Set-Cookie: a=b; Partitioned; Max-Age=nope; Expires=garbage",
    );
    expect(report.cookies).toHaveLength(3);
    expect(report.cookies[0]?.expires).toContain("Wed, 21 Oct");
    expect(JSON.stringify(report)).not.toContain("SUPERSECRET");
    expect(report.cookies[1]?.warnings).toContain("HOST_PREFIX");
    expect(report.cookies[1]?.warnings).toContain("DUPLICATE_ATTRIBUTE");
    expect(report.cookies[2]?.warnings).toEqual(expect.arrayContaining([
      "PARTITIONED_NEEDS_SECURE", "INVALID_MAX_AGE", "INVALID_EXPIRES",
    ]));
  });
  it("does not split on Expires commas or invent cookies from invalid lines", () => {
    expect(inspectSetCookie("a=b; Expires=Mon, 02 Jun 2025 14:20:00 GMT").cookies).toHaveLength(1);
    expect(inspectSetCookie("not a cookie\nSet-Cookie: ok=value").skipped).toBe(1);
    expect(() => inspectSetCookie("x=y\n".repeat(TEXT_INSPECTOR_LIMITS.cookieLines + 1))).toThrowError("TOO_MANY_ROWS");
  });
});

describe("BOM and line-ending inspection (#90)", () => {
  it("classifies UTF-8/UTF-16LE/UTF-16BE and preserves mixed EOL counts", () => {
    const utf8 = inspectEncoding(Uint8Array.from([0xef,0xbb,0xbf,...ascii("a\r\nb\nc\rd")]));
    expect(utf8).toMatchObject({ encoding: "UTF-8", bom: "UTF-8", crlf: 1, lf: 1, cr: 1, valid: true });
    expect(inspectEncoding(Uint8Array.from([0xff,0xfe,...utf16le("ok\n")]))).toMatchObject({
      encoding: "UTF-16LE", bom: "UTF-16LE", valid: true, lf: 1,
    });
    expect(inspectEncoding(Uint8Array.from([0xfe,0xff,0x00,0x41,0x00,0x0a]))).toMatchObject({
      encoding: "UTF-16BE", valid: true, lf: 1,
    });
    expect(inspectEncoding(Uint8Array.from([0xef,0xbb,0xbf]))).toMatchObject({ valid: true, preview: "" });
  });
  it("rejects malformed bytes rather than silently replacing characters", () => {
    expect(inspectEncoding(Uint8Array.from([0xff])).warnings).toContain("INVALID_ENCODING");
    expect(inspectEncoding(Uint8Array.from([0xff,0xfe,0x00,0xd8])).valid).toBe(false);
    expect(() => convertEncoding(Uint8Array.from([0xff]), "lf")).toThrowError("INVALID_ENCODING");
    expect(new TextDecoder().decode(convertEncoding(utf16le("a\r\nb\rc"), "lf"))).toBe("a\nb\nc");
    expect(new TextDecoder().decode(convertEncoding(ascii("a\nb"), "crlf"))).toBe("a\r\nb");
  });
});

describe("magic bytes and extension hints (#88)", () => {
  it("detects supported prefix signatures and warns about disguised file extension", () => {
    expect(inspectMagic(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "file.exe"))
      .toMatchObject({ extension: "exe", warnings: ["EXTENSION_MISMATCH"] });
    expect(inspectMagic(ascii("SQLite format 3\u0000"), "data.db").candidates[0]?.format).toBe("SQLite 3");
    expect(inspectMagic(Uint8Array.from([0x89,0x50,0x4e]), "partial.png").warnings).toContain("UNKNOWN_SIGNATURE");
    expect(inspectMagic(new Uint8Array(), "").warnings).toContain("UNKNOWN_SIGNATURE");
    const png = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
    expect(inspectMagic(png, "file.png", "application/pdf").warnings).toContain("MIME_MISMATCH");
    expect(inspectMagic(png, "file.png", "image/png").warnings).not.toContain("MIME_MISMATCH");
    expect(inspectMagic(png, "file.png", "application/octet-stream").warnings).not.toContain("MIME_MISMATCH");
    expect(inspectMagic(png, "file.png", "").warnings).not.toContain("MIME_MISMATCH");
  });
  it("reports PDF plus ZIP trailer as a possible polyglot rather than safe content", () => {
    const binary = Uint8Array.from([...ascii("%PDF-1.5\n"), ...ascii("PK\u0005\u0006"), ...new Uint8Array(18)]);
    expect(inspectMagic(binary, "sample.pdf").warnings).toContain("MULTIPLE_SIGNATURES");
  });
});

describe("SRI and raw-byte handling (#128)", () => {
  it("uses exact raw bytes including empty input and different line endings", async () => {
    expect((await generateSri(new Uint8Array(), "SHA-256")).integrity)
      .toBe("sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");
    const first = await generateSri(ascii("a\nb"), "SHA-384", true);
    const second = await generateSri(ascii("a\r\nb"), "SHA-384", true);
    expect(first.integrity).not.toBe(second.integrity);
    expect(first.html).toContain('rel="stylesheet"');
    expect(first.html).toContain(first.integrity);
    expect((await generateSri(ascii("abc"), "SHA-512")).integrity).toMatch(/^sha512-[A-Za-z0-9+/]+=*$/);
    expect(parseHexBytes("00 FF 7f")).toEqual(Uint8Array.from([0,255,127]));
    expect(() => parseHexBytes("A")).toThrowError("INVALID_REQUEST");
    expect(() => parseHexBytes("xx")).toThrowError("INVALID_REQUEST");
    expect(() => parseHexBytes("00".repeat(FILE_INSPECTOR_LIMITS.hexCharacters))).toThrowError("INPUT_TOO_LARGE");
  });
  it("enforces the binary size ceiling", () => {
    expect(() => inspectMagic(new Uint8Array(FILE_INSPECTOR_LIMITS.fileBytes + 1))).toThrowError("INPUT_TOO_LARGE");
    expect(() => inspectEncoding(new Uint8Array(FILE_INSPECTOR_LIMITS.fileBytes + 1))).toThrowError("INPUT_TOO_LARGE");
  });
});
