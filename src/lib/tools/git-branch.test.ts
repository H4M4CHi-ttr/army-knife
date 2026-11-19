import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { GIT_BRANCH_LIMITS, inspectGitBranches } from "./git-branch";

const inspect = (names: string[]) => inspectGitBranches(JSON.stringify(names));
describe("literal Git branch names", () => {
  it("accepts one-level, at sign and literal full-looking names with exact refs", () => {
    const names = ["main", "@", "feature/new", "refs/heads/x", "a./b", "HEAD/x", "head", "a.LOCK", "x/-y", "x]y", "x{y}"];
    const r = inspect(names);
    expect(r).toEqual({ branches: names.map(name => ({ name, nameBytes: name.length,
      valid: true, fullRef: "refs/heads/" + name, issues: [] })), validCount: names.length, invalidCount: 0 });
  });
  it.each([
    ["", "empty"], ["-x", "leadingDash"], ["HEAD", "reservedHead"],
    ["/a", "emptyComponent"], ["a/", "emptyComponent"], ["a//b", "emptyComponent"],
    [".a", "dotComponent"], ["a/.b", "dotComponent"], ["a.lock/b", "lockSuffix"],
    ["a/b.lock", "lockSuffix"], ["a..b", "doubleDot"], ["a.", "trailingDot"],
    ["a@{b", "reflog"], ["@{-1}", "reflog"], ["x y", "forbiddenCharacter"],
    ["a\u0000b", "forbiddenCharacter"], ["a\r\nb", "forbiddenCharacter"],
  ])("explains the invalid literal %j", (name, reason) => {
    expect(inspect([name!]).branches[0]).toMatchObject({ name, valid: false, fullRef: null, issues: expect.arrayContaining([reason]) });
  });
  it("reports all independent reasons once in a stable order", () => {
    expect(inspect(["-x//.y.lock..@{z ."]).branches[0]!.issues).toEqual([
      "leadingDash", "emptyComponent", "dotComponent", "doubleDot", "trailingDot", "reflog", "forbiddenCharacter",
    ]);
    expect(inspect(["a.lock/b.lock"]).branches[0]!.issues).toEqual(["lockSuffix"]);
  });
  it("preserves whitespace, duplicate order, Unicode and normalization differences", () => {
    const names = [" a ", "😀", "é", "e\u0301", "日本語", "x\u202ey", "x\u200by", "\ufeffx", "😀"];
    const r = inspect(names);
    expect(r.branches.map(b => b.name)).toEqual(names);
    expect(r.branches.map(b => b.nameBytes)).toEqual([3, 4, 2, 3, 9, 5, 5, 4, 4]);
    expect(r).toMatchObject({ validCount: 8, invalidCount: 1 });
  });
  it.each(["", "[", "[\"a\",]", "\ufeff[\"a\"]", "[NaN]"])("rejects malformed JSON without a partial report", input => {
    expect(() => inspectGitBranches(input)).toThrowError("GIT_BRANCH_JSON");
  });
  it.each(["null", "{}", "\"a\"", "[1]", "[null]", "[true]", "[[\"x\"]]", "[\"x\",{}]"])("requires only strings", input => {
    expect(() => inspectGitBranches(input)).toThrowError("GIT_BRANCH_SHAPE");
  });
  it("rejects raw and decoded lone surrogates without exposing input", () => {
    for (const value of ['["\\ud800"]', '["\\udfff"]', '["x\\ud800y"]', '["\ud800"]']) {
      expect(() => inspectGitBranches(value)).toThrowError("GIT_BRANCH_UNICODE");
    }
    expect(inspect(["\ud800\udc00"]).validCount).toBe(1);
  });
  it("checks raw UTF-8 bounds before parsing and decoded name byte limits", () => {
    const exact = '["界"]\r\n' + " ".repeat(8183);
    expect(new TextEncoder().encode(exact)).toHaveLength(8192);
    expect(inspectGitBranches(exact).validCount).toBe(1);
    expect(() => inspectGitBranches(exact + " ")).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(inspect(["😀".repeat(128)]).branches[0]!.nameBytes).toBe(512);
    expect(() => inspect(["😀".repeat(128) + "a"])).toThrowError("GIT_BRANCH_NAME_LIMIT");
    expect(inspectGitBranches('["' + "\\u0061".repeat(512) + '"]').validCount).toBe(1);
    expect(() => inspectGitBranches('["' + "\\u0061".repeat(513) + '"]')).toThrowError("GIT_BRANCH_NAME_LIMIT");
  });
  it("keeps all 128 results including invalid names within the bounded export", () => {
    expect(() => inspect([])).toThrowError("GIT_BRANCH_COUNT");
    expect(() => inspect(Array(129).fill("a"))).toThrowError("GIT_BRANCH_COUNT");
    const r = inspect(Array(128).fill("-a//.x.lock..@{b\u0000."));
    expect(r.branches).toHaveLength(128); expect(r.invalidCount).toBe(128);
    expect(new TextEncoder().encode(JSON.stringify(r, null, 2)).length).toBeLessThanOrEqual(GIT_BRANCH_LIMITS.outputBytes);
  });
  it("agrees with native Git outside a repository for ASCII and Unicode edge cases", () => {
    const cwd = mkdtempSync(join(tmpdir(), "army-knife-ref-oracle-"));
    const names = ["", "@", "HEAD", "head", "-x", "x/-y", "@{-1}", "refs/heads/a", "a./b", "a.lock/b", "a.LOCK/b", "a//b", "a/b.",
      "日本語", "😀", "é", "e\u0301", "\u0085", "x\ufeffy", "x\u202ey", "x\u2028y", "x\u200by",
      ...Array.from({ length: 127 }, (_, i) => "a" + String.fromCharCode(i + 1) + "b")];
    try {
      for (const name of names) {
        let valid = true;
        try { execFileSync("git", ["check-ref-format", "--branch", name], { cwd, stdio: "ignore" }); }
        catch (error) {
          if (!(error && typeof error === "object" && "status" in error && typeof error.status === "number")) throw error;
          valid = false;
        }
        expect(inspect([name]).branches[0]!.valid, JSON.stringify(name)).toBe(valid);
      }
    } finally { rmSync(cwd, { recursive: true }); }
  });
});
