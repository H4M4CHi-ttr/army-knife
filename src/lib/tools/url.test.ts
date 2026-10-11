import { describe, expect, it } from "vite-plus/test";
import { analyzeUrl, editUrlQuery, URL_LIMITS } from "./url";

describe("local URL structure and query editing", () => {
  it("uses the WHATWG parser for host case, IDNs, default ports and dot segments", () => {
    const result = analyzeUrl("HTTPS://例え.テスト:443/a/../b?q=東京#section");
    expect(result).toMatchObject({
      scheme: "https",
      origin: "https://xn--r8jz45g.xn--zckzah",
      hostname: "xn--r8jz45g.xn--zckzah",
      port: "",
      pathname: "/b",
      fragment: "section",
      hasCredentials: false,
      normalized: true,
    });
    expect(result.query).toEqual([{ key: "q", value: "東京", hasEquals: true }]);
    expect(analyzeUrl("https://example.test/?q=one two").query[0]?.value).toBe("one two");
  });

  it("keeps IPv6, custom database schemes and encoded credential fields local", () => {
    const result = analyzeUrl("postgresql://user:p%40ss@[2001:db8::1]:5432/sample?sslmode=require");
    expect(result).toMatchObject({
      scheme: "postgresql",
      origin: null,
      hostname: "[2001:db8::1]",
      port: "5432",
      username: "user",
      password: "p%40ss",
      pathname: "/sample",
      hasCredentials: true,
    });
  });

  it("preserves duplicate entry order, flags, empty keys and plus/space semantics", () => {
    const result = analyzeUrl("https://example.test/?a=one+two&a=%2B&flag&empty=&=value&&");
    expect(result.query).toEqual([
      { key: "a", value: "one two", hasEquals: true },
      { key: "a", value: "+", hasEquals: true },
      { key: "flag", value: "", hasEquals: false },
      { key: "empty", value: "", hasEquals: true },
      { key: "", value: "value", hasEquals: true },
    ]);
    expect(result.duplicateKeys).toEqual([{ key: "a", count: 2 }]);
  });

  it("serializes edited query values without treating delimiters as structure", () => {
    const result = editUrlQuery("https://example.test/path?old=1#fragment", [
      { key: "a&b", value: "+ /東京", hasEquals: true },
      { key: "a&b", value: "~", hasEquals: true },
      { key: "flag", value: "", hasEquals: false },
    ]);
    expect(result).toBe(
      "https://example.test/path?a%26b=%2B+%2F%E6%9D%B1%E4%BA%AC&a%26b=%7E&flag#fragment",
    );
    expect(editUrlQuery(result, analyzeUrl(result).query)).toBe(result);
    expect(editUrlQuery(result, [])).toBe("https://example.test/path#fragment");
  });

  it.each([
    "https://example.test/?x=%",
    "https://example.test/?x=%GG",
    "https://example.test/?x=%C3%28",
    "https://example.test/?%FF=a",
  ])("rejects lossy query decoding: %s", (input) => {
    expect(() => analyzeUrl(input)).toThrow(
      expect.objectContaining({ code: "URL_QUERY_ENCODING" }),
    );
  });

  it.each([
    "relative/path",
    "//example.test/",
    "mailto:user@example.test",
    "file:///tmp/private",
    "https://",
    "https://exa mple.test/",
    "https://example.test/a\nb",
    "https://example.test:99999/",
  ])("rejects malformed, relative or opaque input: %s", (input) => {
    expect(() => analyzeUrl(input)).toThrow(expect.objectContaining({ code: "URL_INVALID" }));
  });

  it("rejects unpaired UTF-16 instead of replacing data", () => {
    expect(() => analyzeUrl("https://example.test/?x=\uD800")).toThrow(
      expect.objectContaining({ code: "URL_INVALID_UNICODE" }),
    );
    expect(() =>
      editUrlQuery("https://example.test/", [{ key: "x", value: "\uDC00", hasEquals: true }]),
    ).toThrow(expect.objectContaining({ code: "URL_INVALID_UNICODE" }));
    expect(analyzeUrl("https://example.test/?x=😀").query[0]?.value).toBe("😀");
  });

  it("enforces query-item and UTF-8 input/output budgets", () => {
    const entries = Array.from({ length: URL_LIMITS.queryItems }, (_, index) => ({
      key: "x",
      value: String(index),
      hasEquals: true,
    }));
    const full = editUrlQuery("https://example.test/", entries);
    expect(analyzeUrl(full).query).toHaveLength(URL_LIMITS.queryItems);
    expect(() => analyzeUrl(`${full}&one=more`)).toThrow(
      expect.objectContaining({ code: "URL_TOO_MANY_QUERY_ITEMS" }),
    );
    expect(() => editUrlQuery(full, [...entries, entries[0]!])).toThrow(
      expect.objectContaining({ code: "URL_TOO_MANY_QUERY_ITEMS" }),
    );
    expect(() => analyzeUrl(`https://example.test/?x=${"あ".repeat(6_000)}`)).toThrow(
      expect.objectContaining({ code: "INPUT_TOO_LARGE" }),
    );
    expect(() =>
      editUrlQuery(full, [{ key: "x", value: "あ".repeat(2_000), hasEquals: true }]),
    ).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
  });

  it("rejects an ambiguous flag with a value", () => {
    expect(() =>
      editUrlQuery("https://example.test/", [{ key: "flag", value: "lost", hasEquals: false }]),
    ).toThrow(expect.objectContaining({ code: "URL_QUERY_ITEM_INVALID" }));
    expect(() =>
      editUrlQuery("https://example.test/", [{ key: "", value: "", hasEquals: false }]),
    ).toThrow(expect.objectContaining({ code: "URL_QUERY_ITEM_INVALID" }));
  });

  it("has stable output and treats prototype-like query keys as data", () => {
    const input = "https://example.test/?__proto__=safe&constructor=value";
    expect(analyzeUrl(input)).toEqual(analyzeUrl(input));
    expect(analyzeUrl(input).normalized).toBe(false);
    expect(analyzeUrl(input).query[0]?.key).toBe("__proto__");
    expect(editUrlQuery(input, analyzeUrl(input).query)).toBe(input);
  });
});
