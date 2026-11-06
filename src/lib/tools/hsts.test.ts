import { describe, expect, it } from "vite-plus/test";
import { inspectHsts } from "./hsts";

describe("recorded HSTS field inspection", () => {
  it("extracts RFC examples and exact duration without browser policy claims", () => {
    expect(inspectHsts("max-age=31536000; includeSubDomains; preload")).toEqual({
      maxAgeSeconds: "31536000", duration: { days: "365", hours: 0, minutes: 0, seconds: 0 },
      operation: "declare", includeSubDomains: true, preload: true, emptySlots: 0,
      directives: [
        { name: "max-age", value: "31536000", recognized: true },
        { name: "includeSubDomains", value: null, recognized: true },
        { name: "preload", value: null, recognized: false },
      ],
    });
    expect(inspectHsts("max-age=15768000")).toMatchObject({
      duration: { days: "182", hours: 12, minutes: 0, seconds: 0 }, includeSubDomains: false, preload: false,
    });
    expect(inspectHsts("max-age=90061").duration).toEqual({ days: "1", hours: 1, minutes: 1, seconds: 1 });
  });
  it("normalizes only names for comparison and preserves opaque source order", () => {
    const report = inspectHsts(' ; IncLUdeSubDomains ; MaX-aGe = "00060"; __proto__=safe; x; empty=""; PRELOAD=other;; ');
    expect(report).toMatchObject({ maxAgeSeconds: "60", operation: "declare", includeSubDomains: true, preload: false, emptySlots: 3 });
    expect(report.directives).toEqual([
      { name: "IncLUdeSubDomains", value: null, recognized: true },
      { name: "MaX-aGe", value: "00060", recognized: true },
      { name: "__proto__", value: "safe", recognized: false },
      { name: "x", value: null, recognized: false },
      { name: "empty", value: "", recognized: false },
      { name: "PRELOAD", value: "other", recognized: false },
    ]);
  });
  it("keeps quoted delimiters inert and unescapes quoted pairs exactly once", () => {
    const report = inspectHsts(String.raw`max-age="\3\0"; note="a;b,c=1 \"quoted\" \\ end"; other="<script>x</script>"`);
    expect(report.maxAgeSeconds).toBe("30");
    expect(report.directives[1]!.value).toBe('a;b,c=1 "quoted" \\ end');
    expect(report.directives[2]!.value).toBe("<script>x</script>");
    expect(inspectHsts('max-age=1; x="\t "').directives[1]!.value).toBe("\t ");
  });
  it("marks zero as removal of the issuing policy, retaining asserted flags", () => {
    expect(inspectHsts("max-age=000; includeSubDomains; preload")).toMatchObject({
      maxAgeSeconds: "0", duration: { days: "0", hours: 0, minutes: 0, seconds: 0 },
      operation: "remove", includeSubDomains: true, preload: true,
    });
  });
  it("keeps large integers exact through JSON and rejects a 41st digit", () => {
    const report = inspectHsts("max-age=9007199254740993");
    expect(report.duration).toEqual({ days: "104249991374", hours: 7, minutes: 36, seconds: 33 });
    expect(JSON.parse(JSON.stringify(report)).maxAgeSeconds).toBe("9007199254740993");
    expect(inspectHsts("max-age=" + "9".repeat(40)).maxAgeSeconds).toBe("9".repeat(40));
    expect(() => inspectHsts("max-age=" + "0".repeat(41))).toThrow(expect.objectContaining({ code: "HSTS_MAX_AGE" }));
  });
  it.each(["max-age=1; MAX-AGE=1", "max-age=1; includeSubDomains; INCLUDESUBDOMAINS", "max-age=1; x=1; X=2", "max-age=1; preload; PRELOAD"])("rejects all case-insensitive duplicate directives: %s", input => {
    expect(() => inspectHsts(input)).toThrow(expect.objectContaining({ code: "HSTS_DUPLICATE" }));
  });
  it.each(["", " ; ; ", "includeSubDomains", "max-age", 'max-age=""', "max-age=-1", "max-age=+1", "max-age=1.5", "max-age=1e3", 'max-age=" 1"', 'max-age="1 "', 'max-age="\\\\1"'])("requires one bounded unsigned decimal max-age: %j", input => {
    expect(() => inspectHsts(input)).toThrow(expect.objectContaining({ code: "HSTS_MAX_AGE" }));
  });
  it.each([
    "Strict-Transport-Security: max-age=1", "max-age=1, max-age=2", "max-age=1\n", "max-age=1\r\n x", "max-age=1\0", "max-age=1\u007f", "max-age=1; é=x", 'max-age=1; x="é"',
    "max-age=1; x=", "max-age=1; x=a/b", 'max-age=1; x="unclosed', 'max-age=1; x="bad\\', 'max-age=1; x="value" extra', "max-age=1; x=y=z", "max age=1",
  ])("rejects malformed or unsupported field text atomically: %j", input => {
    expect(() => inspectHsts(input)).toThrow(expect.objectContaining({ code: "HSTS_SYNTAX" }));
  });
  it.each(['max-age=1; includeSubDomains=true', 'max-age=1; includeSubDomains=""'])("rejects values for the valueless RFC flag: %s", input => {
    expect(() => inspectHsts(input)).toThrow(expect.objectContaining({ code: "HSTS_SUBDOMAINS" }));
  });
  it("enforces raw UTF-8 limits before trimming and reports no input in errors", () => {
    expect(inspectHsts("max-age=1" + " ".repeat(4087)).maxAgeSeconds).toBe("1");
    expect(() => inspectHsts("max-age=1" + " ".repeat(4088))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => inspectHsts("é".repeat(2049))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    try { inspectHsts("PRIVATE_HSTS_2731"); } catch (error) { expect(String(error)).not.toContain("PRIVATE_HSTS_2731"); }
  });
  it("enforces directive and slot bounds even for empty elements", () => {
    const names = Array.from({ length: 31 }, (_, i) => `x${i}`);
    expect(inspectHsts(["max-age=1", ...names].join(";")).directives).toHaveLength(32);
    expect(() => inspectHsts(["max-age=1", ...names, "extra"].join(";"))).toThrow(expect.objectContaining({ code: "HSTS_LIMIT" }));
    expect(inspectHsts("max-age=1" + ";".repeat(63)).emptySlots).toBe(63);
    expect(() => inspectHsts("max-age=1" + ";".repeat(64))).toThrow(expect.objectContaining({ code: "HSTS_LIMIT" }));
  });
});
