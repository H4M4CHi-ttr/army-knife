import { describe, expect, it } from "vite-plus/test";
import { convertColor, inspectConflicts, lookupReference, INSPECTOR_LIMITS } from "./inspectors";

describe("bundled offline HTTP/MIME reference", () => {
  it("finds 404 with its status category and a content type with parameters", () => {
    expect(lookupReference("404", "status").entries[0]).toMatchObject({
      value: "404", title: "Not Found", category: "4xx",
    });
    expect(lookupReference("application/json; charset=utf-8", "mime").entries[0]?.value).toBe("application/json");
    expect(lookupReference("not-a-real-status", "status").total).toBe(0);
  });
  it("bounds query length and output without external lookup", () => {
    expect(lookupReference("", "status").entries.length).toBeLessThanOrEqual(20);
    expect(lookupReference("", "status").truncated).toBe(true);
    expect(() => lookupReference("x".repeat(129), "mime")).toThrow();
    expect(() => lookupReference("a\nb", "mime")).toThrow();
  });
});

const diff3 = "before\n<<<<<<< HEAD\nours\n||||||| base\nancestor\n=======\ntheirs\n>>>>>>> branch\nafter";
describe("merge/diff3 conflict inspector", () => {
  it("extracts both sides, ancestor and source locations without picking a winner", () => {
    const result = inspectConflicts(diff3);
    expect(result.diagnostics).toEqual([]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toMatchObject({
      start: 2, end: 8, ours: "ours", base: "ancestor", theirs: "theirs", before: "before", after: "after",
    });
  });
  it("detects incomplete, stray, and nested markers", () => {
    expect(inspectConflicts("=======\n>>>>>>> branch").diagnostics.map((d) => d.code)).toEqual(["stray","stray"]);
    expect(inspectConflicts("<<<<<<< HEAD\nmine").diagnostics.at(-1)?.code).toBe("incomplete");
    const nested = inspectConflicts("<<<<<<< HEAD\n<<<<<<< other\n=======\ny\n>>>>>>> branch");
    expect(nested.diagnostics.some((d) => d.code === "nested")).toBe(true);
    expect(nested.conflicts).toHaveLength(0);
  });
  it("protects against oversized or too many conflicts", () => {
    expect(() => inspectConflicts("x".repeat(INSPECTOR_LIMITS.conflictBytes+1))).toThrow();
    const sample = "<<<<<<< a\nx\n=======\ny\n>>>>>>> b";
    expect(() => inspectConflicts(Array.from({length:33},()=>sample).join("\n"))).toThrow();
  });
});

describe("alpha-aware sRGB color conversion", () => {
  it("handles hex, RGB, HSL and HSV input", () => {
    expect(convertColor("#3698").hex).toBe("#33669988");
    expect(convertColor("#33669980").rgb).toBe("rgb(51 102 153 / 0.502)");
    expect(convertColor("rgb(51 102 153 / 50%)").hex).toBe("#33669980");
    expect(convertColor("hsl(210deg 50% 40% / 0.5)").hex).toBe("#33669980");
    expect(convertColor("hsv(210deg 66.6667% 60% / 50%)").hex).toBe("#33669980");
  });
  it("handles achromatic hue, bounds, and rejects invalid CSS", () => {
    expect(convertColor("#000").hex).toBe("#000000FF");
    expect(convertColor("#fff").hex).toBe("#FFFFFFFF");
    expect(convertColor("hsl(0 0% 50%)").hsl).toContain("0deg 0%");
    for (const invalid of ["red", "#ab", "rgb(256 0 0)", "rgb(-1 0 0)", "hsl(0 100% 101%)", "rgb(0 0 0 / 110%)"])
      expect(() => convertColor(invalid), invalid).toThrow();
    expect(() => convertColor("x".repeat(INSPECTOR_LIMITS.colorChars+1))).toThrow();
  });
});
