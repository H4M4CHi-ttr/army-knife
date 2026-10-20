import { assertInputSize, ToolError } from "./errors";

export const CACHE_CONTROL_LIMITS = {
  bytes: 8192, lines: 32, directives: 128, nameCharacters: 64,
  valueCharacters: 1024, deferredCharacters: 2048,
} as const;
export type CacheControlNote = "extension" | "duplicate" | "invalid-argument" | "quoted-seconds" | "unquoted-fields" | "unexpected-argument";
export interface CacheControlDirective {
  name: string;
  value: string | null;
  seconds: string | null;
  known: boolean;
  notes: CacheControlNote[];
}
export interface CacheControlReport {
  directives: CacheControlDirective[];
  warnings: "private-public"[];
}
const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const TOKEN_CHARACTER = /[!#$%&'*+.^_`|~0-9A-Za-z-]/;
const SECONDS = new Set(["max-age", "s-maxage", "stale-while-revalidate", "stale-if-error"]);
const FLAGS = new Set(["public", "no-store", "no-transform", "must-revalidate", "proxy-revalidate", "must-understand", "immutable"]);
const FIELDS = new Set(["private", "no-cache"]);
const trim = (value: string) => value.replace(/^[ \t]+|[ \t]+$/g, "");
function syntax(): never { throw new ToolError("CACHE_CONTROL_SYNTAX"); }
function limit(): never { throw new ToolError("CACHE_CONTROL_LIMIT"); }

/** Bounded linear scan of response directives, not a cacheability simulator. */
export function inspectCacheControl(input: string): CacheControlReport {
  assertInputSize(input, CACHE_CONTROL_LIMITS.bytes);
  const normalized = input.replace(/\r\n/g, "\n");
  // HTTP quoted text permits Latin-1 obs-text; arbitrary Unicode is not field syntax.
  if (/[^\t\n\x20-\x7e\x80-\xff]/.test(normalized)) syntax();
  const physicalLines = normalized.split("\n");
  if (physicalLines.length > CACHE_CONTROL_LIMITS.lines) limit();
  const lines = physicalLines.map(trim).filter(Boolean);
  if (!lines.length) throw new ToolError("CACHE_CONTROL_EMPTY");
  let source: string;
  if (/^cache-control:/i.test(lines[0]!)) {
    // Leading whitespace is obsolete folding, not a repeated field. Check before
    // trimming so a continuation cannot be reclassified as a new header.
    if (physicalLines.some((line) => /^[ \t]/.test(line))) throw new ToolError("CACHE_CONTROL_HEADERS");
    if (lines.some((line) => !/^cache-control:/i.test(line))) throw new ToolError("CACHE_CONTROL_HEADERS");
    source = lines.map((line) => line.slice(14)).join(",");
  } else {
    if (lines.length !== 1) throw new ToolError("CACHE_CONTROL_HEADERS");
    source = lines[0]!;
  }
  const directives: CacheControlDirective[] = [];
  let position = 0;
  function whitespace() { while (source[position] === " " || source[position] === "\t") position++; }
  function token() {
    const start = position;
    while (position < source.length && TOKEN_CHARACTER.test(source[position]!)) position++;
    return source.slice(start, position);
  }
  while (position < source.length) {
    whitespace();
    if (source[position] === ",") { position++; continue; } // RFC list empty elements.
    if (position === source.length) break;
    const name = token().toLowerCase();
    if (!name) syntax();
    if (name.length > CACHE_CONTROL_LIMITS.nameCharacters || directives.length >= CACHE_CONTROL_LIMITS.directives) limit();
    let value: string | null = null;
    let quoted = false;
    if (source[position] === "=") {
      position++;
      if (source[position] === '"') {
        quoted = true;
        position++;
        value = "";
        let closed = false;
        while (position < source.length) {
          let character = source[position++]!;
          if (character === '"') { closed = true; break; }
          if (character === "\\") {
            if (position === source.length) syntax();
            character = source[position++]!;
          }
          value += character;
          if (value.length > CACHE_CONTROL_LIMITS.valueCharacters) limit();
        }
        if (!closed) syntax();
      } else {
        value = token();
        if (!value) syntax();
        if (value.length > CACHE_CONTROL_LIMITS.valueCharacters) limit();
      }
    }
    whitespace();
    if (position < source.length && source[position] !== ",") syntax();
    const row: CacheControlDirective = { name, value, seconds: null, known: true, notes: [] };
    if (SECONDS.has(name)) {
      if (value !== null && /^[0-9]+$/.test(value)) {
        // Never convert to Number: the report describes the declared value exactly.
        row.seconds = value.replace(/^0+(?=\d)/, "");
        if (quoted) row.notes.push("quoted-seconds");
      } else row.notes.push("invalid-argument");
    } else if (FIELDS.has(name)) {
      if (value !== null) {
        const fields = value.split(",").map(trim).filter(Boolean);
        if (!fields.length || fields.some((field) => !TOKEN.test(field))) row.notes.push("invalid-argument");
        else if (!quoted) row.notes.push("unquoted-fields");
      }
    } else if (FLAGS.has(name)) {
      if (value !== null) row.notes.push("unexpected-argument");
    } else {
      row.known = false;
      row.notes.push("extension");
    }
    directives.push(row);
  }
  if (!directives.length) throw new ToolError("CACHE_CONTROL_EMPTY");
  const counts = new Map<string, number>();
  for (const row of directives) counts.set(row.name, (counts.get(row.name) ?? 0) + 1);
  for (const row of directives) if (counts.get(row.name)! > 1) row.notes.push("duplicate");
  const warnings: CacheControlReport["warnings"] = [];
  if (directives.some((row) => row.name === "private" && row.value === null) && counts.has("public")) warnings.push("private-public");
  return { directives, warnings };
}
