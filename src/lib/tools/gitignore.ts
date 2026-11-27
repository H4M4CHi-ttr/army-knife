import { assertInputSize, ToolError } from "./errors";

export const GITIGNORE_LIMITS = {
  bytes: 64 * 1024,
  lines: 512,
  lineBytes: 512,
  depth: 32,
  work: 25_000_000,
  preview: 32,
} as const;

export interface GitignoreInput { rules: string; paths: string; windows: boolean }
interface WinningRule { line: number; pattern: string }
interface GitignoreRow {
  row: number;
  path: string;
  status: "ignored" | "included" | "invalid";
  rule?: WinningRule;
  ancestor?: string;
}
export interface GitignoreReport {
  rows: GitignoreRow[];
  counts: Record<GitignoreRow["status"], number>;
  invalidRules: number[];
}

// Git wildcards and bracket expressions operate on bytes. The application
// accepts UTF-8 text, including literal non-ASCII path names and patterns.
const encoder = new TextEncoder();
const slash = 47;
const star = 42;
const escape = 92;
const bracket = 93;
type Token =
  | { kind: "literal"; byte: number }
  | { kind: "class"; members: Uint8Array }
  | { kind: "single" | "star" | "recursive" | "directories" };

interface Rule {
  display: WinningRule;
  tokens: Token[];
  anchored: boolean;
  directory: boolean;
  negative: boolean;
}

const asciiClasses: Record<string, RegExp> = {
  alnum: /[A-Za-z0-9]/,
  alpha: /[A-Za-z]/,
  blank: /[ \t]/,
  // Git defines this named class by the ASCII control byte range.
  // eslint-disable-next-line no-control-regex
  cntrl: /[\x00-\x1f\x7f]/,
  digit: /[0-9]/,
  graph: /[\x21-\x7e]/,
  lower: /[a-z]/,
  print: /[\x20-\x7e]/,
  punct: /[!-/:-@[-`{-~]/,
  space: /[ \t-\r]/,
  upper: /[A-Z]/,
  xdigit: /[0-9A-Fa-f]/,
};

function readClass(pattern: Uint8Array, start: number) {
  const members = new Uint8Array(256);
  let index = start;
  const negative = pattern[index] === 33 || pattern[index] === 94; // ! or ^
  if (negative) index++;
  let previous = 0;
  do {
    let byte = pattern[index];
    if (byte === undefined) return null;
    if (byte === escape) {
      byte = pattern[++index];
      if (byte === undefined) return null;
      members[byte] = 1;
    } else if (byte === 45 && previous && pattern[index + 1] !== undefined && pattern[index + 1] !== bracket) {
      byte = pattern[++index];
      if (byte === escape) byte = pattern[++index];
      if (byte === undefined) return null;
      members.fill(1, previous, byte + 1);
      byte = 0;
    } else if (byte === 91 && pattern[index + 1] === 58) {
      const end = pattern.indexOf(bracket, index + 2);
      if (end === -1) return null;
      if (end > index + 2 && pattern[end - 1] === 58) {
        const name = String.fromCharCode(...pattern.subarray(index + 2, end - 1));
        if (!Object.hasOwn(asciiClasses, name)) return null;
        for (let value = 0; value < 128; value++) {
          if (asciiClasses[name].test(String.fromCharCode(value))) members[value] = 1;
        }
        index = end;
        byte = 0;
      } else {
        members[byte] = 1;
      }
    } else {
      members[byte] = 1;
    }
    previous = byte;
    index++;
  } while (pattern[index] !== bracket);

  if (negative) {
    for (let value = 0; value < members.length; value++) members[value] ^= 1;
  }
  members[slash] = 0;
  return { token: { kind: "class", members } as const, end: index };
}

function compilePattern(pattern: Uint8Array, anchored: boolean): Token[] | null {
  const tokens: Token[] = [];
  for (let index = 0; index < pattern.length; index++) {
    const byte = pattern[index];
    if (byte === star) {
      const start = index;
      while (pattern[index + 1] === star) index++;
      const next = pattern[index + 1];
      const recursive = anchored && index > start && (start === 0 || pattern[start - 1] === slash);
      if (recursive && next === slash) {
        tokens.push({ kind: "directories" });
        index++;
      } else if (recursive && (next === undefined || (next === escape && pattern[index + 2] === slash))) {
        tokens.push({ kind: "recursive" });
      } else {
        tokens.push({ kind: "star" });
      }
    } else if (byte === 63) { // ?
      tokens.push({ kind: "single" });
    } else if (byte === 91) { // [
      const characterClass = readClass(pattern, index + 1);
      if (!characterClass) return null;
      tokens.push(characterClass.token);
      index = characterClass.end;
    } else {
      const literal = byte === escape ? pattern[++index] : byte;
      if (literal === undefined) return null;
      tokens.push({ kind: "literal", byte: literal });
    }
  }
  return tokens;
}

function trimRule(line: string): string {
  let end = 0;
  for (let index = 0; index < line.length; index++) {
    if (line[index] === " ") continue;
    if (line[index] === "\\") index++;
    end = index + 1;
  }
  return line.slice(0, end);
}

function splitLines(input: string): string[] {
  assertInputSize(input, GITIGNORE_LIMITS.bytes);
  const normalized = input.replaceAll("\r\n", "\n");
  if (normalized.includes("\0") || normalized.includes("\r") || /[\uD800-\uDFFF]/u.test(normalized)) {
    throw new ToolError("GITIGNORE_TEXT");
  }
  const lines = normalized.split("\n");
  if (lines.at(-1) === "") lines.pop();
  if (lines.length > GITIGNORE_LIMITS.lines ||
      lines.some(line => encoder.encode(line).length > GITIGNORE_LIMITS.lineBytes)) {
    throw new ToolError("GITIGNORE_LINE_LIMIT");
  }
  return lines;
}

/** All reachable byte offsets after the final token, using two rows and no backtracking. */
function matchingEnds(tokens: Token[], path: Uint8Array, start: number, end: number, budget: { remaining: number }) {
  const width = end - start + 1;
  budget.remaining -= tokens.length * width;
  if (budget.remaining < 0) throw new ToolError("GITIGNORE_WORK_LIMIT");
  let previous = new Uint8Array(width);
  let next = new Uint8Array(width);
  previous[0] = 1;
  for (const token of tokens) {
    const permitsEmpty = token.kind === "star" || token.kind === "recursive" || token.kind === "directories";
    next[0] = permitsEmpty ? previous[0] : 0;
    let earlier = 0;
    for (let offset = 1; offset < width; offset++) {
      const byte = path[start + offset - 1];
      switch (token.kind) {
        case "literal":
          next[offset] = byte === token.byte ? previous[offset - 1] : 0;
          break;
        case "class":
          next[offset] = token.members[byte] & previous[offset - 1];
          break;
        case "single":
          next[offset] = byte !== slash ? previous[offset - 1] : 0;
          break;
        case "star":
          next[offset] = previous[offset] | (byte !== slash ? next[offset - 1] : 0);
          break;
        case "recursive":
          next[offset] = previous[offset] | next[offset - 1];
          break;
        case "directories":
          earlier |= previous[offset - 1];
          next[offset] = previous[offset] | (byte === slash ? earlier : 0);
          break;
      }
    }
    const swap = previous;
    previous = next;
    next = swap;
  }
  return previous;
}

function inspectPath(row: number, path: string, windows: boolean, rules: Rule[], budget: { remaining: number }): GitignoreRow {
  const normalized = windows ? path.replaceAll("\\", "/") : path;
  const directory = normalized.endsWith("/");
  const canonical = directory ? normalized.slice(0, -1) : normalized;
  const names = canonical.split("/");
  if (names.length > GITIGNORE_LIMITS.depth || names.some(name => !name || name === "." || name === "..") ||
      (windows && /^[a-z]:/i.test(canonical))) {
    return { row, path, status: "invalid" };
  }
  const bytes = encoder.encode(canonical);
  const ends: number[] = [];
  for (let index = 0; index < bytes.length; index++) {
    if (bytes[index] === slash) ends.push(index);
  }
  ends.push(bytes.length);

  // Evaluate anchored patterns against the full path once. Their reachable
  // offsets also give the matches for each ancestor prefix.
  const winners: (Rule | undefined)[] = Array.from({ length: names.length }, () => undefined);
  let componentsToCheck = names.length;
  let unresolved = names.length;
  for (let index = rules.length - 1; index >= 0 && unresolved; index--) {
    const rule = rules[index];
    const eligible = Math.min(componentsToCheck, rule.directory && !directory ? names.length - 1 : names.length);
    let anchored: Uint8Array | undefined;
    for (let component = 0; component < eligible; component++) {
      if (winners[component]) continue;
      const end = ends[component];
      let matched: number;
      if (rule.anchored) {
        anchored ??= matchingEnds(rule.tokens, bytes, 0, ends[eligible - 1], budget);
        matched = anchored[end];
      } else {
        const start = component ? ends[component - 1] + 1 : 0;
        matched = matchingEnds(rule.tokens, bytes, start, end, budget)[end - start];
      }
      if (matched) {
        winners[component] = rule;
        unresolved--;
        // If this directory blocks the path, subsequent rules only matter
        // for its ancestors. A lower-priority rule cannot reopen it.
        if (!rule.negative && component < names.length - 1) {
          componentsToCheck = component;
          unresolved = component - winners.slice(0, component).filter(Boolean).length;
          break;
        }
      }
    }
  }
  for (let component = 0; component < names.length - 1; component++) {
    const winner = winners[component];
    if (winner && !winner.negative) {
      return { row, path, status: "ignored", rule: winner.display, ancestor: names.slice(0, component + 1).join("/") + "/" };
    }
  }
  const winner = winners.at(-1);
  if (!winner) return { row, path, status: "included" };
  return { row, path, status: winner.negative ? "included" : "ignored", rule: winner.display };
}

export function isInstantGitignore(input: GitignoreInput): boolean {
  const { rules, paths } = input;
  return rules.length + paths.length <= 2048 && rules.length * paths.length <= 80_000;
}

export function inspectGitignore(input: GitignoreInput): GitignoreReport {
  const ruleLines = splitLines(input.rules);
  const paths = splitLines(input.paths);
  const rules: Rule[] = [];
  const invalidRules: number[] = [];
  for (const [index, raw] of ruleLines.entries()) {
    const line = trimRule(index === 0 ? raw.replace(/^\uFEFF/, "") : raw);
    if (!line || line.startsWith("#")) continue;
    const negative = line.startsWith("!");
    let pattern = negative ? line.slice(1) : line;
    const directory = pattern.endsWith("/");
    if (directory) pattern = pattern.slice(0, -1);
    const anchored = pattern.includes("/");
    if (pattern.startsWith("/")) pattern = pattern.slice(1);
    if (!pattern) continue;
    const tokens = compilePattern(encoder.encode(pattern), anchored);
    if (tokens) rules.push({ display: { line: index + 1, pattern: line }, tokens, anchored, directory, negative });
    else invalidRules.push(index + 1);
  }
  const rows: GitignoreRow[] = [];
  const counts = { ignored: 0, included: 0, invalid: 0 };
  const budget = { remaining: GITIGNORE_LIMITS.work };
  for (const [index, path] of paths.entries()) {
    if (!path) continue;
    const result = inspectPath(index + 1, path, input.windows, rules, budget);
    counts[result.status]++;
    rows.push(result);
  }
  return { rows, counts, invalidRules };
}
