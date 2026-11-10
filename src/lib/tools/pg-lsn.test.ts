import { describe, expect, it } from "vite-plus/test";
import { comparePgLsn, PG_LSN_LIMITS, PG_WAL_SEGMENT_MIB } from "./pg-lsn";

describe("recorded PostgreSQL LSN comparison", () => {
  it("crosses the high-half boundary with exact bytes and mathematical segments", () => {
    expect(comparePgLsn("0/FF000000", "1/01000000")).toEqual({
      first: { lsn: "0/FF000000", bytePosition: "4278190080", segmentNumber: "255", segmentOffsetBytes: "0", zero: false },
      second: { lsn: "1/1000000", bytePosition: "4311744512", segmentNumber: "257", segmentOffsetBytes: "0", zero: false },
      segmentMiB: 16, segmentBytes: "16777216", deltaBytes: "33554432", distanceBytes: "33554432",
      direction: "forward", distanceMiB: { whole: "32", remainderBytes: "0" },
    });
  });
  it("retains a one-byte difference above JavaScript's safe integer range", () => {
    const report = comparePgLsn("200000/1", "200000/2");
    expect(report.first.bytePosition).toBe("9007199254740993");
    expect(report.second.bytePosition).toBe("9007199254740994");
    expect(report.deltaBytes).toBe("1");
    expect(report.distanceMiB).toEqual({ whole: "0", remainderBytes: "1" });
  });
  it("distinguishes reverse order, equality and the zero sentinel", () => {
    expect(comparePgLsn("1/0", "0/FFFFFFFF")).toMatchObject({ direction: "backward", deltaBytes: "-1", distanceBytes: "1" });
    expect(comparePgLsn("a/0000ff", "0000000A/FF")).toMatchObject({ direction: "equal", deltaBytes: "0", distanceBytes: "0", first: { lsn: "A/FF" } });
    expect(comparePgLsn("0/0", "0/1")).toMatchObject({ first: { zero: true }, second: { zero: false } });
    expect(comparePgLsn("0/0", "0/0")).toMatchObject({ first: { zero: true }, second: { zero: true }, direction: "equal" });
  });
  it("covers the complete unsigned 64-bit range without numeric JSON tokens", () => {
    const report = comparePgLsn("0/0", "FFFFFFFF/FFFFFFFF");
    expect(report.second).toEqual({ lsn: "FFFFFFFF/FFFFFFFF", bytePosition: "18446744073709551615", segmentNumber: "1099511627775", segmentOffsetBytes: "16777215", zero: false });
    expect(report.deltaBytes).toBe("18446744073709551615");
    expect(comparePgLsn("FFFFFFFF/FFFFFFFF", "0/0").deltaBytes).toBe("-18446744073709551615");
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });
  it("accepts each PostgreSQL segment size and assigns an exact boundary to the next segment", () => {
    expect(PG_WAL_SEGMENT_MIB).toEqual([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]);
    for (const size of PG_WAL_SEGMENT_MIB) {
      const bytes = size * 1048576;
      const report = comparePgLsn("0/" + (bytes - 1).toString(16), "0/" + bytes.toString(16), size);
      expect(report.first).toMatchObject({ segmentNumber: "0", segmentOffsetBytes: String(bytes - 1) });
      expect(report.second).toMatchObject({ segmentNumber: "1", segmentOffsetBytes: "0" });
      expect(report.segmentBytes).toBe(String(bytes));
      expect(report.deltaBytes).toBe("1");
    }
  });
  it("bounds raw UTF-8 before trimming and accepts only outer ASCII space/tab", () => {
    expect(PG_LSN_LIMITS.inputBytes).toBe(64);
    expect(comparePgLsn(" \t0000000a/0000000b\t ", "A/B").direction).toBe("equal");
    expect(comparePgLsn("0/0" + " ".repeat(61), "0/0").first.zero).toBe(true);
    for (const value of ["0/0" + " ".repeat(62), "é".repeat(33), "x".repeat(100000)]) {
      expect(() => comparePgLsn(value, "0/0")).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
      expect(() => comparePgLsn("0/0", value)).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    }
  });
  it.each(["", " ", "0/", "/0", "1/2/3", "100000000/0", "0/100000000", "-1/0", "+1/0", "0x1/0", "G/0", "1 /0", "1/ 0", "1/0\n", "\r1/0", "1/0\0", "１/0", "1／0", "\u00a01/0", "1/0\u200b", "<script>PRIVATE_LSN</script>"])("rejects malformed position %j atomically without echoing it", value => {
    for (const [a, b] of [[value, "0/1"], ["0/1", value]]) {
      expect(() => comparePgLsn(a!, b!)).toThrowError("PG_LSN_SYNTAX");
    }
  });
  it.each([0, -1, 3, 15, 1025, 2048, 16.5, NaN, Infinity])("rejects unsupported segment size %s", size => {
    expect(() => comparePgLsn("0/1", "0/2", size)).toThrowError("PG_LSN_SEGMENT_SIZE");
  });
});
