import { describe, expect, it } from "vite-plus/test";
import { inspectGitPatch, PATCH_LIMITS } from "./git-patch";

const header = "diff --git a/a.txt b/a.txt\nindex 1234567..abcdef0 100644\n--- a/a.txt\n+++ b/a.txt\n";
const patch = header + "@@ -1,2 +1,3 @@ heading\n keep\n-old\n+new\n+more\n";
function fails(input: string, code: string) {
  expect(() => inspectGitPatch(input)).toThrow(expect.objectContaining({ code }));
}
describe("recorded Git patch inspection", () => {
  it("counts changed lines and preserves context and exact line numbers", () => {
    const report = inspectGitPatch(patch);
    expect(report).toMatchObject({ additions: 2, deletions: 1, hunks: 1 });
    expect(report.files).toHaveLength(1);
    expect(report.files[0]).toMatchObject({ oldPath: "a/a.txt", newPath: "b/a.txt", additions: 2, deletions: 1 });
    expect(report.files[0]!.hunks[0]).toMatchObject({ oldStart: "1", oldCount: 2, newStart: "1", newCount: 3, heading: "heading",
      lines: [
        { kind: "context", oldLine: "1", newLine: "1", text: "keep" },
        { kind: "deletion", oldLine: "2", newLine: null, text: "old" },
        { kind: "addition", oldLine: null, newLine: "2", text: "new" },
        { kind: "addition", oldLine: null, newLine: "3", text: "more" },
      ] });
  });
  it("handles omitted counts, zero counts and new/deleted files", () => {
    expect(inspectGitPatch(header + "@@ -2 +2 @@\n-a\n+b").additions).toBe(1);
    const added = "diff --git a/new b/new\nnew file mode 100644\n--- /dev/null\n+++ b/new\n@@ -0,0 +1 @@\n+new\n";
    const removed = "diff --git a/old b/old\ndeleted file mode 100644\n--- a/old\n+++ /dev/null\n@@ -1 +0,0 @@\n-old\n";
    expect(inspectGitPatch(added + removed)).toMatchObject({ additions: 1, deletions: 1, hunks: 2 });
    expect(inspectGitPatch(added).files[0]!.oldPath).toBe("/dev/null");
  });
  it("retains metadata-only modes, empty files, renames, copies and quoted paths verbatim", () => {
    const rename = 'diff --git "a/old name" "b/new name"\nsimilarity index 100%\nrename from old name\nrename to new name\n';
    const copy = 'diff --git "a/a\\tfile" "b/copy\\tfile"\nsimilarity index 100%\ncopy from "a\\tfile"\ncopy to "copy\\tfile"\n';
    const mode = "diff --git a/x b/x\nold mode 100644\nnew mode 100755\n";
    const empty = "diff --git a/y b/y\nnew file mode 100644\nindex 0000000..e69de29\n";
    const report = inspectGitPatch(rename + copy + mode + empty);
    expect(report.files).toHaveLength(4);
    expect(report.files[0]!.metadata).toContain("rename to new name");
    expect(report.files[1]!.header).toContain('"a/a\\tfile"');
    expect(report).toMatchObject({ hunks: 0, additions: 0, deletions: 0 });
  });
  it("accepts CRLF and no-newline markers without adding to line counts", () => {
    const input = header + "@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+b\n\\ No newline at end of file\n";
    const report = inspectGitPatch(input.replaceAll("\n", "\r\n"));
    expect(report).toMatchObject({ additions: 1, deletions: 1 });
    expect(report.files[0]!.hunks[0]!.lines.filter(l => l.kind === "marker")).toHaveLength(2);
  });
  it("preserves starts beyond Number precision and treats header-like content as data", () => {
    const report = inspectGitPatch(header + "@@ -9007199254740993 +9007199254740993 @@\n--- a/looks-like-header\n+++ b/still-content\n");
    expect(report.files[0]!.hunks[0]!.lines[1]!.newLine).toBe("9007199254740993");
    expect(report.files[0]!.hunks[0]!.lines[0]!.text).toBe("-- a/looks-like-header");
  });
  it("does not interpret markup or paths as objects/code", () => {
    const report = inspectGitPatch('diff --git a/__proto__ b/<img>\n--- a/__proto__\n+++ b/<img>\n@@ -1 +1 @@\n-x\n+<script>throw 1</script>\n');
    expect(report.files[0]!.newPath).toBe("b/<img>");
    expect(report.files[0]!.hunks[0]!.lines[1]!.text).toBe("<script>throw 1</script>");
    expect({}.toString).toBe(Object.prototype.toString);
  });
  it.each([
    header + "@@ -1,2 +1,2 @@\n-a\n+b\n",
    header + "@@ -1 +1 @@\n-a\n+b\n+extra\n",
    header + "@@ -0 +1 @@\n-a\n+b\n",
    header + "@@ -1,2001 +1 @@\n-a\n+b\n",
    header + "@@ -1 +1 @@\n-a\n+b\n@@ -1 +1 @@\n-a\n+b\n",
    header + "@@ -1 +1 @@\n\\ No newline at end of file\n-a\n+b\n",
    header + "@@ -1 +1 @@\n-a\n+b\n\\ No newline at end of file\n\\ No newline at end of file\n",
    "diff --git a/x b/x\nrename from x\n",
    "diff --git a/x b/x\n",
    header + "mystery data\n",
    header + "@@ -123456789012345678901 +1 @@\n-a\n+b\n",
    header + "@@ -1 +1 @@\n-a\n",
    header + "@@ -1,2 +1,2 @@\n-a\n\\ No newline at end of file\n-b\n+c\n+d\n",
    "diff --git a/x b/x\n--- a/x\n",
  ])("rejects malformed/incomplete records with no partial report", (input) => fails(input, "PATCH_SYNTAX"));
  it.each([
    "diff --cc a\n", "diff --combined a\n",
    "diff --git a/x b/x\nGIT binary patch\nliteral 1\nA\n",
    "diff --git a/x b/x\nBinary files a/x and b/x differ\n",
    "--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b\n",
    "From 123 Mon Sep 17 00:00:00 2001\n" + patch,
  ])("rejects unsupported formats explicitly", input => fails(input, "PATCH_UNSUPPORTED"));
  it("enforces input, line, file and hunk bounds without truncation", () => {
    fails("x".repeat(PATCH_LIMITS.bytes + 1), "INPUT_TOO_LARGE");
    fails("界".repeat(22000), "INPUT_TOO_LARGE");
    fails("\n".repeat(PATCH_LIMITS.lines + 1), "PATCH_LIMIT");
    const mode = "diff --git a/x b/x\nold mode 100644\nnew mode 100755\n";
    expect(inspectGitPatch(mode.repeat(PATCH_LIMITS.files)).files).toHaveLength(PATCH_LIMITS.files);
    fails(mode.repeat(PATCH_LIMITS.files + 1), "PATCH_LIMIT");
    const hunks = Array.from({ length: PATCH_LIMITS.hunks + 1 }, (_, i) => `@@ -${i + 1} +${i + 1} @@\n-a\n+b\n`);
    expect(inspectGitPatch(header + hunks.slice(0, -1).join("")).hunks).toBe(PATCH_LIMITS.hunks);
    fails(header + hunks.join(""), "PATCH_LIMIT");
    fails("", "PATCH_EMPTY");
  });
});
