import { describe, expect, it } from "vite-plus/test";
import { inspectIdn, IDN_LIMITS } from "./idn";

describe("IDN domain inspector", () => {
  it.each([
    ["bücher.example", "xn--bcher-kva.example", "bücher.example"],
    ["xn--bcher-kva.example", "xn--bcher-kva.example", "bücher.example"],
    ["例え.テスト", "xn--r8jz45g.xn--zckzah", "例え.テスト"],
    ["🍕.example", "xn--vi8h.example", "🍕.example"],
    ["BÜCHER。ＥＸＡＭＰＬＥ．", "xn--bcher-kva.example.", "bücher.example."],
    ["faß.de", "xn--fa-hia.de", "faß.de"],
    ["e\u0301.example", "xn--9ca.example", "é.example"],
    ["a｡b", "a.b", "a.b"],
  ])("normalizes and decodes %s", (input, ascii, unicode) => {
    const report = inspectIdn(input);
    expect(report).toMatchObject({ input, ascii, unicode, changed: input !== unicode, absolute: ascii.endsWith(".") });
    expect(inspectIdn(ascii).unicode).toBe(unicode);
    expect(inspectIdn(unicode).ascii).toBe(ascii);
    expect(report.labels.map(l => l.unicode).join(".") + (report.absolute ? "." : "")).toBe(unicode);
  });
  it("retains every normalized code point with script labels", () => {
    const report = inspectIdn("🍕.example");
    expect(report.labels[0]).toMatchObject({ ascii: "xn--vi8h", unicode: "🍕", codePoints: [{ character: "🍕", point: "U+1F355", script: "Common" }] });
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });
  it("flags single-script lookalikes, mixtures and unknown scripts conservatively", () => {
    expect(inspectIdn("раураӏ.example").labels[0]!.warnings).toContain("lookalike");
    expect(inspectIdn("pаypal.example").labels[0]!.warnings).toEqual(expect.arrayContaining(["mixed", "lookalike"]));
    expect(inspectIdn("日本語ひらがなカナ.example").labels[0]!.warnings).not.toContain("mixed");
    expect(inspectIdn("日本a.example").labels[0]!.warnings).toContain("mixed");
    expect(inspectIdn("ไทย.example").labels[0]!.warnings).toContain("other");
    expect(inspectIdn("example.test").labels.every(l => l.warnings.length === 0)).toBe(true);
  });
  it.each([
    "", " ", " example.com", "example.com\n", "a\tb", "https://example.com", "a/b", "a\\b", "a?b", "a#b", "a@b", "a:80", "%65xample.com", "a_b.example",
    ".example", "example..com", "example.com..", "-a.example", "a-.example", "xn--.example", "xn--abc-.example", "xn--a.example", "xn--zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz.example",
    "127.0.0.1", "127.1", "0x7f000001", "2130706433", "[::1]", "example.123", "０１２７。０。０。１", "a\u0000b", "a\u202eb.example", "\ud800.example", "\udc00.example",
  ])("rejects malformed or out-of-scope input %j without echoing it", (input) => {
    expect(() => inspectIdn(input)).toThrow();
    try { inspectIdn(input); } catch (e) { expect((e as Error).message).toMatch(/^(IDN_|INPUT_TOO_LARGE)/); }
  });
  it("enforces byte, label and total-domain bounds without truncation", () => {
    expect(IDN_LIMITS.bytes).toBe(2048);
    expect(() => inspectIdn("字".repeat(683))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => inspectIdn("x".repeat(2049))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(inspectIdn("a".repeat(63) + ".test").labels[0]!.ascii).toHaveLength(63);
    expect(() => inspectIdn("a".repeat(64) + ".test")).toThrow("IDN_LIMIT");
    const full = [63, 63, 63, 61].map(n => "a".repeat(n)).join(".");
    expect(full).toHaveLength(253);
    expect(inspectIdn(full + ".").ascii).toBe(full + ".");
    expect(() => inspectIdn(full + "a")).toThrow("IDN_LIMIT");
    expect(inspectIdn(Array(127).fill("a").join(".")).labels).toHaveLength(127);
    expect(() => inspectIdn(Array(128).fill("a").join("."))).toThrow("IDN_LIMIT");
    expect(() => inspectIdn("字".repeat(60) + ".example")).toThrow("IDN_LIMIT");
  });
});
