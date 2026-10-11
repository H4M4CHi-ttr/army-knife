import { ToolError } from "./errors";

export interface ModeDescription {
  mode: number;
  /** Four octal digits include setuid, setgid, and sticky bits. */
  octal: string;
  /** Permission text only; no file-type prefix or ACL indicator. */
  symbolic: string;
}

export interface UmaskResult {
  mask: string;
  file: ModeDescription;
  directory: ModeDescription;
}

const MAX_OCTAL_INPUT_CHARACTERS = 16;
const MAX_SYMBOLIC_INPUT_BYTES = 256;
const MAX_SYMBOLIC_CLAUSES = 32;
const MAX_MODE = 0o7777;

function assertMode(mode: number): void {
  if (!Number.isInteger(mode) || mode < 0 || mode > MAX_MODE) {
    throw new ToolError("CHMOD_INVALID_MODE");
  }
}

/** Parse only three or four octal digits; no numeric prefixes or file-type bits. */
export function parseOctalMode(input: string): number {
  if (input.length > MAX_OCTAL_INPUT_CHARACTERS || !/^[0-7]{3,4}$/.test(input.trim())) {
    throw new ToolError("CHMOD_INVALID_MODE");
  }
  return Number.parseInt(input.trim(), 8);
}

export function describeMode(mode: number): ModeDescription {
  assertMode(mode);
  const groups = [
    { shift: 6, special: 0o4000, enabled: "s", disabled: "S" },
    { shift: 3, special: 0o2000, enabled: "s", disabled: "S" },
    { shift: 0, special: 0o1000, enabled: "t", disabled: "T" },
  ];
  const symbolic = groups
    .map(({ shift, special, enabled, disabled }) => {
      const bits = (mode >> shift) & 0o7;
      const execute = mode & special ? (bits & 0o1 ? enabled : disabled) : bits & 0o1 ? "x" : "-";
      return `${bits & 0o4 ? "r" : "-"}${bits & 0o2 ? "w" : "-"}${execute}`;
    })
    .join("");
  return { mode, octal: mode.toString(8).padStart(4, "0"), symbolic };
}

/**
 * Evaluate an explicit-who chmod subset in memory. This does not inspect or
 * change files, apply an ambient umask, copy permissions, or implement X.
 * Clauses run left to right. For directories, '=' preserves setuid/setgid
 * unless that clause mentions s; u-s and g-s explicitly remove those bits.
 * Sticky is always cleared by an '=' clause that selects o, including a=.
 */
export function applySymbolicMode(
  base: number,
  expression: string,
  directory = false,
): ModeDescription {
  assertMode(base);
  // Check raw input before trimming. Bound encoding allocations too.
  if (
    expression.length > MAX_SYMBOLIC_INPUT_BYTES ||
    new TextEncoder().encode(expression).byteLength > MAX_SYMBOLIC_INPUT_BYTES
  ) {
    throw new ToolError("CHMOD_SYMBOLIC_LIMIT");
  }
  const clauses = expression.trim().split(",");
  if (clauses.length > MAX_SYMBOLIC_CLAUSES) throw new ToolError("CHMOD_SYMBOLIC_LIMIT");
  let mode = base;
  for (const clause of clauses) {
    const match = /^([ugoa]+)([+\-=])([rwxst]*)$/.exec(clause);
    if (!match || (match[2] !== "=" && match[3] === "")) {
      throw new ToolError("CHMOD_INVALID_SYMBOLIC");
    }
    const who = match[1]!;
    const operator = match[2]!;
    const permissions = match[3]!;
    const all = who.includes("a");
    const selected = [all || who.includes("u"), all || who.includes("g"), all || who.includes("o")];
    const ordinary =
      (permissions.includes("r") ? 0o4 : 0) |
      (permissions.includes("w") ? 0o2 : 0) |
      (permissions.includes("x") ? 0o1 : 0);
    let changed = 0;
    let cleared = 0;
    for (let index = 0; index < selected.length; index += 1) {
      if (!selected[index]) continue;
      const shift = (2 - index) * 3;
      const special = [0o4000, 0o2000, 0o1000][index]!;
      const mentionsSpecial = permissions.includes(index === 2 ? "t" : "s");
      changed |= ordinary << shift;
      if (mentionsSpecial) changed |= special;
      cleared |= 0o7 << shift;
      if (!directory || index === 2 || mentionsSpecial) cleared |= special;
    }
    if (operator === "+") mode |= changed;
    else if (operator === "-") mode &= ~changed;
    else mode = (mode & ~cleared) | changed;
  }
  return describeMode(mode);
}

/** Creation defaults: regular files begin at 0666, directories at 0777. */
export function calculateUmask(input: string): UmaskResult {
  const trimmed = input.trim();
  if (input.length > MAX_OCTAL_INPUT_CHARACTERS || !/^0?[0-7]{3}$/.test(trimmed)) {
    throw new ToolError("CHMOD_INVALID_UMASK");
  }
  const mask = Number.parseInt(trimmed, 8);
  return {
    mask: mask.toString(8).padStart(3, "0"),
    file: describeMode(0o666 & ~mask),
    directory: describeMode(0o777 & ~mask),
  };
}
