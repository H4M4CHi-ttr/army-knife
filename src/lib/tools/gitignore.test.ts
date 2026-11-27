import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { GITIGNORE_LIMITS, inspectGitignore } from "./gitignore";

describe("root gitignore rules", () => {
  it("keeps input order, exact line numbers, duplicates and the first ignored ancestor", () => {
    const result = inspectGitignore({
      rules: "# Build output\n\noutput/\n!output/keep.txt\noutput/temp/\n*.log\n!keep.log",
      paths: "output/keep.txt\noutput/temp/old\nkeep.log\nplain\noutput\noutput/\nkeep.log",
      windows: false,
    });
    expect(result.rows).toEqual([
      { row: 1, path: "output/keep.txt", status: "ignored", rule: { line: 3, pattern: "output/" }, ancestor: "output/" },
      { row: 2, path: "output/temp/old", status: "ignored", rule: { line: 3, pattern: "output/" }, ancestor: "output/" },
      { row: 3, path: "keep.log", status: "included", rule: { line: 7, pattern: "!keep.log" } },
      { row: 4, path: "plain", status: "included" },
      { row: 5, path: "output", status: "included" },
      { row: 6, path: "output/", status: "ignored", rule: { line: 3, pattern: "output/" } },
      { row: 7, path: "keep.log", status: "included", rule: { line: 7, pattern: "!keep.log" } },
    ]);
    expect(result.counts).toEqual({ ignored: 3, included: 4, invalid: 0 });
  });

  it("accepts a reopened parent and distinguishes the containing directory from its contents", () => {
    const result = inspectGitignore({
      rules: "cache/\n!/cache/\n/cache/**\n!/cache/keep.txt",
      paths: "cache/\ncache/keep.txt\ncache/sub/keep.txt\nother/cache/keep.txt",
      windows: false,
    });
    expect(result.rows.map(({ status, rule, ancestor }) => [status, rule?.line, ancestor])).toEqual([
      ["included", 2, undefined],
      ["included", 4, undefined],
      ["ignored", 3, "cache/sub/"],
      ["ignored", 1, "other/cache/"],
    ]);
  });

  it("resolves shallower ancestors after a higher-priority deeper exclusion", () => {
    const { rows } = inspectGitignore({ rules: "a/\na/b/c/d\na/b/", paths: "a/b/c/d", windows: false });
    expect(rows[0]).toMatchObject({ rule: { line: 1 }, ancestor: "a/" });
  });

  it("preserves backslashes by default and explicitly accepts relative Windows separators", () => {
    const input = {
      rules: String.raw`cache/\\` + "\ncache/",
      paths: String.raw`cache\item.txt` + "\n" + String.raw`C:\cache\item.txt` + "\n" + String.raw`\\host\cache`,
      windows: false,
    };
    expect(inspectGitignore(input).rows.map(row => row.status)).toEqual(["included", "included", "included"]);
    expect(inspectGitignore({ ...input, windows: true }).rows).toEqual([
      { row: 1, path: String.raw`cache\item.txt`, status: "ignored", rule: { line: 2, pattern: "cache/" }, ancestor: "cache/" },
      { row: 2, path: String.raw`C:\cache\item.txt`, status: "invalid" },
      { row: 3, path: String.raw`\\host\cache`, status: "invalid" },
    ]);
    expect(inspectGitignore({
      rules: String.raw`cache\\item.txt`, paths: String.raw`cache\item.txt`, windows: false,
    }).rows[0].status).toBe("ignored");
  });

  it("reports invalid paths and never-matching malformed patterns without losing other rows", () => {
    const result = inspectGitignore({
      rules: "\uFEFF# Sample\r\n[unclosed\r\nfoo\\\r\n[[:bad:]]\r\n*.txt\r\n",
      paths: "\r\nvalid.txt\r\n./relative.txt\r\n/a\r\na//b\r\na/../b\r\n \r\n",
      windows: false,
    });
    expect(result.invalidRules).toEqual([2, 3, 4]);
    expect(result.rows.map(({ row, status }) => [row, status])).toEqual([
      [2, "ignored"], [3, "invalid"], [4, "invalid"], [5, "invalid"], [6, "invalid"], [7, "included"],
    ]);
  });

  it("bounds bytes, lines, path depth, output and matcher work", () => {
    const limit = GITIGNORE_LIMITS;
    const exactPath = "é".repeat(limit.lineBytes / 2);
    expect(inspectGitignore({ rules: "*", paths: exactPath, windows: false }).rows[0].status).toBe("ignored");
    expect(() => inspectGitignore({ rules: "*", paths: exactPath + "a", windows: false })).toThrow("GITIGNORE_LINE_LIMIT");
    const exactInput = (("#" + " ".repeat(510)) + "\n").repeat(limit.bytes / 512);
    expect(inspectGitignore({ rules: exactInput, paths: "a", windows: false }).rows[0].status).toBe("included");
    expect(() => inspectGitignore({ rules: exactInput + "\n", paths: "a", windows: false }))
      .toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    const manyPaths = Array.from({ length: limit.lines }, (_, index) => `p${index}`).join("\n");
    expect(inspectGitignore({ rules: "", paths: manyPaths, windows: false }).rows).toHaveLength(limit.lines);
    expect(() => inspectGitignore({ rules: "", paths: manyPaths + "\nextra", windows: false })).toThrow("GITIGNORE_LINE_LIMIT");
    const depth = "x/".repeat(limit.depth);
    expect(inspectGitignore({ rules: "", paths: depth + "\n" + depth + "x", windows: false }).rows.map(row => row.status))
      .toEqual(["included", "invalid"]);
    const costlyRule = "*a".repeat(200) + "b";
    expect(() => inspectGitignore({
      rules: Array(250).fill(costlyRule).join("\n").slice(0, limit.bytes),
      paths: Array.from({ length: 16 }, (_, index) => "a".repeat(450) + index).join("\n"), windows: false,
    })).toThrow("GITIGNORE_WORK_LIMIT");
  });

  it.each(["a\u0000b", "\ud800", "a\rb"])("rejects malformed pasted text %#", text => {
    expect(() => inspectGitignore({ rules: text, paths: "a", windows: false })).toThrow("GITIGNORE_TEXT");
    expect(() => inspectGitignore({ rules: "", paths: text, windows: false })).toThrow("GITIGNORE_TEXT");
  });

  it("matches native Git decision and line attribution for curated patterns and virtual files", () => {
    const root = mkdtempSync(join(tmpdir(), "army-knife-gitignore-"));
    const run = (args: string[], input?: string) =>
      spawnSync("git", ["-C", root, "-c", "core.ignoreCase=false", "-c", `core.excludesFile=${join(root, "no-excludes")}`, ...args],
        { input, encoding: "utf8", env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" } });
    try {
      expect(run(["init", "-q", "--template="]).status).toBe(0);
      const cases = [
        {
          rules: "\uFEFF# comment\r\n/output/\r\n!output/keep.txt\r\nplain\r\n!other/plain\r\n*.log\r\n!keep.log\r\n" +
            "loose/\r\nabc/**\r\n**/docs/**/draft?.txt\r\ntop/***/mid\r\n" +
            String.raw`name\   ` + "\r\n" + String.raw`back\\  ` + "\r\n" +
            String.raw`\#literal` + "\r\n" + String.raw`\!literal` + "\r\n",
          paths: [
            "output/", "output/keep.txt", "nested/output/f.log", "plain", "other/plain",
            "keep.log", "nested/keep.log", "LOST.LOG", "gone.log", "nested/loose/x",
            "abc/", "abc/x", "abc/x/deep", "docs/draft1.txt", "repo/docs/new/draft3.txt",
            "repo/docs/draft21.txt", "top/mid", "top/a/b/mid", "name ", "name  ", "back\\",
            "#literal", "!literal", "unknown",
          ],
        },
        {
          rules: "u/?\nu/??\nu/????\n/a/[!a-z]\n/a/[]-]\n/a/[[:digit:]]\n/a/[a-cx-z]\n/a/[[:upper:]][[:xdigit:]]\n" +
            String.raw`a\/slash` + "\n" + String.raw`a/**\/deep` + "\n" +
            String.raw`a/[\]-]` + "\n" + String.raw`a/literal\*` + "\n" +
            "a/[à-ê]\na/[z-a]\na/\uFEFFname\n",
          paths: [
            "u/z", "u/é", "u/e\u0301", "u/😀", "a/q", "a/A", "a/]", "a/-", "a/3", "a/z",
            "a/Af", "a/Ax", "b/a/3", "a/slash", "a/deep", "a/x/y/deep", "a/literal*",
            "a/literalX", "a/ê", "a/\uFEFFname", "a/name",
          ],
        },
      ];
      for (const { rules, paths } of cases) {
        writeFileSync(join(root, ".gitignore"), rules);
        // A trailing slash marks a directory in the app. Materialize those test
        // directories and ask Git about their canonical paths without the marker.
        for (const path of paths.filter(path => path.endsWith("/"))) {
          mkdirSync(join(root, path), { recursive: true });
        }
        const nativePaths = paths.map(path => path.replace(/\/$/, ""));
        const native = run(["check-ignore", "--no-index", "-v", "-n", "-z", "--stdin"], nativePaths.join("\0") + "\0");
        expect([0, 1]).toContain(native.status);
        expect(native.stderr).toBe("");
        const fields = native.stdout.split("\0");
        expect(fields).toHaveLength(paths.length * 4 + 1);
        const result = inspectGitignore({ rules, paths: paths.join("\n"), windows: false });
        expect(result.rows.map(({ status, rule }) => [status, rule?.line, rule?.pattern])).toEqual(paths.map((_, index) => {
          const [, line, pattern] = fields.slice(index * 4, index * 4 + 3);
          return [!line || pattern.startsWith("!") ? "included" : "ignored", line ? Number(line) : undefined, line ? pattern : undefined];
        }));
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
