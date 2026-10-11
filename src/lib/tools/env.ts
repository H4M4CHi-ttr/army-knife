import { assertInputSize, ToolError } from "./errors";

export const ENV_LIMITS = {
  inputBytes: 256 * 1024,
  lines: 10_000,
  definitions: 2_000,
  keyLength: 128,
  issues: 200,
} as const;

export type EnvIssueCode =
  | "ENV_INVALID_ASSIGNMENT"
  | "ENV_KEY_TOO_LONG"
  | "ENV_UNCLOSED_QUOTE"
  | "ENV_TRAILING_CONTENT"
  | "ENV_NUL"
  | "ENV_DUPLICATE";
export interface EnvIssue {
  code: EnvIssueCode;
  line: number;
  key?: string;
}
export interface EnvVariable {
  key: string;
  value: string;
  line: number;
  occurrences: number[];
}
export interface EnvReport {
  variables: EnvVariable[];
  definitions: number;
  lines: number;
  emptyValues: number;
  duplicateKeys: number;
  invalidDefinitions: number;
  issues: EnvIssue[];
  issuesTruncated: boolean;
}
export type EnvChangeKind = "left-only" | "right-only" | "changed" | "equal";
export interface EnvChange {
  key: string;
  kind: EnvChangeKind;
  left: EnvVariable | null;
  right: EnvVariable | null;
}
export interface EnvComparison {
  left: EnvReport;
  right: EnvReport;
  changes: EnvChange[];
  summary: Record<EnvChangeKind, number>;
  /** False means malformed definitions were omitted; missing-key conclusions are incomplete. */
  complete: boolean;
}

/**
 * A deliberately bounded dotenv-style profile, never a shell interpreter.
 * ASCII identifier keys, optional export, # comments, and multiline single /
 * double quotes are supported. Double-quoted \\n and \\r become line breaks;
 * other backslashes remain literal. No variable or command substitution runs.
 * CRLF/CR input is normalized to LF. The last valid definition wins, visibly.
 */
export function inspectEnv(input: string): EnvReport {
  assertInputSize(input, ENV_LIMITS.inputBytes);
  const source = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = source.split("\n");
  const lineCount = source === "" ? 0 : source.endsWith("\n") ? lines.length - 1 : lines.length;
  if (lineCount > ENV_LIMITS.lines) throw new ToolError("ENV_TOO_MANY_LINES");
  const values = new Map<string, EnvVariable>();
  const issues: EnvIssue[] = [];
  let issueCount = 0;
  let definitions = 0;
  let invalidDefinitions = 0;
  const issue = (code: EnvIssueCode, line: number, key?: string): void => {
    issueCount++;
    if (code !== "ENV_DUPLICATE") invalidDefinitions++;
    if (issues.length < ENV_LIMITS.issues) issues.push({ code, line, ...(key ? { key } : {}) });
  };

  for (let index = 0; index < lines.length; index++) {
    const line = index + 1;
    let content = lines[index]!.trimStart();
    if (!content || content.startsWith("#")) continue;
    content = content.replace(/^export[\t ]+/, "");
    const assignment = /^([A-Za-z_][A-Za-z0-9_]*)[\t ]*=[\t ]*/.exec(content);
    if (!assignment) {
      issue("ENV_INVALID_ASSIGNMENT", line);
      continue;
    }
    const key = assignment[1]!;
    if (key.length > ENV_LIMITS.keyLength) {
      issue("ENV_KEY_TOO_LONG", line);
      continue;
    }
    let remaining = content.slice(assignment[0].length);
    let value: string;
    const quote = remaining[0];
    if (quote === '"' || quote === "'") {
      const chunks: string[] = [];
      remaining = remaining.slice(1);
      let end = -1;
      while (true) {
        let backslashes = 0;
        for (let offset = 0; offset < remaining.length; offset++) {
          const character = remaining[offset];
          if (character === quote && backslashes % 2 === 0) {
            end = offset;
            break;
          }
          backslashes = character === "\\" ? backslashes + 1 : 0;
        }
        if (end >= 0) break;
        chunks.push(remaining);
        if (index + 1 >= lines.length) break;
        chunks.push("\n");
        remaining = lines[++index]!;
      }
      if (end < 0) {
        issue("ENV_UNCLOSED_QUOTE", line, key);
        continue;
      }
      const tail = remaining.slice(end + 1).trimStart();
      if (tail && !tail.startsWith("#")) {
        issue("ENV_TRAILING_CONTENT", line, key);
        continue;
      }
      chunks.push(remaining.slice(0, end));
      value = chunks.join("");
      if (quote === '"') value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    } else {
      const comment = remaining.indexOf("#");
      value = (comment >= 0 ? remaining.slice(0, comment) : remaining).trim();
    }
    if (value.includes("\0")) {
      issue("ENV_NUL", line, key);
      continue;
    }
    if (++definitions > ENV_LIMITS.definitions) throw new ToolError("ENV_TOO_MANY_DEFINITIONS");
    const previous = values.get(key);
    if (previous) {
      issue("ENV_DUPLICATE", line, key);
      // These records are private until parsing finishes. Append once per
      // definition instead of copying every earlier duplicate's location.
      previous.value = value;
      previous.line = line;
      previous.occurrences.push(line);
    } else {
      values.set(key, { key, value, line, occurrences: [line] });
    }
  }
  const variables = [...values.values()].sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
  );
  return {
    variables,
    definitions,
    lines: lineCount,
    emptyValues: variables.filter((variable) => variable.value === "").length,
    duplicateKeys: variables.filter((variable) => variable.occurrences.length > 1).length,
    invalidDefinitions,
    issues,
    issuesTruncated: issueCount > issues.length,
  };
}

export function compareEnv(leftInput: string, rightInput: string): EnvComparison {
  const left = inspectEnv(leftInput);
  const right = inspectEnv(rightInput);
  const leftKeys = new Map(left.variables.map((variable) => [variable.key, variable]));
  const rightKeys = new Map(right.variables.map((variable) => [variable.key, variable]));
  const keys = [...new Set([...leftKeys.keys(), ...rightKeys.keys()])].sort();
  const summary: Record<EnvChangeKind, number> = {
    "left-only": 0,
    "right-only": 0,
    changed: 0,
    equal: 0,
  };
  const changes = keys.map((key): EnvChange => {
    const a = leftKeys.get(key) ?? null;
    const b = rightKeys.get(key) ?? null;
    const kind: EnvChangeKind = !a
      ? "right-only"
      : !b
        ? "left-only"
        : a.value === b.value
          ? "equal"
          : "changed";
    summary[kind]++;
    return { key, kind, left: a, right: b };
  });
  return {
    left,
    right,
    changes,
    summary,
    complete: left.invalidDefinitions === 0 && right.invalidDefinitions === 0,
  };
}
