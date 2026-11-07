import { describe, expect, it } from "vite-plus/test";
import { MERGE_PATCH_LIMITS, previewJsonMergePatch } from "./json-merge-patch";

const merged = (target: string, patch: string) => JSON.parse(previewJsonMergePatch(target, patch).json);
const error = (code: string) => expect.objectContaining({ code });
const nested = (depth: number, value = "0"): string => '{"a":'.repeat(depth) + value + "}".repeat(depth);

describe("RFC 7396 JSON Merge Patch preview", () => {
  it.each([
    ['{"a":"b"}', '{"a":"c"}', { a: "c" }],
    ['{"a":"b"}', '{"b":"c"}', { a: "b", b: "c" }],
    ['{"a":"b"}', '{"a":null}', {}],
    ['{"a":"b","b":"c"}', '{"a":null}', { b: "c" }],
    ['{"a":["b"]}', '{"a":"c"}', { a: "c" }],
    ['{"a":"c"}', '{"a":["b"]}', { a: ["b"] }],
    ['{"a":{"b":"c"}}', '{"a":{"b":"d","c":null}}', { a: { b: "d" } }],
    ['{"a":[{"b":"c"}]}', '{"a":[1]}', { a: [1] }],
    ['["a","b"]', '["c","d"]', ["c", "d"]],
    ['{"a":"b"}', '["c"]', ["c"]],
    ['{"a":"foo"}', 'null', null],
    ['{"a":"foo"}', '"bar"', "bar"],
    ['{"e":null}', '{"a":1}', { e: null, a: 1 }],
    ['[1,2]', '{"a":"b","c":null}', { a: "b" }],
    ['{}', '{"a":{"bb":{"ccc":null}}}', { a: { bb: {} } }],
  ])("applies target %s with patch %s", (target, patch, expected) => {
    expect(merged(target, patch)).toEqual(expected);
  });
  it.each(["false", "0", '""', "[]", "null"])("keeps root replacement %s visible and exportable", patch => {
    expect(previewJsonMergePatch('{"keep":true}', patch)).toMatchObject({ mode: "replace", json: patch, document: JSON.parse(patch) });
  });
  it("retains unmentioned members and treats empty object patches as merges", () => {
    expect(merged('{"a":null,"b":[1,null]}', "{}")).toEqual({ a: null, b: [1, null] });
    for (const target of ["null", "false", "2", '"s"', "[]"]) expect(merged(target, "{}")).toEqual({});
    expect(previewJsonMergePatch("{}", "{}").mode).toBe("merge");
  });
  it("deletes missing keys harmlessly and never treats arrays as object patches", () => {
    expect(merged('{"a":1}', '{"missing":null}')).toEqual({ a: 1 });
    expect(merged('{"a":[1,2,3]}', '{"a":{"1":null}}')).toEqual({ a: {} });
    expect(merged('{"a":[1,2,3]}', '{"a":[null]}')).toEqual({ a: [null] });
  });
  it("handles prototype names as ordinary own data and preserves independent branches", () => {
    const report = previewJsonMergePatch('{"__proto__":{"keep":1},"constructor":2,"unchanged":{"x":3}}', '{"__proto__":{"add":4},"constructor":null,"prototype":5}');
    expect(report.json).toContain('"__proto__"');
    expect(JSON.parse(report.json)).toEqual(JSON.parse('{"__proto__":{"keep":1,"add":4},"unchanged":{"x":3},"prototype":5}'));
    expect(Object.getPrototypeOf(report.document)).toBeNull();
    expect(Object.getPrototypeOf((report.document as Record<string, unknown>).__proto__)).toBeNull();
    expect(Object.prototype).not.toHaveProperty("add");
    expect(merged('{"__proto__":1}', '{"__proto__":null}')).toEqual({});
  });
  it("normalizes formatting and supported number spelling without losing decimal digits", () => {
    expect(merged('{"safe":9007199254740991,"decimal":0.1}', '{"other":1e2,"zero":-0}')).toEqual({ safe: 9007199254740991, decimal: 0.1, other: 100, zero: 0 });
    expect(previewJsonMergePatch("0", "1.00").json).toBe("1");
  });
  it.each(["9007199254740993", "0.10000000000000001", "1e999", "1e-999", "9007199254740991.1"])("rejects precision loss in either input: %s", value => {
    expect(() => merged(value, "0")).toThrow(error("JSON_NUMBER_PRECISION"));
    expect(() => merged("0", value)).toThrow(error("JSON_NUMBER_PRECISION"));
  });
  it.each(['{"a":1,"a":2}', '{"a":1,"\\u0061":2}'])("rejects duplicate decoded keys in either input", value => {
    expect(() => merged(value, "{}")).toThrow(error("JSON_DUPLICATE_KEY"));
    expect(() => merged("{}", value)).toThrow(error("JSON_DUPLICATE_KEY"));
  });
  it.each(["", " ", "undefined", "{", '[1,]', "{} trailing", '\uFEFF{}'])("rejects malformed input without data-bearing errors", input => {
    expect(() => merged(input, "{}")).toThrow(error("JSON_INVALID"));
    expect(() => merged("{}", input)).toThrow(error("JSON_INVALID"));
  });
  it("checks raw UTF-8 bounds before trimming, including multibyte strings", () => {
    const exact = "0" + " ".repeat(MERGE_PATCH_LIMITS.inputBytes - 1);
    expect(merged(exact, exact)).toBe(0);
    expect(() => merged(exact + " ", "{}")).toThrow(error("INPUT_TOO_LARGE"));
    expect(() => merged("{}", exact + " ")).toThrow(error("INPUT_TOO_LARGE"));
    const multibyte = '"' + "あ".repeat(5460) + '"';
    expect(merged("null", multibyte)).toHaveLength(5460);
    expect(() => merged("null", multibyte + "   ")).toThrow(error("INPUT_TOO_LARGE"));
  });
  it("enforces exact depth and node limits in both inputs before any replacement", () => {
    expect(merged(nested(32), "{}")).toBeTruthy();
    expect(merged("null", nested(32))).toBeTruthy();
    expect(() => merged(nested(33), "null")).toThrow(error("MERGE_PATCH_DEPTH"));
    expect(() => merged("null", nested(33))).toThrow(error("MERGE_PATCH_DEPTH"));
    const array = (n: number) => `[${Array(n).fill(0).join(",")}]`;
    expect(merged(array(1999), "{}")).toEqual({});
    expect(merged("null", array(1999))).toHaveLength(1999);
    expect(() => merged(array(2000), "null")).toThrow(error("MERGE_PATCH_NODES"));
    expect(() => merged("null", array(2000))).toThrow(error("MERGE_PATCH_NODES"));
  });
  it("rejects oversized formatted output instead of exporting a truncated document", () => {
    const target = nested(31, JSON.stringify(Object.fromEntries(Array.from({ length: 950 }, (_, i) => [`k${i}`, 0]))));
    const patch = nested(31, JSON.stringify(Object.fromEntries(Array.from({ length: 950 }, (_, i) => [`p${i}`, 0]))));
    expect(() => merged(target, patch)).toThrow(error("MERGE_PATCH_OUTPUT"));
  });
  it("accepts exactly 128 KiB of formatted output and rejects one byte more", () => {
    const members = (prefix: string) => Object.fromEntries(Array.from({ length: 800 }, (_, i) => [`${prefix}${i}`, 0]));
    const target = nested(31, JSON.stringify(members("a")));
    const changes = { ...members("b"), padding: "" };
    const baseline = previewJsonMergePatch(target, nested(31, JSON.stringify(changes))).json.length;
    changes.padding = "x".repeat(MERGE_PATCH_LIMITS.outputBytes - baseline);
    const exact = nested(31, JSON.stringify(changes));
    expect(previewJsonMergePatch(target, exact).json).toHaveLength(MERGE_PATCH_LIMITS.outputBytes);
    changes.padding += "x";
    expect(() => merged(target, nested(31, JSON.stringify(changes)))).toThrow(error("MERGE_PATCH_OUTPUT"));
  });
  it("is repeatable and leaves input strings intact", () => {
    const target = '{"a":{"x":1},"b":[2]}', patch = '{"a":{"x":null,"y":3}}';
    const first = previewJsonMergePatch(target, patch);
    expect(previewJsonMergePatch(target, patch)).toEqual(first);
    expect(target).toBe('{"a":{"x":1},"b":[2]}');
    expect(patch).toBe('{"a":{"x":null,"y":3}}');
    expect(merged(first.json, patch)).toEqual(first.document);
  });
});
