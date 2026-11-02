import { describe, expect, it } from "vite-plus/test";
import { inspectRetryAfter } from "./retry-after";

const reference = "2026-11-03T00:00:00.250Z";
function code(input: string, at = reference) {
  try { inspectRetryAfter(input, at); return "NO_ERROR"; }
  catch (error) { return (error as { code: string }).code; }
}

describe("recorded Retry-After arithmetic", () => {
  it("adds a declared delay to response receipt including its milliseconds", () => {
    expect(inspectRetryAfter(" \trEtRy-AfTeR:\t00120 ", reference)).toEqual({
      kind: "delay", value: "120", referenceUtc: reference,
      targetUtc: "2026-11-03T00:02:00.250Z", declaredDelaySeconds: "120",
      waitMilliseconds: "120000", minimumWholeSeconds: "120", past: false,
    });
    expect(inspectRetryAfter("0", reference)).toMatchObject({ targetUtc: reference, minimumWholeSeconds: "0", past: false });
  });
  it("preserves delays above Number precision and reports unavailable target dates", () => {
    const report = inspectRetryAfter("9007199254740993", reference);
    expect(report).toMatchObject({ declaredDelaySeconds: "9007199254740993", waitMilliseconds: "9007199254740993000", minimumWholeSeconds: "9007199254740993", targetUtc: null });
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    expect(inspectRetryAfter("9".repeat(40), reference).minimumWholeSeconds).toBe("9".repeat(40));
    expect(code("1".repeat(41))).toBe("RETRY_AFTER_DIGITS");
  });
  it("resolves IMF-fixdate and rounds positive fractional remaining seconds upward", () => {
    expect(inspectRetryAfter("Tue, 03 Nov 2026 00:00:02 GMT", reference)).toMatchObject({ kind: "date", declaredDelaySeconds: null, waitMilliseconds: "1750", minimumWholeSeconds: "2", targetUtc: "2026-11-03T00:00:02.000Z", past: false });
    expect(inspectRetryAfter("Tue, 03 Nov 2026 00:00:01 GMT", "2026-11-03T00:00:00.999Z").minimumWholeSeconds).toBe("1");
    expect(inspectRetryAfter("Tue, 03 Nov 2026 00:00:01 GMT", "2026-11-03T00:00:00.001Z").waitMilliseconds).toBe("999");
  });
  it("distinguishes past and equal dates without negative waits or moving the target", () => {
    expect(inspectRetryAfter("Tue, 03 Nov 2026 00:00:00 GMT", reference)).toMatchObject({ past: true, waitMilliseconds: "0", minimumWholeSeconds: "0", targetUtc: "2026-11-03T00:00:00.000Z" });
    expect(inspectRetryAfter("Tue, 03 Nov 2026 00:00:00 GMT", "2026-11-03T00:00:00Z")).toMatchObject({ past: false, minimumWholeSeconds: "0", referenceUtc: "2026-11-03T00:00:00.000Z" });
  });
  it("validates leap years, weekdays and four-digit year boundaries", () => {
    expect(inspectRetryAfter("Thu, 29 Feb 2024 12:00:00 GMT", reference).past).toBe(true);
    expect(inspectRetryAfter("0", "0001-01-01T00:00:00Z").targetUtc).toBe("0001-01-01T00:00:00.000Z");
    expect(inspectRetryAfter("1", "0099-12-31T23:59:59Z").targetUtc).toBe("0100-01-01T00:00:00.000Z");
    expect(inspectRetryAfter("0", "9999-12-31T23:59:59.999Z").targetUtc).toBe("9999-12-31T23:59:59.999Z");
    expect(inspectRetryAfter("1", "9999-12-31T23:59:59Z").targetUtc).toBeNull();
  });
  it("enforces IMF's 1900 lower year while keeping the reference calendar independent", () => {
    expect(code("Mon, 01 Jan 0001 00:00:00 GMT")).toBe("RETRY_AFTER_SYNTAX");
    expect(code("Sun, 01 Jan 1899 00:00:00 GMT")).toBe("RETRY_AFTER_SYNTAX");
    expect(inspectRetryAfter("Mon, 01 Jan 1900 00:00:00 GMT", "1899-12-31T23:59:59Z")).toMatchObject({ waitMilliseconds: "1000", minimumWholeSeconds: "1", targetUtc: "1900-01-01T00:00:00.000Z" });
  });
  it.each(["", "-1", "+1", "1.5", "1e3", "0x10", "１", "120, 240", "Retry-After : 120", "Date: 120", "120\n", "120\r\nRetry-After: 2", "120\u00a0", "120\u202e", "120\0", "\uFEFF120", "Tue, 03 nov 2026 00:00:00 GMT", "tue, 03 Nov 2026 00:00:00 GMT", "Tue, 03 Nov 2026 00:00:00 UTC", "Mon, 03 Nov 2026 00:00:00 GMT", "Thu, 29 Feb 2023 00:00:00 GMT", "Tue, 31 Nov 2026 00:00:00 GMT", "Tue, 03 Nov 2026 24:00:00 GMT", "Tue, 03 Nov 0000 00:00:00 GMT", "Sun, 06 Nov 1994 08:49:37 GMT, 120"])("rejects the whole malformed/unsupported field: %s", input => {
    expect(code(input)).toBe("RETRY_AFTER_SYNTAX");
  });
  it.each(["Sunday, 06-Nov-94 08:49:37 GMT", "Sun Nov  6 08:49:37 1994", "Sat, 31 Dec 2016 23:59:60 GMT"])("identifies unsupported old dates or leap seconds: %s", input => {
    expect(code(input)).toBe("RETRY_AFTER_DATE_UNSUPPORTED");
  });
  it.each(["", "2026-11-03", "2026-11-03T00:00:00+00:00", "2026-11-03T00:00:00z", "2026-11-03T00:00:00.0001Z", "2026-02-29T00:00:00Z", "2026-11-03T24:00:00Z", "0000-01-01T00:00:00Z", "2026-11-03T00:00:00Z\n", " ".repeat(65)])("rejects invalid or over-limit reference: %s", at => {
    expect(code("120", at)).toBe("RETRY_AFTER_REFERENCE");
  });
  it("normalizes reference fractions and enforces raw byte bounds before trimming", () => {
    expect(inspectRetryAfter("1", "2026-11-03T00:00:00.1Z").referenceUtc).toBe("2026-11-03T00:00:00.100Z");
    expect(inspectRetryAfter("1", "2026-11-03T00:00:00.12Z").referenceUtc).toBe("2026-11-03T00:00:00.120Z");
    expect(inspectRetryAfter("1" + " ".repeat(8191), reference).minimumWholeSeconds).toBe("1");
    expect(code("1" + " ".repeat(8192))).toBe("INPUT_TOO_LARGE");
    expect(code("\u00e9".repeat(4097))).toBe("INPUT_TOO_LARGE");
    expect(code("0".repeat(40))).toBe("NO_ERROR");
    expect(code("0".repeat(41))).toBe("RETRY_AFTER_DIGITS");
  });
});
