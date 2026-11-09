import { assertInputSize, ToolError } from "./errors.ts";

export const FORWARDED_LIMITS = { bytes: 8192, elements: 32, elementSlots: 64, parameters: 16, parameterSlots: 32, deferredCharacters: 2048 } as const;
export interface ForwardedReport {
  elements: {
    /** One-based comma position; empty elements leave intentional gaps. */
    index: number;
    parameters: { name: string; value: string }[];
    emptyParameterSlots: number;
  }[];
  emptyElements: number;
}
const token = /[!#$%&'*+.^_|~0-9A-Za-z\x60-]/;
const fail = (code = "FORWARDED_SYNTAX"): never => { throw new ToolError(code); };

/** Inspect recorded ASCII grouping only. Parameter values are opaque, never trusted identities. */
export function inspectForwarded(input: string): ForwardedReport {
  assertInputSize(input, FORWARDED_LIMITS.bytes);
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code !== 9 && (code < 32 || code > 126)) fail();
  }
  let cursor = 0, elementSlots = 0, emptyElements = 0;
  const elements: ForwardedReport["elements"] = [];
  const whitespace = () => { while (input[cursor] === " " || input[cursor] === "\t") cursor++; };
  const readToken = () => {
    const start = cursor;
    while (cursor < input.length && token.test(input[cursor]!)) cursor++;
    if (start === cursor) fail();
    return input.slice(start, cursor);
  };
  const readValue = () => {
    if (input[cursor] !== '"') return readToken();
    cursor++;
    let value = "";
    while (cursor < input.length) {
      const char = input[cursor++]!;
      if (char === '"') return value;
      if (char === "\\") {
        if (cursor === input.length) fail();
        value += input[cursor++]!;
      } else value += char;
    }
    return fail();
  };

  while (true) {
    if (++elementSlots > FORWARDED_LIMITS.elementSlots) fail("FORWARDED_LIMIT");
    const parameters: ForwardedReport["elements"][number]["parameters"] = [];
    const seen = new Set<string>();
    let parameterSlots = 0, emptyParameterSlots = 0;
    while (true) {
      if (++parameterSlots > FORWARDED_LIMITS.parameterSlots) fail("FORWARDED_LIMIT");
      whitespace();
      if (cursor === input.length || input[cursor] === "," || input[cursor] === ";") emptyParameterSlots++;
      else {
        if (parameters.length === FORWARDED_LIMITS.parameters) fail("FORWARDED_LIMIT");
        const name = readToken();
        // RFC 7239 forwarded-pair has no whitespace around "=".
        if (input[cursor++] !== "=") fail();
        const value = readValue();
        const normalized = name.toLowerCase();
        if (seen.has(normalized)) fail("FORWARDED_DUPLICATE");
        seen.add(normalized);
        parameters.push({ name, value });
        whitespace();
      }
      if (cursor === input.length || input[cursor] === ",") break;
      if (input[cursor++] !== ";") fail();
    }
    if (parameters.length) {
      if (elements.length === FORWARDED_LIMITS.elements) fail("FORWARDED_LIMIT");
      elements.push({ index: elementSlots, parameters, emptyParameterSlots });
    } else emptyElements++;
    if (cursor === input.length) break;
    cursor++; // Only an unquoted comma can reach this point.
  }
  if (!elements.length) fail("FORWARDED_EMPTY");
  return { elements, emptyElements };
}
