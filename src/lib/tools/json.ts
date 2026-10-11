import { assertInputSize, ToolError } from "./errors";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export const JSON_LIMITS = Object.freeze({
  inputBytes: 512 * 1024,
  depth: 64,
  nodes: 50_000,
  comparedNodes: 100_000,
  changes: 2_000,
  numberCharacters: 256,
});

export interface JsonChange {
  kind: "add" | "remove" | "replace";
  /** RFC 6901 JSON Pointer; the empty string means the document root. */
  path: string;
  before?: JsonValue;
  after?: JsonValue;
}

export interface JsonDiffResult {
  /** null means the comparison limit prevented establishing equality. */
  equal: boolean | null;
  changes: JsonChange[];
  truncated: boolean;
  comparedNodes: number;
  /** Counts refer only to returned changes if truncated is true. */
  summary: { added: number; removed: number; replaced: number };
}

function canonicalDecimal(token: string): string {
  const negative = token.startsWith("-");
  const unsigned = negative ? token.slice(1) : token;
  const [mantissa = "", exponentText = "0"] = unsigned.toLowerCase().split("e");
  const [integer = "", fraction = ""] = mantissa.split(".");
  const significant = `${integer}${fraction}`.replace(/^0+/, "");
  if (!significant) return "0";
  const digits = significant.replace(/0+$/, "");
  const exponent =
    BigInt(exponentText) - BigInt(fraction.length) + BigInt(significant.length - digits.length);
  return `${negative ? "-" : ""}${digits}e${exponent}`;
}

function checkedNumber(token: string): number {
  if (token.length > JSON_LIMITS.numberCharacters) throw new ToolError("JSON_NUMBER_PRECISION");
  const value = Number(token);
  if (!Number.isFinite(value)) throw new ToolError("JSON_NUMBER_PRECISION");
  if (Number.isInteger(value) && !Number.isSafeInteger(value))
    throw new ToolError("JSON_NUMBER_PRECISION");
  // Reject underflow and decimal digits lost by IEEE 754 conversion. Ordinary
  // values such as 0.1 are accepted when their shortest decimal round trip is
  // identical. This also rejects 9007199254740991.1, which rounds to a safe int.
  if (canonicalDecimal(token) !== canonicalDecimal(String(value))) {
    throw new ToolError("JSON_NUMBER_PRECISION");
  }
  return value;
}

/**
 * Bounded JSON parser. Objects have no prototype; duplicate keys and numbers
 * that would silently lose decimal digits are rejected before transformation.
 */
export function parseJsonSafely(input: string): JsonValue {
  assertInputSize(input, JSON_LIMITS.inputBytes);
  let offset = 0;
  let nodes = 0;
  const numberPattern = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
  const fail = (): never => {
    throw new ToolError("JSON_INVALID", String(offset));
  };
  const whitespace = (): void => {
    while (offset < input.length && " \t\r\n".includes(input[offset] ?? "")) offset += 1;
  };
  const readString = (): string => {
    if (input[offset] !== '"') return fail();
    const start = offset;
    offset += 1;
    while (offset < input.length) {
      const character = input[offset];
      offset += 1;
      if (character === "\\") {
        offset += 1;
      } else if (character === '"') {
        try {
          return JSON.parse(input.slice(start, offset)) as string;
        } catch {
          return fail();
        }
      }
    }
    return fail();
  };
  const readValue = (depth: number): JsonValue => {
    if (depth > JSON_LIMITS.depth) throw new ToolError("JSON_DEPTH_LIMIT");
    nodes += 1;
    if (nodes > JSON_LIMITS.nodes) throw new ToolError("JSON_NODE_LIMIT");
    whitespace();
    const character = input[offset];
    if (character === '"') return readString();
    if (character === "{") {
      const result = Object.create(null) as { [key: string]: JsonValue };
      offset += 1;
      whitespace();
      if (input[offset] === "}") {
        offset += 1;
        return result;
      }
      while (offset < input.length) {
        whitespace();
        const key = readString();
        if (Object.hasOwn(result, key)) throw new ToolError("JSON_DUPLICATE_KEY");
        whitespace();
        if (input[offset] !== ":") return fail();
        offset += 1;
        result[key] = readValue(depth + 1);
        whitespace();
        if (input[offset] === "}") {
          offset += 1;
          return result;
        }
        if (input[offset] !== ",") return fail();
        offset += 1;
      }
      return fail();
    }
    if (character === "[") {
      const result: JsonValue[] = [];
      offset += 1;
      whitespace();
      if (input[offset] === "]") {
        offset += 1;
        return result;
      }
      while (offset < input.length) {
        result.push(readValue(depth + 1));
        whitespace();
        if (input[offset] === "]") {
          offset += 1;
          return result;
        }
        if (input[offset] !== ",") return fail();
        offset += 1;
      }
      return fail();
    }
    for (const [token, value] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      if (input.startsWith(token, offset)) {
        offset += token.length;
        return value;
      }
    }
    numberPattern.lastIndex = offset;
    const matched = numberPattern.exec(input);
    if (!matched) return fail();
    offset = numberPattern.lastIndex;
    return checkedNumber(matched[0]);
  };
  const parsed = readValue(0);
  whitespace();
  if (offset !== input.length) fail();
  return parsed;
}

export function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function isObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function compareJson(leftInput: string, rightInput: string): JsonDiffResult {
  const left = parseJsonSafely(leftInput);
  const right = parseJsonSafely(rightInput);
  const changes: JsonChange[] = [];
  let comparedNodes = 0;
  let truncated = false;
  const record = (change: JsonChange): void => {
    if (changes.length >= JSON_LIMITS.changes) {
      truncated = true;
      return;
    }
    changes.push(change);
  };
  const visit = (before: JsonValue, after: JsonValue, path: string): void => {
    if (truncated) return;
    comparedNodes += 1;
    if (comparedNodes > JSON_LIMITS.comparedNodes) {
      truncated = true;
      return;
    }
    // Object key order and numeric spellings such as 1.0 vs 1 are insignificant.
    if (before === after) return;
    if (Array.isArray(before) && Array.isArray(after)) {
      const commonLength = Math.min(before.length, after.length);
      for (let index = 0; index < commonLength && !truncated; index += 1) {
        visit(before[index] as JsonValue, after[index] as JsonValue, `${path}/${index}`);
      }
      // Descending removals keep array positions valid if changes are applied in order.
      for (let index = before.length - 1; index >= commonLength && !truncated; index -= 1) {
        record({ kind: "remove", path: `${path}/${index}`, before: before[index] as JsonValue });
      }
      for (let index = commonLength; index < after.length && !truncated; index += 1) {
        record({ kind: "add", path: `${path}/${index}`, after: after[index] as JsonValue });
      }
      return;
    }
    if (isObject(before) && isObject(after)) {
      const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
      for (const key of keys) {
        if (truncated) break;
        const childPath = `${path}/${escapeJsonPointerSegment(key)}`;
        if (!Object.hasOwn(before, key)) {
          record({ kind: "add", path: childPath, after: after[key] as JsonValue });
        } else if (!Object.hasOwn(after, key)) {
          record({ kind: "remove", path: childPath, before: before[key] as JsonValue });
        } else {
          visit(before[key] as JsonValue, after[key] as JsonValue, childPath);
        }
      }
      return;
    }
    record({ kind: "replace", path, before, after });
  };
  visit(left, right, "");
  return {
    equal: changes.length > 0 ? false : truncated ? null : true,
    changes,
    truncated,
    comparedNodes,
    summary: {
      added: changes.filter((change) => change.kind === "add").length,
      removed: changes.filter((change) => change.kind === "remove").length,
      replaced: changes.filter((change) => change.kind === "replace").length,
    },
  };
}

export function formatJson(input: string, indent = 2): string {
  if (!Number.isInteger(indent) || indent < 0 || indent > 8)
    throw new ToolError("JSON_INDENT_INVALID");
  return JSON.stringify(parseJsonSafely(input), null, indent);
}
