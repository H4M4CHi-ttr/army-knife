import { describe, expect, it } from "vite-plus/test";
import { findUtf8InputError } from "./limits";
import { ENGINE_LIMITS, type EngineRequest } from "./types";

const csv = (text: string): EngineRequest => ({
  operation: "csv", text, delimiter: ",", header: true, trim: false,
});

describe("worker-only UTF-8 size checks", () => {
  it("accepts a maximum-sized ASCII value without a UI-thread encoder", () => {
    expect(findUtf8InputError(csv("a".repeat(ENGINE_LIMITS.inputBytes)))).toBeNull();
  });
  it("rejects multibyte Unicode that passes a UTF-16 character-length guard", () => {
    expect(findUtf8InputError(csv("あ".repeat(Math.floor(ENGINE_LIMITS.inputBytes / 3) + 1))))
      .toBe("INPUT_TOO_LARGE");
  });
  it("enforces the combined size of both list inputs", () => {
    expect(findUtf8InputError({
      operation: "sets", left: "あ".repeat(2_000_000), right: "あ".repeat(4_000_000),
      mode: "union", trim: false, caseInsensitive: false, ignoreEmpty: false,
    })).toBe("INPUT_TOO_LARGE");
  });
  it("reports oversized regex patterns independently of log content", () => {
    expect(findUtf8InputError({
      operation: "logs", text: "INFO test", pattern: "あ".repeat(1366), caseInsensitive: false,
    })).toBe("REGEX_TOO_LARGE");
  });
});
