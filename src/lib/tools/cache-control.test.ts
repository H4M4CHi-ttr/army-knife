import { describe, expect, it } from "vite-plus/test";
import { CACHE_CONTROL_LIMITS, inspectCacheControl } from "./cache-control";

describe("response Cache-Control inspection", () => {
  it("preserves order, normalizes names and keeps exact seconds above Number precision", () => {
    const result = inspectCacheControl("PUBLIC, max-age=00060, s-maxage=9007199254740993, immutable");
    expect(result.directives.map((row) => [row.name, row.value, row.seconds, row.known, row.notes])).toEqual([
      ["public", null, null, true, []], ["max-age", "00060", "60", true, []],
      ["s-maxage", "9007199254740993", "9007199254740993", true, []], ["immutable", null, null, true, []],
    ]);
    expect(result.warnings).toEqual([]);
  });
  it("combines repeated field lines without splitting commas or escaped quotes inside strings", () => {
    const result = inspectCacheControl('Cache-Control: private="Set-Cookie, X-Secret"\r\ncache-control: no-cache="ETag", x-note="a, b\\\"c\\\\d"');
    expect(result.directives.map((row) => [row.name, row.value])).toEqual([
      ["private", "Set-Cookie, X-Secret"], ["no-cache", "ETag"], ["x-note", 'a, b"c\\d'],
    ]);
    expect(result.directives[2]!.notes).toEqual(["extension"]);
  });
  it("marks every duplicate, including case differences and repeated fields", () => {
    const result = inspectCacheControl("Cache-Control: max-age=60\nCache-Control: MAX-AGE=120, no-store, no-store");
    expect(result.directives.map((row) => row.notes)).toEqual(Array(4).fill(["duplicate"]));
  });
  it.each(["max-age", "s-maxage", "stale-if-error", "stale-while-revalidate"])("checks exact %s arguments", (name) => {
    expect(inspectCacheControl(`${name}="0000"`).directives[0]).toMatchObject({ seconds: "0", notes: ["quoted-seconds"] });
    for (const suffix of ["", "=-1", "=1.5", "=oops", '=""', '=" 60"']) {
      expect(inspectCacheControl(name + suffix).directives[0]).toMatchObject({ seconds: null, notes: ["invalid-argument"] });
    }
  });
  it.each(["private", "no-cache"])("distinguishes bare and qualified %s", (name) => {
    expect(inspectCacheControl(name).directives[0]!.notes).toEqual([]);
    expect(inspectCacheControl(`${name}="Set-Cookie, ETag"`).directives[0]!.notes).toEqual([]);
    expect(inspectCacheControl(`${name}=ETag`).directives[0]!.notes).toEqual(["unquoted-fields"]);
    expect(inspectCacheControl(`${name}="bad field"`).directives[0]!.notes).toEqual(["invalid-argument"]);
    expect(inspectCacheControl(`${name}=""`).directives[0]!.notes).toEqual(["invalid-argument"]);
  });
  it("retains unknown extensions and warns about unexpected flag arguments", () => {
    expect(inspectCacheControl("x-demo=hello, immutable=1, no-store=yes").directives.map((row) => row.notes))
      .toEqual([["extension"], ["unexpected-argument"], ["unexpected-argument"]]);
    expect(inspectCacheControl("__proto__=safe, constructor=also-safe").directives.every((row) => !row.known)).toBe(true);
    expect({}).not.toHaveProperty("safe");
  });
  it("warns only about unqualified private with public", () => {
    expect(inspectCacheControl("private, public").warnings).toEqual(["private-public"]);
    expect(inspectCacheControl('private="Set-Cookie", public').warnings).toEqual([]);
  });
  it("accepts bounded empty list elements and optional whitespace between members", () => {
    expect(inspectCacheControl(" , public,\t , max-age=60, ").directives).toHaveLength(2);
  });
  it.each(["", " \t", ", ,", "Cache-Control: \nCache-Control:"])("rejects empty input %j", (input) => {
    expect(() => inspectCacheControl(input)).toThrow("CACHE_CONTROL_EMPTY");
  });
  it.each(['max-age="60', 'x="a\\"', 'x="a"junk', "max-age=", "x==y", "max-age =60", "x=two words", 'x="line\nfeed"', "no-store; public", 'x="\u007f"', 'x="\u0100"', "x=\u0000"])("rejects malformed syntax without a partial report: %j", (input) => {
    expect(() => inspectCacheControl(input)).toThrow();
  });
  it.each(["Cache-Control: public\nETag: secret", "public\nmax-age=60", "HTTP/1.1 200 OK\nCache-Control: public", "Cache-Control: public\rCache-Control: private"])("rejects other headers, raw multiline values and obsolete folding: %j", (input) => {
    expect(() => inspectCacheControl(input)).toThrow();
  });
  it.each(["\n ", "\n\t", "\r\n ", "\r\n\t"])("rejects an indented continuation rather than treating it as another field: %j", (separator) => {
    expect(() => inspectCacheControl(`Cache-Control: public${separator}Cache-Control: private`)).toThrow("CACHE_CONTROL_HEADERS");
  });
  it("enforces byte, physical line, directive, name and decoded value limits", () => {
    expect(() => inspectCacheControl("x=" + "a".repeat(CACHE_CONTROL_LIMITS.bytes))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => inspectCacheControl('x="' + "é".repeat(CACHE_CONTROL_LIMITS.bytes / 2) + '"')).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => inspectCacheControl("Cache-Control: public\n".repeat(CACHE_CONTROL_LIMITS.lines + 1))).toThrow("CACHE_CONTROL_LIMIT");
    expect(inspectCacheControl(Array(CACHE_CONTROL_LIMITS.directives).fill("public").join(",")).directives).toHaveLength(CACHE_CONTROL_LIMITS.directives);
    expect(() => inspectCacheControl(Array(CACHE_CONTROL_LIMITS.directives + 1).fill("public").join(","))).toThrow("CACHE_CONTROL_LIMIT");
    expect(inspectCacheControl("x".repeat(CACHE_CONTROL_LIMITS.nameCharacters)).directives).toHaveLength(1);
    expect(() => inspectCacheControl("x".repeat(CACHE_CONTROL_LIMITS.nameCharacters + 1))).toThrow("CACHE_CONTROL_LIMIT");
    expect(inspectCacheControl('x="' + "a".repeat(CACHE_CONTROL_LIMITS.valueCharacters) + '"').directives[0]!.value).toHaveLength(CACHE_CONTROL_LIMITS.valueCharacters);
    expect(() => inspectCacheControl('x="' + "a".repeat(CACHE_CONTROL_LIMITS.valueCharacters + 1) + '"')).toThrow("CACHE_CONTROL_LIMIT");
  });
  it("uses stable errors that never echo private input", () => {
    const marker = "PRIVATE_CACHE_CONTROL_7261";
    try { inspectCacheControl(`x="${marker}`); expect.fail("expected rejection"); }
    catch (error) { expect(String(error)).not.toContain(marker); }
  });
});
