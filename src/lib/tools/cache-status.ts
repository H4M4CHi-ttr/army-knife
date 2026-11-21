import { assertInputSize, ToolError } from "./errors";

export const CACHE_STATUS_LIMITS = {
  bytes: 8192,
  lines: 32,
  caches: 64,
  parameters: 16,
  deferredCharacters: 2048,
} as const;

type BareItem =
  | { kind: "boolean"; value: boolean }
  | { kind: "token"; value: string }
  | { kind: "string"; value: string }
  | { kind: "integer"; value: string }
  | { kind: "decimal"; value: string }
  | { kind: "bytes"; value: string };

export interface CacheStatusRow {
  name: string;
  outcome: "hit" | "forwarded" | "unspecified";
  forwarded: string | null;
  forwardedStatus: string | null;
  ttl: string | null;
  parameters: ({ name: string } & BareItem)[];
}

const barePattern = /(?<string>"(?:[\x20-\x21\x23-\x5b\x5d-\x7e]|\\["\\])*")|(?<boolean>\?[01])|(?<decimal>-?[0-9]{1,12}\.[0-9]{1,3})|(?<integer>-?[0-9]{1,15})|(?<token>[A-Za-z*][!#$%&'*+.^_`|~:/0-9A-Za-z-]*)|(?<bytes>:[A-Za-z0-9+/]*={0,2}:)/y;
const keyPattern = /[a-z*][a-z0-9_.*-]*/y;
const separatorPattern = /[ \t]*/y;
const spacePattern = / */y;
const header = /^cache-status:/i;
const trimField = (value: string) => value.replace(/^[ \t]+|[ \t]+$/g, "");

function fail(reason: "SYNTAX" | "HEADERS" | "LIMIT" | "PARAMETER"): never {
  throw new ToolError("CACHE_STATUS_" + reason);
}

function parseLine(source: string, rows: CacheStatusRow[]): void {
  let position = 0;
  function consume(pattern: RegExp) {
    pattern.lastIndex = position;
    const match = pattern.exec(source);
    if (match) position = pattern.lastIndex;
    return match;
  }
  function bare(): BareItem {
    const groups = consume(barePattern)?.groups;
    if (!groups) fail("SYNTAX");
    if (groups.string !== undefined) {
      return { kind: "string", value: groups.string.slice(1, -1).replace(/\\(["\\])/g, "$1") };
    }
    if (groups.boolean !== undefined) return { kind: "boolean", value: groups.boolean === "?1" };
    if (groups.decimal !== undefined) return { kind: "decimal", value: groups.decimal };
    if (groups.integer !== undefined) return { kind: "integer", value: groups.integer };
    if (groups.token !== undefined) return { kind: "token", value: groups.token };
    const encoded = groups.bytes!.slice(1, -1);
    try {
      // Check the encoding but keep the original spelling in the report.
      atob(encoded);
    } catch {
      fail("SYNTAX");
    }
    return { kind: "bytes", value: encoded };
  }

  while (true) {
    if (rows.length >= CACHE_STATUS_LIMITS.caches) fail("LIMIT");
    const identifier = bare();
    if (identifier.kind !== "token" && identifier.kind !== "string") fail("SYNTAX");
    const parameters: CacheStatusRow["parameters"] = [];
    const items = new Map<string, BareItem>();
    while (source[position] === ";") {
      if (parameters.length >= CACHE_STATUS_LIMITS.parameters) fail("LIMIT");
      position++;
      consume(spacePattern);
      const key = consume(keyPattern)?.[0];
      if (!key) fail("SYNTAX");
      if (items.has(key)) fail("PARAMETER");
      let item: BareItem = { kind: "boolean", value: true };
      if (source[position] === "=") {
        position++;
        item = bare();
      }
      items.set(key, item);
      parameters.push({ name: key, ...item });
    }
    consume(separatorPattern);
    const last = position === source.length;
    if (!last && source[position++] !== ",") fail("SYNTAX");

    function parameter<K extends BareItem["kind"]>(name: string, ...allowed: K[]): Extract<BareItem, { kind: K }> | null {
      const item = items.get(name);
      if (!item) return null;
      if (!allowed.some((kind) => kind === item.kind)) fail("PARAMETER");
      return item as Extract<BareItem, { kind: K }>;
    }
    const hit = parameter("hit", "boolean")?.value ?? null;
    const forwarded = parameter("fwd", "token")?.value ?? null;
    const forwardedStatus = parameter("fwd-status", "integer")?.value ?? null;
    const ttl = parameter("ttl", "integer")?.value ?? null;
    const stored = parameter("stored", "boolean");
    const collapsed = parameter("collapsed", "boolean");
    parameter("key", "string");
    parameter("detail", "token", "string");
    if (hit !== null && forwarded !== null) fail("PARAMETER");
    if (forwarded === null && (forwardedStatus !== null || stored !== null || collapsed !== null)) fail("PARAMETER");
    if (forwardedStatus !== null && (Number(forwardedStatus) < 100 || Number(forwardedStatus) > 599)) fail("PARAMETER");
    rows.push({
      name: identifier.value,
      outcome: hit === true ? "hit" : forwarded !== null ? "forwarded" : "unspecified",
      forwarded,
      forwardedStatus,
      ttl,
      parameters,
    });
    if (last) return;
    consume(separatorPattern);
  }
}

/** Inspect recorded Cache-Status field values in source order. */
export function inspectCacheStatus(input: string): { caches: CacheStatusRow[] } {
  assertInputSize(input, CACHE_STATUS_LIMITS.bytes);
  const normalized = input.replace(/\r\n/g, "\n");
  if (/[^\t\n\x20-\x7e]/.test(normalized)) fail("SYNTAX");
  const lines = normalized.split("\n");
  // Allow a single final newline from copying, without accepting folded lines.
  if (lines.length > 1 && lines.at(-1) === "") lines.pop();
  if (lines.length > CACHE_STATUS_LIMITS.lines) fail("LIMIT");
  const caches: CacheStatusRow[] = [];
  if (header.test(lines[0]!)) {
    for (const line of lines) {
      if (!header.test(line)) fail("HEADERS");
      parseLine(trimField(line.slice("Cache-Status:".length)), caches);
    }
  } else {
    if (lines.length !== 1) fail("HEADERS");
    parseLine(trimField(lines[0]!), caches);
  }
  return { caches };
}
