import { assertInputSize, ToolError } from "./errors.ts";

export const PATCH_LIMITS = { bytes: 65536, lines: 2000, files: 50, hunks: 200, startDigits: 20, deferredCharacters: 2048 } as const;
export interface PatchLine { kind: "context" | "addition" | "deletion" | "marker"; oldLine: string | null; newLine: string | null; text: string }
export interface PatchHunk { oldStart: string; oldCount: number; newStart: string; newCount: number; heading: string; lines: PatchLine[] }
export interface PatchFile { header: string; oldPath: string | null; newPath: string | null; metadata: string[]; hunks: PatchHunk[]; additions: number; deletions: number }
export interface GitPatchReport { files: PatchFile[]; hunks: number; additions: number; deletions: number }
export const PATCH_SAMPLE = "diff --git a/greeting.txt b/greeting.txt\nindex 1234567..abcdef0 100644\n--- a/greeting.txt\n+++ b/greeting.txt\n@@ -1,2 +1,3 @@ greeting\n Hello\n-world\n+developer\n+Welcome!\ndiff --git a/old.txt b/new.txt\nsimilarity index 100%\nrename from old.txt\nrename to new.txt\n";
function fail(code = "PATCH_SYNTAX"): never { throw new ToolError(code); }
const unsupported = (line: string) => /^(?:diff --(?:cc|combined) |GIT binary patch$|Binary files |@@@)/.test(line);

/** Read-only structural inspection. Paths and content never become file operations. */
export function inspectGitPatch(input: string): GitPatchReport {
  assertInputSize(input, PATCH_LIMITS.bytes);
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  if (lines.length > PATCH_LIMITS.lines) fail("PATCH_LIMIT");
  if (!input.trim()) fail("PATCH_EMPTY");
  if (!lines[0]!.startsWith("diff --git ")) fail("PATCH_UNSUPPORTED");
  const report: GitPatchReport = { files: [], hunks: 0, additions: 0, deletions: 0 };
  let position = 0;
  while (position < lines.length) {
    if (unsupported(lines[position]!)) fail("PATCH_UNSUPPORTED");
    const fileHeader = /^diff --git (.+)$/.exec(lines[position++]!);
    if (!fileHeader) fail();
    if (report.files.length >= PATCH_LIMITS.files) fail("PATCH_LIMIT");
    const file: PatchFile = { header: fileHeader[1]!, oldPath: null, newPath: null, metadata: [], hunks: [], additions: 0, deletions: 0 };
    let oldEnd = 0n, newEnd = 0n;
    const metadataKinds = new Set<string>();
    while (position < lines.length && !lines[position]!.startsWith("diff --git ")) {
      const line = lines[position]!;
      if (unsupported(line)) fail("PATCH_UNSUPPORTED");
      if (line.startsWith("@@ ")) {
        if (file.oldPath === null || file.newPath === null) fail();
        const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?: (.*))?$/.exec(line);
        if (!match || match[1]!.length > PATCH_LIMITS.startDigits || match[3]!.length > PATCH_LIMITS.startDigits) fail();
        const oldCount = Number(match[2] ?? "1"), newCount = Number(match[4] ?? "1");
        if (![oldCount, newCount].every(n => Number.isSafeInteger(n) && n <= PATCH_LIMITS.lines) || (oldCount === 0 && newCount === 0)) fail();
        let oldLine = BigInt(match[1]!), newLine = BigInt(match[3]!);
        if ((oldCount > 0 && oldLine === 0n) || (newCount > 0 && newLine === 0n)) fail();
        const oldPosition = oldLine - (oldCount ? 1n : 0n), newPosition = newLine - (newCount ? 1n : 0n);
        if (oldPosition < oldEnd || newPosition < newEnd) fail();
        oldEnd = oldPosition + BigInt(oldCount); newEnd = newPosition + BigInt(newCount);
        if (report.hunks >= PATCH_LIMITS.hunks) fail("PATCH_LIMIT");
        const hunk: PatchHunk = { oldStart: oldLine.toString(), oldCount, newStart: newLine.toString(), newCount, heading: match[5] ?? "", lines: [] };
        position++;
        let oldUsed = 0, newUsed = 0;
        while (position < lines.length) {
          const content = lines[position]!;
          if (content === "\\ No newline at end of file") {
            const previous = hunk.lines.at(-1)?.kind;
            if (!previous || previous === "marker" ||
              (previous !== "addition" && oldUsed !== oldCount) ||
              (previous !== "deletion" && newUsed !== newCount)) fail();
            hunk.lines.push({ kind: "marker", oldLine: null, newLine: null, text: content }); position++; continue;
          }
          if (oldUsed === oldCount && newUsed === newCount) break;
          const prefix = content[0];
          if (prefix !== " " && prefix !== "+" && prefix !== "-") fail();
          const consumesOld = prefix !== "+", consumesNew = prefix !== "-";
          if ((consumesOld && oldUsed >= oldCount) || (consumesNew && newUsed >= newCount)) fail();
          hunk.lines.push({ kind: prefix === " " ? "context" : prefix === "+" ? "addition" : "deletion", oldLine: consumesOld ? oldLine.toString() : null, newLine: consumesNew ? newLine.toString() : null, text: content.slice(1) });
          if (consumesOld) { oldUsed++; oldLine++; }
          if (consumesNew) { newUsed++; newLine++; }
          if (prefix === "+") file.additions++;
          if (prefix === "-") file.deletions++;
          position++;
        }
        if (oldUsed !== oldCount || newUsed !== newCount) fail();
        file.hunks.push(hunk); report.hunks++; continue;
      }
      // All extended metadata precedes the file markers and hunks.
      if (file.hunks.length) fail();
      if (line.startsWith("--- ")) {
        if (file.oldPath !== null || !lines[position + 1]?.startsWith("+++ ")) fail();
        file.oldPath = line.slice(4); file.newPath = lines[position + 1]!.slice(4);
        if (!file.oldPath || !file.newPath) fail();
        position += 2; continue;
      }
      if (file.oldPath !== null) fail();
      let kind: string | null = null;
      if (/^index [0-9a-f]{4,64}\.\.[0-9a-f]{4,64}(?: [0-7]{6})?$/.test(line)) kind = "index";
      else if (/^(?:old mode|new mode|new file mode|deleted file mode) [0-7]{6}$/.test(line)) kind = line.slice(0, line.lastIndexOf(" "));
      else if (/^(?:similarity|dissimilarity) index (?:100|[1-9]?\d)%$/.test(line)) kind = line.split(" ")[0]!;
      else {
        const path = /^(rename from|rename to|copy from|copy to) (.+)$/.exec(line);
        if (path) kind = path[1]!;
      }
      if (!kind || metadataKinds.has(kind)) fail();
      metadataKinds.add(kind); file.metadata.push(line); position++;
    }
    for (const prefix of ["rename", "copy"]) {
      if (metadataKinds.has(`${prefix} from`) !== metadataKinds.has(`${prefix} to`)) fail();
    }
    if (metadataKinds.has("rename from") && metadataKinds.has("copy from")) fail();
    if (metadataKinds.has("old mode") !== metadataKinds.has("new mode")) fail();
    if (metadataKinds.has("new file mode") && metadataKinds.has("deleted file mode")) fail();
    if (file.oldPath !== null && !file.hunks.length) fail();
    if (!file.hunks.length && !["rename from", "copy from", "old mode", "new file mode", "deleted file mode"].some(k => metadataKinds.has(k))) fail();
    report.files.push(file); report.additions += file.additions; report.deletions += file.deletions;
  }
  return report;
}
