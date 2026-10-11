import { describe, expect, it } from "vite-plus/test";
import { compareJson, formatJson, JSON_LIMITS, parseJsonSafely } from "./json";

describe("bounded JSON parsing and structural comparison", () => {
  it("ignores object key order and equivalent numeric spellings", () => {
    const result = compareJson(
      '{"b":1.00,"a":[null,true,"日本語"]}',
      '{"a":[null,true,"日本語"],"b":1e0}',
    );
    expect(result).toMatchObject({ equal: true, changes: [], truncated: false });
  });

  it("preserves array order and distinguishes scalar types", () => {
    const result = compareJson('[1,"2",null]', '["2",1,false]');
    expect(result.changes).toEqual([
      { kind: "replace", path: "/0", before: 1, after: "2" },
      { kind: "replace", path: "/1", before: "2", after: 1 },
      { kind: "replace", path: "/2", before: null, after: false },
    ]);
    expect(result.summary.replaced).toBe(3);
  });

  it("escapes JSON Pointer keys including a real empty key", () => {
    const result = compareJson('{"a/b":{"~key":1},"":false}', '{"a/b":{"~key":2},"":true}');
    expect(result.changes.map((change) => change.path)).toEqual(["/", "/a~1b/~0key"]);
    expect(compareJson("null", "[]").changes[0]?.path).toBe("");
  });

  it("reports additions and removes array tails in descending order", () => {
    expect(compareJson("[1,2,3]", "[1]").changes).toEqual([
      { kind: "remove", path: "/2", before: 3 },
      { kind: "remove", path: "/1", before: 2 },
    ]);
    expect(compareJson("{}", '{"new":false}').changes).toEqual([
      { kind: "add", path: "/new", after: false },
    ]);
  });

  it("treats prototype-looking keys as plain data", () => {
    const parsed = parseJsonSafely('{"__proto__":{"polluted":true},"constructor":1}');
    expect(Object.getPrototypeOf(parsed)).toBe(null);
    expect(Object.hasOwn(parsed as object, "__proto__")).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(compareJson('{"__proto__":1}', '{"__proto__":2}').changes).toEqual([
      { kind: "replace", path: "/__proto__", before: 1, after: 2 },
    ]);
  });

  it.each([
    "9007199254740992",
    "-9007199254740992",
    "9007199254740991.1",
    "0.10000000000000001",
    "1e400",
    "1e-400",
    "1.23456789012345678",
    "1000000000000000100",
  ])("rejects a number whose precision cannot be preserved: %s", (input) => {
    expect(() => parseJsonSafely(input)).toThrow(
      expect.objectContaining({ code: "JSON_NUMBER_PRECISION" }),
    );
  });

  it("accepts normal decimals and leaves large digits in strings untouched", () => {
    expect(parseJsonSafely("0.10")).toBe(0.1);
    expect(parseJsonSafely("1.2300e2")).toBe(123);
    expect(parseJsonSafely("9007199254740991")).toBe(Number.MAX_SAFE_INTEGER);
    expect(parseJsonSafely('"9007199254740992"')).toBe("9007199254740992");
    expect(compareJson("-0", "0").equal).toBe(true);
  });

  it.each([
    "",
    "[1,]",
    '{"a":1,}',
    "{a:1}",
    "truefalse",
    "01",
    "+1",
    ".1",
    "1.",
    "NaN",
    "Infinity",
    '"\n"',
    "\u00a0null",
  ])("rejects invalid JSON syntax: %s", (input) => {
    expect(() => parseJsonSafely(input)).toThrow();
  });

  it("rejects duplicate keys after decoding escaped names", () => {
    expect(() => parseJsonSafely('{"a":1,"\\u0061":2}')).toThrow(
      expect.objectContaining({ code: "JSON_DUPLICATE_KEY" }),
    );
  });

  it("enforces depth, node, and UTF-8 byte limits before diffing", () => {
    expect(() => parseJsonSafely(`${"[".repeat(64)}0${"]".repeat(64)}`)).not.toThrow();
    expect(() => parseJsonSafely(`${"[".repeat(65)}0${"]".repeat(65)}`)).toThrow(
      expect.objectContaining({ code: "JSON_DEPTH_LIMIT" }),
    );
    expect(() => parseJsonSafely(JSON.stringify(Array(JSON_LIMITS.nodes).fill(0)))).toThrow(
      expect.objectContaining({ code: "JSON_NODE_LIMIT" }),
    );
    expect(() => parseJsonSafely(`"${"あ".repeat(180_000)}"`)).toThrow(
      expect.objectContaining({ code: "INPUT_TOO_LARGE" }),
    );
  });

  it("marks result truncation instead of claiming a complete list of changes", () => {
    const result = compareJson(
      JSON.stringify(Array(JSON_LIMITS.changes + 1).fill(0)),
      JSON.stringify(Array(JSON_LIMITS.changes + 1).fill(1)),
    );
    expect(result).toMatchObject({ equal: false, truncated: true });
    expect(result.changes).toHaveLength(JSON_LIMITS.changes);
    expect(result.summary.replaced).toBe(JSON_LIMITS.changes);
  });

  it("formats without executing or dropping prototype keys", () => {
    expect(formatJson('{"__proto__":null,"text":"a\\tb"}', 2)).toBe(
      '{\n  "__proto__": null,\n  "text": "a\\tb"\n}',
    );
    expect(() => formatJson("{}", 20)).toThrow();
  });
});
