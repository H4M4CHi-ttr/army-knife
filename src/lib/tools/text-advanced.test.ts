import { describe, expect, it } from "vite-plus/test";
import { analyzeText, transformLiteral, TEXT_ADVANCED_LIMITS } from "./text-advanced";

describe("text statistics and locale-aware transformations", () => {
  it("counts UTF-16, scalar, grapheme and byte units differently", () => {
    const result = analyzeText("👩‍💻", "en", "original");
    expect(result.utf16).toBe(5);
    expect(result.codePoints).toBe(3);
    expect(result.graphemes).toBe(1);
    expect(result.bytes).toBe(11);
    expect(result.words).toBe(0);
    expect(result.lines).toBe(1);
  });
  it("handles empty input and counts the trailing blank line", () => {
    const empty = analyzeText("", "ja", "original");
    expect(empty.lines).toBe(0);
    expect(empty.bytes).toBe(0);
    expect(analyzeText("A\r\nB\n", "en", "original").lines).toBe(3);
  });
  it("honors Turkish locale and separately transforms title/camel/snake", () => {
    expect(analyzeText("istanbul ı", "tr", "upper").transformed).toBe("İSTANBUL I");
    expect(analyzeText("hello WORLD", "en", "title").transformed).toBe("Hello World");
    expect(analyzeText("hello world", "en", "camel").transformed).toBe("helloWorld");
    expect(analyzeText("hello world", "en", "snake").transformed).toBe("hello_world");
  });
  it("rejects unpaired surrogates and oversized input", () => {
    expect(() => analyzeText("\ud800", "en", "original")).toThrow();
    expect(() => analyzeText("a".repeat(TEXT_ADVANCED_LIMITS.statsBytes + 1), "en", "upper")).toThrow();
  });
});

describe("strict single-pass literal converters", () => {
  it.each(["json", "js"] as const)("round-trips a safe %s string", (format) => {
    const value = "Line\n\"quoted\" 👋 \t";
    expect(transformLiteral(transformLiteral(value, format, "encode"), format, "decode")).toBe(value);
  });
  it("supports C's defined string escapes, and rejects unknown ones", () => {
    const value = "a\nb\t\\";
    expect(transformLiteral(transformLiteral(value, "c", "encode"), "c", "decode")).toBe(value);
    expect(transformLiteral('"\\u0041\\x42"', "c", "decode")).toBe("AB");
    expect(() => transformLiteral('"\\q"', "c", "decode")).toThrow();
  });
  it("supports XML's five builtins and numeric references but not unknown entities", () => {
    expect(transformLiteral("<x a='&'>", "xml", "encode")).toBe("&lt;x a=&apos;&amp;&apos;&gt;");
    expect(transformLiteral("&lt;&amp;&#x1F44B;", "xml", "decode")).toBe("<&👋");
    expect(() => transformLiteral("&xxe;", "xml", "decode")).toThrow();
    expect(() => transformLiteral("&#0;", "xml", "decode")).toThrow();
  });
  it("retains CSV quoting and standard SQL single quotes", () => {
    expect(transformLiteral('hello,"friend"', "csv", "encode")).toBe('"hello,""friend"""');
    expect(transformLiteral('"hello,""friend"""', "csv", "decode")).toBe('hello,"friend"');
    expect(transformLiteral("It's fine", "sql", "encode")).toBe("'It''s fine'");
    expect(transformLiteral("'It''s fine'", "sql", "decode")).toBe("It's fine");
    expect(() => transformLiteral("'x\\ny'", "sql", "decode")).not.toThrow();
  });
  it("rejects arrays, invalid escapes, malformed quoting and surrogate escapes", () => {
    expect(() => transformLiteral("[]", "json", "decode")).toThrow();
    expect(() => transformLiteral('"\\uD800"', "json", "decode")).toThrow();
    expect(() => transformLiteral('"x', "c", "decode")).toThrow();
    expect(() => transformLiteral('"not,valid"', "csv", "decode")).not.toThrow();
    expect(() => transformLiteral("a,b", "csv", "decode")).toThrow();
  });
});
