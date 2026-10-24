import { describe, expect, it } from "vite-plus/test";
import { inspectHttpRanges, HTTP_RANGE_LIMITS } from "./http-range";

function code(input: string, size = "1000") {
  try { inspectHttpRanges(input, size); return "NO_ERROR"; }
  catch (error) { return (error as { code: string }).code; }
}

describe("HTTP byte ranges", () => {
  it("resolves closed, open and suffix ranges with inclusive counts in source order", () => {
    const report = inspectHttpRanges("Range: bytes=0-99, 900-, -50, 2000-3000", "1000");
    expect(report).toMatchObject({ length: "1000", satisfiable: true, memberBytes: "250", coveredBytes: "200", overlaps: true });
    expect(report.members).toEqual([
      { source: "0-99", kind: "closed", status: "resolved", first: "0", last: "99", bytes: "100", contentRange: "bytes 0-99/1000" },
      { source: "900-", kind: "open", status: "resolved", first: "900", last: "999", bytes: "100", contentRange: "bytes 900-999/1000" },
      { source: "-50", kind: "suffix", status: "resolved", first: "950", last: "999", bytes: "50", contentRange: "bytes 950-999/1000" },
      { source: "2000-3000", kind: "closed", status: "unsatisfiable", first: null, last: null, bytes: "0", contentRange: null },
    ]);
  });
  it("clamps ends and long suffixes and handles duplicate and adjacent intervals", () => {
    expect(inspectHttpRanges("bytes=000-99999,-99999", "0010")).toMatchObject({ length: "10", memberBytes: "20", coveredBytes: "10", overlaps: true });
    expect(inspectHttpRanges("BYTES= 5-9, 0-4", "10")).toMatchObject({ memberBytes: "10", coveredBytes: "10", overlaps: false });
    expect(inspectHttpRanges("bytes=0-4,0-4,2-7,9-9", "10")).toMatchObject({ memberBytes: "17", coveredBytes: "9", overlaps: true });
  });
  it("keeps all arithmetic and JSON above Number precision exact", () => {
    const report = inspectHttpRanges("bytes=9007199254740993-, -2", "9007199254740997");
    expect(report).toMatchObject({ memberBytes: "6", coveredBytes: "4" });
    expect(report.members[0]).toMatchObject({ first: "9007199254740993", last: "9007199254740996", bytes: "4" });
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    const maximum = "9".repeat(40);
    expect(inspectHttpRanges("bytes=0-", maximum)).toMatchObject({ coveredBytes: maximum, memberBytes: maximum });
  });
  it("distinguishes zero suffix, out-of-bounds and the RFC zero-length positive suffix", () => {
    expect(inspectHttpRanges("bytes=-0,1000-", "1000")).toMatchObject({ satisfiable: false, coveredBytes: "0", memberBytes: "0" });
    const empty = inspectHttpRanges("bytes=0-0, -1, -0", "0");
    expect(empty).toMatchObject({ satisfiable: true, coveredBytes: "0", memberBytes: "0", overlaps: false });
    expect(empty.members.map(m => m.status)).toEqual(["unsatisfiable", "empty", "unsatisfiable"]);
    expect(empty.members[1]).toMatchObject({ first: null, last: null, contentRange: null });
    expect(inspectHttpRanges("bytes=0-", "0").satisfiable).toBe(false);
  });
  it.each(["bytes=9-8", "bytes=0-1,2000-1000", "bytes=", "bytes=-", "bytes=1", "bytes=+1-2", "bytes=1.0-2", "bytes=1 -2", "bytes =0-1", "items=0-1", "bytes=0-1,,2-3", "bytes=,0-1", "bytes=0-1,", "Range : bytes=0-1", "Content-Range: bytes 0-1/10", "bytes=0-1\nRange: bytes=2-3", "bytes=0-1\r", "bytes=0-1\u00a0", "bytes=0-1\u202e", "bytes=__proto__", "<img src=x>"])("rejects the whole malformed or unsupported field: %s", (input) => {
    expect(code(input)).toBe("HTTP_RANGE_SYNTAX");
  });
  it.each(["", "-1", "1.0", "1e3", "0x10", "+1", "1 0", "１", "10\n", "10\u00a0"])("rejects invalid representation size: %s", (size) => {
    expect(code("bytes=0-", size)).toBe("HTTP_RANGE_LENGTH");
  });
  it("accepts only ASCII outer OWS and normalizes decimal strings", () => {
    expect(inspectHttpRanges(" \trAnGe:\tByTeS= 0001-0002\t ", " 0003\t").members[0]).toMatchObject({ first: "1", last: "2", bytes: "2", source: "0001-0002" });
  });
  it("enforces member, input and decimal digit bounds without partial reports", () => {
    const member = "0-1";
    expect(inspectHttpRanges("bytes=" + Array(32).fill(member).join(","), "10").members).toHaveLength(32);
    expect(code("bytes=" + Array(33).fill(member).join(","))).toBe("HTTP_RANGE_LIMIT");
    expect(code("bytes=" + "1".repeat(41) + "-")).toBe("HTTP_RANGE_LIMIT");
    expect(code("bytes=0-" + "1".repeat(41))).toBe("HTTP_RANGE_LIMIT");
    expect(code("bytes=-" + "1".repeat(41))).toBe("HTTP_RANGE_LIMIT");
    expect(code("bytes=0-", "1".repeat(41))).toBe("HTTP_RANGE_LENGTH");
    expect(inspectHttpRanges("bytes=0-" + " ".repeat(HTTP_RANGE_LIMITS.bytes - 8), "1").coveredBytes).toBe("1");
    expect(code("bytes=0-" + " ".repeat(HTTP_RANGE_LIMITS.bytes - 7))).toBe("INPUT_TOO_LARGE");
  });
});
