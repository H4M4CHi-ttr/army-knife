import { describe, expect, it } from "vite-plus/test";
import { CONTENT_RANGE_LIMITS, inspectContentRange } from "./content-range";

const code = (input: string, expected: string) =>
  expect(() => inspectContentRange(input)).toThrowError(expect.objectContaining({ code: expected }));

describe("recorded byte Content-Range arithmetic", () => {
  it("counts inclusive endpoints and the known prefix/suffix without inferring a response", () => {
    expect(inspectContentRange("bytes 100-199/1000")).toEqual({
      unit: "bytes", kind: "range", canonical: "bytes 100-199/1000",
      first: "100", last: "199", rangeBytes: "100", completeLength: "1000",
      bytesBefore: "100", bytesAfter: "800", coversWholeRepresentation: false,
    });
    expect(inspectContentRange("bytes 0-0/1")).toMatchObject({
      first: "0", last: "0", rangeBytes: "1", completeLength: "1",
      bytesBefore: "0", bytesAfter: "0", coversWholeRepresentation: true,
    });
    expect(inspectContentRange("bytes 0-98/100").coversWholeRepresentation).toBe(false);
    expect(inspectContentRange("bytes 1-99/100").coversWholeRepresentation).toBe(false);
  });
  it("preserves unknown complete length as null rather than zero or a guessed total", () => {
    expect(inspectContentRange("bytes 42-1233/*")).toEqual({
      unit: "bytes", kind: "range", canonical: "bytes 42-1233/*",
      first: "42", last: "1233", rangeBytes: "1192", completeLength: null,
      bytesBefore: "42", bytesAfter: null, coversWholeRepresentation: null,
    });
  });
  it("preserves unsatisfied syntax without fabricating an interval or empty body", () => {
    for (const total of ["0", "1234", "9007199254740993"]) {
      expect(inspectContentRange("bytes */" + total)).toEqual({
        unit: "bytes", kind: "unsatisfied", canonical: "bytes */" + total,
        first: null, last: null, rangeBytes: null, completeLength: total,
        bytesBefore: null, bytesAfter: null, coversWholeRepresentation: null,
      });
    }
  });
  it("accepts the optional field name and outer ASCII OWS; normalizes case and leading zeroes", () => {
    expect(inspectContentRange("\t CoNtEnT-RaNgE:\t ByTeS 000-009/010 \t")).toMatchObject({
      canonical: "bytes 0-9/10", first: "0", last: "9", rangeBytes: "10",
      completeLength: "10", bytesAfter: "0", coversWholeRepresentation: true,
    });
    expect(inspectContentRange("Content-Range:bytes */000")).toMatchObject({ canonical: "bytes */0", completeLength: "0" });
  });
  it("retains adjacent integers above Number.MAX_SAFE_INTEGER in UI/export data", () => {
    const report = inspectContentRange("Content-Range: bytes 9007199254740993-9007199254741992/9007199254742993");
    expect(report).toMatchObject({
      first: "9007199254740993", last: "9007199254741992", rangeBytes: "1000",
      completeLength: "9007199254742993", bytesBefore: "9007199254740993", bytesAfter: "1000",
    });
    expect(inspectContentRange("bytes 9007199254740993-9007199254740993/9007199254740994").rangeBytes).toBe("1");
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    for (const key of ["first", "last", "rangeBytes", "completeLength", "bytesBefore", "bytesAfter"] as const) {
      expect(typeof report[key]).toBe("string");
    }
  });
  it("accepts 40-digit inputs and an exact 41-digit derived interval length", () => {
    expect(CONTENT_RANGE_LIMITS).toEqual({ inputBytes: 256, digits: 40 });
    const maximum = "9".repeat(40);
    expect(inspectContentRange("bytes 0-" + maximum + "/*").rangeBytes).toBe("1" + "0".repeat(40));
    const last = "9".repeat(39) + "8";
    expect(inspectContentRange("bytes 0-" + last + "/" + maximum)).toMatchObject({
      completeLength: maximum, rangeBytes: maximum, bytesAfter: "0", coversWholeRepresentation: true,
    });
    expect(inspectContentRange("bytes */" + maximum).completeLength).toBe(maximum);
  });
  it.each([
    "bytes " + "0".repeat(41) + "-1/2",
    "bytes 0-" + "0".repeat(41) + "/*",
    "bytes 0-0/" + "0".repeat(41),
    "bytes */" + "0".repeat(41),
  ])("bounds every decimal part before BigInt conversion: %s", value => {
    code(value, "CONTENT_RANGE_DIGITS");
  });
  it("bounds raw UTF-8 before trimming, optional header removal or syntax checks", () => {
    const base = "Content-Range: bytes 0-0/1";
    expect(inspectContentRange(base + " ".repeat(256 - base.length)).rangeBytes).toBe("1");
    for (const input of [base + " ".repeat(257 - base.length), "é".repeat(129), " ".repeat(100000)]) {
      code(input, "INPUT_TOO_LARGE");
    }
    code("é".repeat(128), "CONTENT_RANGE_SYNTAX");
  });
  it.each(["bytes 9-8/10", "bytes 0-0/0", "bytes 0-10/10", "bytes 10-20/10", "bytes 42-1233/1233"])(
    "rejects contradictory endpoints atomically: %s", value => {
      code(value, "CONTENT_RANGE_BOUNDS");
    },
  );
  it.each([
    "", " ", "bytes", "bytes ", "bytes=0-1", "bytes 0-1", "bytes 0-/10", "bytes -1/10",
    "bytes */*", "bytes * /10", "bytes 0-1 /10", "bytes 0 -1/10", "bytes 0- 1/10",
    "bytes 0-1/ 10", "bytes  0-1/10", "bytes\t0-1/10", "items 0-1/10",
    "bytes +0-1/10", "bytes 0-1/-10", "bytes 0-1/1e2", "bytes 0x0-1/10",
    "bytes 0-1/10, 2-3/10", "Content-Range : bytes 0-1/10",
    "Content-Range: Content-Range: bytes 0-1/10",
    "bytes 0-1/10\n", "\rbytes 0-1/10", "Content-Range:\r\n bytes 0-1/10",
    "bytes ０-1/10", "bytes 0-1/10\u00a0", "\ufeffbytes 0-1/10", "bytes 0-1/10\0",
    '<img src="https://example.invalid/PRIVATE_CONTENT_RANGE_4196">',
  ])("rejects unsupported recorded syntax without echoing %j", value => {
    code(value, "CONTENT_RANGE_SYNTAX");
    try { inspectContentRange(value); } catch (error) {
      expect((error as Error).message).toBe("CONTENT_RANGE_SYNTAX");
    }
  });
});
