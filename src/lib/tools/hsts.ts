import { assertInputSize, ToolError } from "./errors.ts";

export const HSTS_LIMITS = { bytes: 4096, directives: 32, slots: 64, digits: 40, deferredCharacters: 2048 } as const;
export interface HstsReport {
  maxAgeSeconds: string;
  duration: { days: string; hours: number; minutes: number; seconds: number };
  operation: "declare" | "remove";
  includeSubDomains: boolean;
  preload: boolean;
  directives: { name: string; value: string | null; recognized: boolean }[];
  emptySlots: number;
}
const token = /[!#$%&'*+.^_`|~0-9A-Za-z-]/;
const fail = (code = "HSTS_SYNTAX"): never => { throw new ToolError(code); };

/** Bounded ASCII field-value inspection; no policy installation or host lookup. */
export function inspectHsts(input: string): HstsReport {
  assertInputSize(input, HSTS_LIMITS.bytes);
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code !== 9 && (code < 32 || code > 126)) fail();
  }
  let cursor = 0, slots = 0, emptySlots = 0;
  let seconds: bigint | undefined;
  let includeSubDomains = false, preload = false;
  const directives: HstsReport["directives"] = [];
  const seen = new Set<string>();
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
    if (++slots > HSTS_LIMITS.slots) fail("HSTS_LIMIT");
    whitespace();
    if (cursor === input.length || input[cursor] === ";") emptySlots++;
    else {
      if (directives.length === HSTS_LIMITS.directives) fail("HSTS_LIMIT");
      const name = readToken(), normalized = name.toLowerCase();
      whitespace();
      let value: string | null = null;
      if (input[cursor] === "=") { cursor++; whitespace(); value = readValue(); whitespace(); }
      if (seen.has(normalized)) fail("HSTS_DUPLICATE");
      seen.add(normalized);
      if (normalized === "max-age") {
        if (value === null || value.length > HSTS_LIMITS.digits || !/^[0-9]+$/.test(value)) fail("HSTS_MAX_AGE");
        seconds = BigInt(value!);
      } else if (normalized === "includesubdomains") {
        if (value !== null) fail("HSTS_SUBDOMAINS");
        includeSubDomains = true;
      } else if (normalized === "preload" && value === null) preload = true;
      directives.push({ name, value, recognized: normalized === "max-age" || normalized === "includesubdomains" });
    }
    if (cursor === input.length) break;
    if (input[cursor++] !== ";") fail();
  }
  if (seconds === undefined) fail("HSTS_MAX_AGE");
  const exact = seconds!;
  return {
    maxAgeSeconds: exact.toString(),
    duration: { days: (exact / 86400n).toString(), hours: Number(exact % 86400n / 3600n), minutes: Number(exact % 3600n / 60n), seconds: Number(exact % 60n) },
    operation: exact === 0n ? "remove" : "declare", includeSubDomains, preload, directives, emptySlots,
  };
}
