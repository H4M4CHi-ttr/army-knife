import { describe, expect, it } from "vite-plus/test";
import { inspectServerTiming } from "./server-timing";

describe("Server-Timing declarations", () => {
  it("keeps metric order, exact decimal durations and quoted delimiters", () => {
    const report = inspectServerTiming('Server-Timing: cache;desc="hit, edge; warm", db;dur=9007199254740993.125\r\nServer-Timing: app;dur=47.2');
    expect(report.metrics.map((row) => row.name)).toEqual(["cache", "db", "app"]);
    expect(report.metrics[0]?.description).toBe("hit, edge; warm");
    expect(report.metrics[0]?.duration).toBeNull();
    expect(report.metrics[1]?.duration).toBe("9007199254740993.125");
    expect(report.metrics[2]?.duration).toBe("47.2");
  });
  it("retains repeated metric names and case, with first parameter occurrence winning", () => {
    const report = inspectServerTiming('db;dur=bad;dur=12;desc="";desc=second;x=1, db;dur="000.5000", DB;DUR=10');
    expect(report.metrics.map((row) => row.name)).toEqual(["db", "db", "DB"]);
    expect(report.metrics[0]).toMatchObject({ duration: null, description: "", notes: ["duplicate-parameter", "extension", "duration-format"] });
    expect(report.metrics[0]?.parameters.map((row) => row.ignored)).toEqual([false, true, false, true, false]);
    expect(report.metrics[1]?.duration).toBe("000.5000");
    expect(report.metrics[2]).toMatchObject({ duration: null, notes: ["extension"] });
  });
  it("decodes escapes and treats prototype-like names as data", () => {
    const report = inspectServerTiming('__proto__;desc="a\\\"b\\\\c";constructor=safe, constructor;dur=0');
    expect(report.metrics[0]?.description).toBe('a"b\\c');
    expect(report.metrics[0]?.parameters[1]?.value).toBe("safe");
    expect(report.metrics[1]?.duration).toBe("0");
    expect({}).not.toHaveProperty("safe");
  });
  it("allows HTTP optional whitespace, empty list members and Latin-1 quoted strings", () => {
    expect(inspectServerTiming(' , db \t; dur \t=\t .5 ; desc = "caf\u00e9",, ').metrics[0])
      .toMatchObject({ name: "db", duration: ".5", description: "caf\u00e9" });
  });
  it.each(["0", "0.0", "9007199254740993.125", "0.00000000000000000000000001", ".5", "1."])("preserves decimal notation %s without numeric conversion", (value) => {
    expect(inspectServerTiming(`db;dur=${value}`).metrics[0]?.duration).toBe(value);
  });
  it.each(["-1", "+1", "1e3", "NaN", "Infinity", '""', '" 12"', "1ms"])("shows unsupported duration notation %s without inventing zero", (value) => {
    expect(inspectServerTiming(`db;dur=${value}`).metrics[0]).toMatchObject({ duration: null, notes: ["duration-format"] });
  });
  it.each(["", " \t", ",,", "Server-Timing:\nServer-Timing:"])("rejects empty input %j", (value) => {
    expect(() => inspectServerTiming(value)).toThrow("SERVER_TIMING_EMPTY");
  });
  it.each(['db;desc="unfinished', 'db;desc="x"junk', "db;dur=", "db;dur", "db garbage", "db;=12", "db;;dur=12", "db;dur==12", 'db;desc="\u007f"', 'db;desc="\u0100"', "db\rapp", "db\u0000"])("rejects syntax instead of returning a partial report: %j", (value) => {
    expect(() => inspectServerTiming(value)).toThrow("SERVER_TIMING_SYNTAX");
  });
  it.each(["Server-Timing: db\nETag: secret", "db\napp", "HTTP/1.1 200 OK\nServer-Timing: db"])("rejects mixed headers or raw multiline values: %j", (value) => {
    expect(() => inspectServerTiming(value)).toThrow("SERVER_TIMING_HEADERS");
  });
  it.each(["\n ", "\n\t", "\r\n ", "\r\n\t"])("rejects obsolete folding %j", (separator) => {
    expect(() => inspectServerTiming(`Server-Timing: db${separator}Server-Timing: app`)).toThrow("SERVER_TIMING_HEADERS");
  });
  it.each(["\n", "\r\n"])("never joins an unterminated quoted string across repeated fields: %j", (newline) => {
    for (const suffix of ["", "\\"]) {
      expect(() => inspectServerTiming(`Server-Timing: db;desc="unfinished${suffix}${newline}Server-Timing: app"`)).toThrow("SERVER_TIMING_SYNTAX");
    }
  });
  it("accepts each structural boundary", () => {
    expect(inspectServerTiming(Array(64).fill("db").join(",")).metrics).toHaveLength(64);
    expect(inspectServerTiming("db" + Array.from({ length: 16 }, (_, i) => `;x${i}=1`).join("")).metrics[0]?.parameters).toHaveLength(16);
    expect(inspectServerTiming("x".repeat(64)).metrics[0]?.name).toHaveLength(64);
    expect(inspectServerTiming('db;desc="' + "x".repeat(1024) + '"').metrics[0]?.description).toHaveLength(1024);
    expect(inspectServerTiming(Array(32).fill("Server-Timing: db").join("\n")).metrics).toHaveLength(32);
    expect(inspectServerTiming("db" + ",".repeat(8190)).metrics).toHaveLength(1);
  });
  it.each([
    Array(65).fill("db").join(","), "db" + ";x=1".repeat(17), "x".repeat(65),
    "db;" + "x".repeat(65) + "=1", 'db;desc="' + "x".repeat(1025) + '"',
    Array(33).fill("Server-Timing: db").join("\n"),
  ])("rejects structural overflow without partial metrics", (value) => {
    expect(() => inspectServerTiming(value)).toThrow("SERVER_TIMING_LIMIT");
  });
  it("enforces UTF-8 bytes before parsing", () => {
    expect(() => inspectServerTiming("db" + ",".repeat(8191))).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => inspectServerTiming('db;desc="' + "\u00e9".repeat(4096) + '"')).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
  });
});
