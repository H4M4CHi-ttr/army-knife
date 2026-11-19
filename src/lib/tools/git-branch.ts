import { assertInputSize, ToolError } from "./errors";

export const GIT_BRANCH_LIMITS = {
  inputBytes: 8192, names: 128, nameBytes: 512, outputBytes: 131072,
  previewNames: 32, deferredCharacters: 2048,
} as const;
export type GitBranchIssue = "empty" | "leadingDash" | "reservedHead" |
  "emptyComponent" | "dotComponent" | "lockSuffix" | "doubleDot" |
  "trailingDot" | "reflog" | "forbiddenCharacter";
export interface GitBranchRow {
  name: string;
  nameBytes: number;
  valid: boolean;
  fullRef: string | null;
  issues: GitBranchIssue[];
}
export interface GitBranchesReport {
  branches: GitBranchRow[];
  validCount: number;
  invalidCount: number;
}

function scalarText(text: string): void {
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new ToolError("GIT_BRANCH_UNICODE");
    } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new ToolError("GIT_BRANCH_UNICODE");
  }
}

/** Literal UTF-8 branch syntax only. Never expands a revision or reads a repository. */
export function inspectGitBranches(input: string): GitBranchesReport {
  assertInputSize(input, GIT_BRANCH_LIMITS.inputBytes);
  scalarText(input);
  let values: unknown;
  try { values = JSON.parse(input); }
  catch { throw new ToolError("GIT_BRANCH_JSON"); }
  if (!Array.isArray(values) || values.some(v => typeof v !== "string")) throw new ToolError("GIT_BRANCH_SHAPE");
  if (values.length < 1 || values.length > GIT_BRANCH_LIMITS.names) throw new ToolError("GIT_BRANCH_COUNT");
  const encoder = new TextEncoder();
  const branches = (values as string[]).map((name): GitBranchRow => {
    scalarText(name);
    const nameBytes = encoder.encode(name).length;
    if (nameBytes > GIT_BRANCH_LIMITS.nameBytes) throw new ToolError("GIT_BRANCH_NAME_LIMIT");
    const components = name.split("/");
    const issues: GitBranchIssue[] = [];
    if (!name) issues.push("empty");
    if (name.startsWith("-")) issues.push("leadingDash");
    if (name === "HEAD") issues.push("reservedHead");
    if (name && components.some(c => !c)) issues.push("emptyComponent");
    if (components.some(c => c.startsWith("."))) issues.push("dotComponent");
    if (components.some(c => c.endsWith(".lock"))) issues.push("lockSuffix");
    if (name.includes("..")) issues.push("doubleDot");
    if (name.endsWith(".")) issues.push("trailingDot");
    if (name.includes("@{")) issues.push("reflog");
    if (Array.from(name).some(c => c.charCodeAt(0) <= 0x20 || c.charCodeAt(0) === 0x7f || "~^:?*[\\".includes(c))) issues.push("forbiddenCharacter");
    const valid = issues.length === 0;
    return { name, nameBytes, valid, fullRef: valid ? "refs/heads/" + name : null, issues };
  });
  const validCount = branches.filter(b => b.valid).length;
  const report = { branches, validCount, invalidCount: branches.length - validCount };
  if (encoder.encode(JSON.stringify(report, null, 2)).length > GIT_BRANCH_LIMITS.outputBytes) throw new ToolError("GIT_BRANCH_OUTPUT_LIMIT");
  return report;
}
