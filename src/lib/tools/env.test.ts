import { describe, expect, it } from "vite-plus/test";
import { compareEnv, ENV_LIMITS, inspectEnv } from "./env";

describe("dotenv inspection and comparison", () => {
  it("compares decoded values and preserves significant quoted whitespace", () => {
    const result = compareEnv(
      'A = value # note\nB=" spaced "\nOLD=yes\n',
      "B=\"spaced\"\nA='value'\nNEW=",
    );
    expect(result.summary).toEqual({ "left-only": 1, "right-only": 1, changed: 1, equal: 1 });
    expect(result.changes.map((change) => [change.key, change.kind])).toEqual([
      ["A", "equal"],
      ["B", "changed"],
      ["NEW", "right-only"],
      ["OLD", "left-only"],
    ]);
    expect(result.right.emptyValues).toBe(1);
    expect(result.complete).toBe(true);
  });

  it("normalizes line endings, recognizes export, and supports multiline quotes", () => {
    const result = inspectEnv(
      '\uFEFFexport KEY = "first\r\nsecond#value" # comment\r\nOTHER=ok\r\n',
    );
    expect(result.lines).toBe(3);
    expect(result.variables).toEqual([
      { key: "KEY", value: "first\nsecond#value", line: 1, occurrences: [1] },
      { key: "OTHER", value: "ok", line: 3, occurrences: [3] },
    ]);
  });

  it("uses the last valid definition and retains all duplicate locations", () => {
    const result = inspectEnv('X=first\nX=second\nX="last"\nEMPTY=\n');
    expect(result.variables.find((variable) => variable.key === "X")).toEqual({
      key: "X",
      value: "last",
      line: 3,
      occurrences: [1, 2, 3],
    });
    expect(result.duplicateKeys).toBe(1);
    expect(result.definitions).toBe(4);
    expect(result.issues).toEqual([
      { code: "ENV_DUPLICATE", line: 2, key: "X" },
      { code: "ENV_DUPLICATE", line: 3, key: "X" },
    ]);
  });

  it("keeps shell syntax and prototype-like keys as literal data", () => {
    const result = inspectEnv(
      "__proto__=safe\nconstructor=value\nCMD=$(touch /tmp/never-run)\nREF=${HOME}\nTICK=`command`",
    );
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result.variables.find((variable) => variable.key === "CMD")?.value).toBe(
      "$(touch /tmp/never-run)",
    );
    expect(result.variables.find((variable) => variable.key === "REF")?.value).toBe("${HOME}");
    expect(result.variables.find((variable) => variable.key === "__proto__")?.value).toBe("safe");
  });

  it("documents double-quote newline escapes and keeps other escapes literal", () => {
    const result = inspectEnv('A="line\\nnext\\rend"\nB=\'line\\nnext\'\nC="quote\\"inside"');
    expect(result.variables.map((variable) => variable.value)).toEqual([
      "line\nnext\rend",
      "line\\nnext",
      'quote\\"inside',
    ]);
  });

  it("reports malformed definitions without inventing a complete comparison", () => {
    const result = compareEnv(
      '1INVALID=x\nGOOD=ok\nBAD="quoted" extra\nNUL=a\0b\nMISSING',
      "GOOD=ok",
    );
    expect(result.complete).toBe(false);
    expect(result.left.invalidDefinitions).toBe(4);
    expect(result.left.issues.map((issue) => [issue.code, issue.line])).toEqual([
      ["ENV_INVALID_ASSIGNMENT", 1],
      ["ENV_TRAILING_CONTENT", 3],
      ["ENV_NUL", 4],
      ["ENV_INVALID_ASSIGNMENT", 5],
    ]);
    expect(result.changes.map((change) => change.key)).toEqual(["GOOD"]);
  });

  it("rejects unterminated multiline quotes and excessive identifier length", () => {
    expect(inspectEnv('X="unterminated\nNEXT=not a definition').issues).toEqual([
      { code: "ENV_UNCLOSED_QUOTE", line: 1, key: "X" },
    ]);
    expect(inspectEnv(`${"K".repeat(129)}=x`).issues[0]?.code).toBe("ENV_KEY_TOO_LONG");
  });

  it("caps rendered issues while retaining exact invalid counts", () => {
    const result = inspectEnv("invalid\n".repeat(250));
    expect(result.issues).toHaveLength(ENV_LIMITS.issues);
    expect(result.invalidDefinitions).toBe(250);
    expect(result.issuesTruncated).toBe(true);
  });

  it("enforces UTF-8, physical-line and valid-definition budgets", () => {
    expect(() => inspectEnv("あ".repeat(ENV_LIMITS.inputBytes / 3 + 1))).toThrow(
      expect.objectContaining({ code: "INPUT_TOO_LARGE" }),
    );
    expect(() => inspectEnv("#\n".repeat(ENV_LIMITS.lines + 1))).toThrow("ENV_TOO_MANY_LINES");
    expect(() => inspectEnv("X=1\n".repeat(ENV_LIMITS.definitions + 1))).toThrow(
      "ENV_TOO_MANY_DEFINITIONS",
    );
    expect(inspectEnv("#\n".repeat(ENV_LIMITS.lines)).lines).toBe(ENV_LIMITS.lines);
  });

  it("has stable output for empty inputs, case-sensitive keys, and repeated calls", () => {
    expect(compareEnv("", "").changes).toEqual([]);
    expect(inspectEnv("").lines).toBe(0);
    const input = "z=last\na=lower\nA=upper";
    expect(inspectEnv(input).variables.map((variable) => variable.key)).toEqual(["A", "a", "z"]);
    expect(inspectEnv(input)).toEqual(inspectEnv(input));
  });
});
