import { describe, expect, it } from "vite-plus/test";
import { TEXT_CODEC_LIMITS, transformHtmlEntities as html, transformPercentEncoding as percent } from "./text-codecs";

describe("HTML entity conversion (no DOM parsing)", () => {
  it("escapes dangerous markup as plain text, minimally and fully", () => {
    expect(html('<script a="x">&\'</script>', "encode")).toBe("&lt;script a=&quot;x&quot;&gt;&amp;&#39;&lt;/script&gt;");
    expect(html("日本語👩‍💻", "encode", "full")).toBe("&#x65E5;&#x672C;&#x8A9E;&#x1F469;&#x200D;&#x1F4BB;");
  });
  it("decodes valid named/numeric references once, leaving unknown and invalid unchanged", () => {
    expect(html("&amp;lt; &lt; &#x1F600; &#128512; &nbsp; &foo; &#xD800; &#0;", "decode"))
      .toBe("&lt; < 😀 😀 \u00a0 &foo; &#xD800; &#0;");
    expect(html("&lt; &amp", "decode")).toBe("< &amp");
    expect(html("a&b", "encode")).toBe("a&amp;b");
    expect(html("👋", "encode", "full")).toBe("&#x1F44B;");
    expect(html("", "decode")).toBe("");
  });
  it("bounds input and rejects lone UTF-16 surrogates", () => {
    expect(() => html("\ud800", "encode")).toThrowError("CODEC_INVALID_TEXT");
    expect(() => html("a".repeat(TEXT_CODEC_LIMITS.inputBytes + 1), "decode")).toThrowError("INPUT_TOO_LARGE");
  });
});

describe("URL percent encoding modes", () => {
  it("separates component, path, and form rules without changing input URLs", () => {
    expect(percent("A B/日+?", "encode", "component")).toBe("A%20B%2F%E6%97%A5%2B%3F");
    expect(percent("A B/日+?", "encode", "path")).toBe("A%20B/%E6%97%A5%2B%3F");
    expect(percent("a b+c", "encode", "form")).toBe("a+b%2Bc");
    expect(percent("a+b%2Bc", "decode", "form")).toBe("a b+c");
    expect(percent("a+b%2Bc", "decode", "component")).toBe("a+b+c");
    expect(percent("%2520", "decode", "component")).toBe("%20");
  });
  it("refuses incomplete escapes, invalid UTF-8, and lone surrogate input", () => {
    for (const value of ["%", "%Z1", "%E3%81", "%FF"]) {
      expect(() => percent(value, "decode", "component"), value).toThrowError("CODEC_INVALID_TEXT");
    }
    expect(() => percent("\ud800", "encode", "component")).toThrowError("CODEC_INVALID_TEXT");
    expect(() => percent("a".repeat(TEXT_CODEC_LIMITS.inputBytes + 1), "encode", "path")).toThrowError("INPUT_TOO_LARGE");
  });
});
