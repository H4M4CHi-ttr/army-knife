import { describe, expect, it } from "vite-plus/test";
import { calculateCacheAge } from "./cache-age.ts";

const date = "Date: Mon, 23 Nov 2026 00:00:00 GMT";
const times = {
  request: "2026-11-23T00:00:11.250Z",
  response: "2026-11-23T00:00:12.500Z",
  evaluation: "2026-11-23T00:00:20.875Z",
};
const calculate = (headers = date, overrides: Partial<typeof times> = {}) =>
  calculateCacheAge({ headers, ...times, ...overrides });

describe("recorded cache age", () => {
  it("returns all stages in exact decimal seconds and identifies the maximum", () => {
    expect(calculate(date + "\r\nAgE:\t00015 \r\n")).toEqual({
      ageHeaderSeconds: "15",
      apparentAge: "12.500",
      responseDelay: "1.250",
      correctedAgeValue: "16.250",
      correctedInitialAge: "16.250",
      residentTime: "8.375",
      currentAge: "24.625",
      initialAgeSource: "corrected",
      futureDate: false,
    });
    expect(calculate()).toMatchObject({
      ageHeaderSeconds: null,
      correctedAgeValue: "1.250",
      correctedInitialAge: "12.500",
      initialAgeSource: "apparent",
      currentAge: "20.875",
    });
  });

  it("distinguishes a tie and a present Age of zero and accepts simultaneous events", () => {
    const at = "2026-11-23T00:00:00Z";
    expect(calculate(date + "\nAge: 0", { request: at, response: at, evaluation: at })).toMatchObject({
      ageHeaderSeconds: "0",
      apparentAge: "0.000",
      responseDelay: "0.000",
      residentTime: "0.000",
      initialAgeSource: "tie",
      currentAge: "0.000",
    });
  });

  it("clamps a future Date to zero and marks possible clock skew", () => {
    expect(calculate(date.replace("00 GMT", "13 GMT"))).toMatchObject({
      futureDate: true,
      apparentAge: "0.000",
      correctedInitialAge: "1.250",
      currentAge: "9.625",
    });
  });

  it("requires Date and all three explicit instants", () => {
    expect(() => calculate("Age: 15")).toThrow("CACHE_AGE_DATE_MISSING");
    expect(() => calculate("")).toThrow("CACHE_AGE_DATE_MISSING");
    for (const field of ["request", "response", "evaluation"] as const) {
      expect(() => calculate(date, { [field]: "" })).toThrow("CACHE_AGE_TIME_MISSING");
    }
  });

  it("rejects reversed clock order", () => {
    expect(() => calculate(date, { request: times.evaluation })).toThrow("CACHE_AGE_TIME_ORDER");
    expect(() => calculate(date, { evaluation: times.request })).toThrow("CACHE_AGE_TIME_ORDER");
  });

  it.each(["2026-02-29T00:00:00Z", "2026-11-23T24:00:00Z", "2026-11-23T00:00:00.0001Z",
    "2026-11-23T00:00:00+00:00", "2026-11-23T00:00:00", "2026-11-23T00:00:00Z\n", "x".repeat(25)])(
    "rejects invalid or unsupported timestamp %j", (evaluation) => {
      expect(() => calculate(date, { evaluation })).toThrow("CACHE_AGE_TIME");
    },
  );

  it.each(["Tue, 23 Nov 2026 00:00:00 GMT", "Sun, 29 Feb 2026 00:00:00 GMT", "Monday, 23-Nov-26 00:00:00 GMT",
    "Mon Nov 23 00:00:00 2026", "Mon, 23 Nov 2026 00:00:60 GMT", "Mon, 23 Nov 2026 00:00:00 UTC", ""])(
    "rejects invalid or unsupported Date %j", (value) => {
      expect(() => calculate("Date: " + value)).toThrow("CACHE_AGE_DATE");
    },
  );

  it.each(["", "-1", "+1", "1.0", "1e3", "1, 2", '"1"'])("rejects invalid Age %j", (value) => {
    expect(() => calculate(date + "\nAge: " + value)).toThrow("CACHE_AGE_VALUE");
  });

  it("rejects duplicated fields and other response data", () => {
    expect(() => calculate(date + "\n" + date.toLowerCase())).toThrow("CACHE_AGE_DUPLICATE");
    expect(() => calculate("Age: 1\nage: 2")).toThrow("CACHE_AGE_DUPLICATE");
    for (const input of [date + "\r", date + "\n\n", date + "\u2028", date + "\nAge: １２", date + "\rAge: 2", date + "\n Age: 2", date + "\nAge : 2", date + "\nVary: Accept",
      "HTTP/1.1 200 OK\n" + date, date + "\n\nAge: 2"]) {
      expect(() => calculate(input)).toThrow("CACHE_AGE_FIELDS");
    }
  });

  it("keeps precision beyond IEEE-754 and checks the raw byte and digit bounds", () => {
    const age = "9".repeat(40);
    expect(calculate(date + "\nAge: " + age).currentAge).toBe("1" + "0".repeat(39) + "8.625");
    expect(() => calculate(date + "\nAge: " + age + "9")).toThrow("CACHE_AGE_DIGITS");
    const pad = " ".repeat(512 - date.length);
    expect(calculate(date + pad).currentAge).toBe("20.875");
    expect(() => calculate(date + pad + " ")).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => calculate(date + "é".repeat(256))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
  });
});
