import { assertInputSize, ToolError } from "./errors";
import { parseJsonSafely, type JsonValue } from "./json";

export const BACKLOG_LIMITS = { inputBytes: 64 * 1024, lines: 2000, rows: 100, outputBytes: 128 * 1024 } as const;
export type BacklogKind = "ndjson" | "json-pointer" | "csv-insert" | "sqlite-plan" | "jsonl-logs" | "stack-trace" | "robots" | "sitemap" | "iso-duration" | "pg-dsn";
export type BacklogReport = {
  metrics: { key: string; value: string }[];
  rows: { label: string; detail: string }[];
  warnings: string[];
  exportText: string;
};
export type BacklogOptions = {
  mode?: "flatten" | "restore";
  table?: string;
  dialect?: "postgres" | "mysql" | "sqlite";
  nullToken?: string;
  groupSize?: number;
  field?: string;
  parser?: "auto" | "javascript" | "python" | "java" | "dotnet";
  agent?: string;
  path?: string;
  reference?: string;
};
export function guard(input: string): void { assertInputSize(input, BACKLOG_LIMITS.inputBytes); }
export function fail(): never { throw new ToolError("INVALID_REQUEST"); }
export function checkedRows(n: number): void {
  if (n > BACKLOG_LIMITS.lines) throw new ToolError("TOO_MANY_ROWS");
}
export function report(metrics: Record<string, string | number>, rows: BacklogReport["rows"],
  exportText: string, warnings: string[] = []): BacklogReport {
  assertInputSize(exportText, BACKLOG_LIMITS.outputBytes);
  return {
    metrics: Object.entries(metrics).map(([key, value]) => ({ key, value: String(value) })),
    rows: rows.slice(0, BACKLOG_LIMITS.rows),
    warnings: [...warnings, ...(rows.length > BACKLOG_LIMITS.rows ? ["previewLimited"] : [])],
    exportText,
  };
}
export function lines(input: string): string[] {
  const list = input.replace(/\r\n?/g, "\n").split("\n");
  checkedRows(list.length);
  return list;
}
type ParsedLine = { line: number; value?: JsonValue; error?: string };
function parseLines(input: string): ParsedLine[] {
  return lines(input).flatMap((text, index): ParsedLine[] => {
    if (!text.trim()) return [];
    try { return [{ line: index + 1, value: parseJsonSafely(text) }]; }
    catch (error) { return [{ line: index + 1, error: error instanceof ToolError ? error.code : "JSON_INVALID" }]; }
  });
}
function kindOf(value: JsonValue): string {
  return value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
}
/** #35: malformed JSONL rows remain visible; inspection never drops the good rows. */
export function inspectNdjson(input: string): BacklogReport {
  guard(input);
  const parsed = parseLines(input);
  const counts = new Map<string, number>();
  const keys = new Map<string, number>();
  const rows: BacklogReport["rows"] = [];
  let valid = 0;
  for (const entry of parsed) {
    if (entry.error) { rows.push({ label: "L" + entry.line, detail: entry.error }); continue; }
    valid++;
    const value = entry.value!;
    const type = kindOf(value);
    counts.set(type, (counts.get(type) ?? 0) + 1);
    if (type === "object") for (const key of Object.keys(value)) keys.set(key, (keys.get(key) ?? 0) + 1);
    rows.push({ label: "L" + entry.line, detail: type === "object" ? Object.keys(value).join(", ") : type });
  }
  const invalid = parsed.length - valid;
  const summary = [...counts].map(([type, count]) => type + ":" + count).join(", ");
  const keySummary = [...keys].sort((a, b) => b[1] - a[1]).slice(0, 30)
    .map(([key, n]) => ({ key, count: n }));
  const exportText = JSON.stringify({
    total: parsed.length, valid, invalid, types: Object.fromEntries(counts),
    keys: keySummary, errors: parsed.filter(p => p.error).map(p => ({ line: p.line, error: p.error })),
  }, null, 2);
  return report({ records: parsed.length, valid, invalid, types: summary || "—", keys: keys.size },
    rows, exportText, invalid ? ["invalidRows"] : []);
}
type FlatNode = { pointer: string; kind: "object" | "array" | "value"; value?: JsonValue };
function pointerToken(value: string): string { return value.replace(/~/g, "~0").replace(/\//g, "~1"); }
function decodePointer(value: string): string[] {
  if (!value) return [];
  if (!value.startsWith("/")) return fail();
  return value.slice(1).split("/").map(token => {
    if (/~(?![01])/.test(token)) return fail();
    return token.replace(/~1/g, "/").replace(/~0/g, "~");
  });
}
/** #36: typed RFC6901 nodes preserve empty containers and numeric object keys. */
export function convertJsonPointer(input: string, mode: "flatten" | "restore" = "flatten"): BacklogReport {
  guard(input);
  const parsed = parseJsonSafely(input);
  let nodes: FlatNode[] = [];
  if (mode === "flatten") {
    function visit(value: JsonValue, pointer: string, depth: number): void {
      if (depth > 64 || nodes.length >= BACKLOG_LIMITS.lines) throw new ToolError("JSON_NODE_LIMIT");
      if (Array.isArray(value)) {
        nodes.push({ pointer, kind: "array" });
        value.forEach((item, i) => visit(item, pointer + "/" + i, depth + 1));
      } else if (value !== null && typeof value === "object") {
        nodes.push({ pointer, kind: "object" });
        for (const [key, item] of Object.entries(value)) visit(item, pointer + "/" + pointerToken(key), depth + 1);
      } else nodes.push({ pointer, kind: "value", value });
    }
    visit(parsed, "", 0);
  } else {
    if (!Array.isArray(parsed) || !parsed.length) return fail();
    const seen = new Set<string>();
    nodes = parsed.map(item => {
      if (!item || typeof item !== "object" || Array.isArray(item) ||
          typeof item.pointer !== "string" ||
          !["value", "array", "object"].includes(String(item.kind)) ||
          seen.has(item.pointer) ||
          (item.kind === "value" ? !Object.hasOwn(item, "value") : Object.hasOwn(item, "value")))
        return fail();
      seen.add(item.pointer);
      decodePointer(item.pointer);
      return item as unknown as FlatNode;
    });
    checkedRows(nodes.length);
    if (nodes[0]?.pointer !== "") return fail();
    const table = new Map(nodes.map(node => [node.pointer, node]));
    const built = new Map<string, JsonValue>();
    for (const node of nodes) {
      built.set(node.pointer, node.kind === "array" ? [] : node.kind === "object"
        ? Object.create(null) as Record<string, JsonValue> : node.value!);
    }
    const root = nodes[0];
    for (const node of nodes.slice(1)) {
      const segments = decodePointer(node.pointer);
      const last = segments.pop()!;
      const parentPointer = segments.length ? "/" + segments.map(pointerToken).join("/") : "";
      const parentNode = table.get(parentPointer);
      const parent = built.get(parentPointer);
      if (!parentNode || !parent || typeof parent !== "object" ||
          (parentNode.kind !== "array" && parentNode.kind !== "object")) return fail();
      if (Array.isArray(parent)) {
        if (!/^(0|[1-9]\d*)$/.test(last) || Number(last) !== parent.length) return fail();
        parent.push(built.get(node.pointer)!);
      } else {
        if (Object.hasOwn(parent, last)) return fail();
        parent[last] = built.get(node.pointer)!;
      }
    }
    const restored = built.get(root.pointer)!;
    const restoredText = JSON.stringify(restored, null, 2);
    return report({ nodes: nodes.length }, nodes.map(n => ({ label: n.pointer || "(root)", detail: n.kind })),
      restoredText);
  }
  return report({ nodes: nodes.length }, nodes.map(n => ({
    label: n.pointer || "(root)", detail: n.kind === "value" ? JSON.stringify(n.value) : n.kind,
  })), JSON.stringify(nodes, null, 2));
}
/** CSV parser implementing RFC4180 quotes, embedded newlines and doubled quotes. */
export function parseCsv(input: string): string[][] {
  guard(input);
  const records: string[][] = [];
  let record: string[] = [], field = "", quoted = false, afterQuote = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; afterQuote = true; }
      } else field += c;
      continue;
    }
    if (afterQuote && c !== "," && c !== "\r" && c !== "\n") return fail();
    if (c === '"' && !field && !afterQuote) { quoted = true; continue; }
    if (c === '"') return fail();
    if (c === ",") { record.push(field); field = ""; afterQuote = false; }
    else if (c === "\r" || c === "\n") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      record.push(field); records.push(record);
      checkedRows(records.length);
      record = []; field = ""; afterQuote = false;
    } else field += c;
  }
  if (quoted) return fail();
  if (field !== "" || afterQuote || record.length || !/[\r\n]$/.test(input)) {
    record.push(field); records.push(record);
  }
  checkedRows(records.length);
  return records;
}
/** #38: no execution; quote each literal and identifier in the selected dialect. */
export function csvToInsert(input: string, opts: BacklogOptions = {}): BacklogReport {
  const data = parseCsv(input);
  if (data.length < 2) return fail();
  const table = opts.table || "records";
  const dialect = opts.dialect || "postgres";
  if (!["postgres", "mysql", "sqlite"].includes(dialect)) return fail();
  const size = opts.groupSize ?? 100;
  if (!Number.isInteger(size) || size < 1 || size > 500) return fail();
  const safeIdentifier = (name: string) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return fail();
    const quote = dialect === "mysql" ? "\u0060" : '"';
    return quote + name + quote;
  };
  const tableName = table.split(".").map(safeIdentifier).join(".");
  const headers = data[0];
  if (!headers.length || headers.length > 256 || new Set(headers).size !== headers.length) return fail();
  const cols = headers.map(safeIdentifier).join(", ");
  const nullToken = opts.nullToken || "";
  const rows = data.slice(1);
  const statements: string[] = [];
  let group: string[] = [];
  for (let index = 0; index < rows.length; index++) {
    const record = rows[index];
    if (record.length !== headers.length) return fail();
    const tuple = "(" + record.map(v => {
      if (/[\u0000]/.test(v)) return fail();
      try { encodeURIComponent(v); } catch { return fail(); } // Reject unpaired UTF-16 surrogates.
      if (nullToken && v === nullToken) return "NULL";
      if (dialect === "mysql") {
        // A UTF-8 hex expression is invariant under NO_BACKSLASH_ESCAPES and SQL quoting modes.
        if (!v) return "''";
        const hex = Array.from(new TextEncoder().encode(v), byte => byte.toString(16).padStart(2, "0")).join("");
        return "CONVERT(0x" + hex + " USING utf8mb4)";
      }
      if (dialect === "postgres") {
        // E-string escapes do not depend on standard_conforming_strings server settings.
        return "E'" + v.replace(/\\/g, "\\\\").replace(/'/g, "''") + "'";
      }
      // SQLite single-quoted strings have no backslash escape interpretation.
      return "'" + v.replace(/'/g, "''") + "'";
    }).join(", ") + ")";
    group.push(tuple);
    if (group.length === size || index === rows.length - 1) {
      statements.push("INSERT INTO " + tableName + " (" + cols + ") VALUES\n" + group.join(",\n") + ";");
      group = [];
    }
  }
  const output = statements.join("\n\n");
  return report({ records: rows.length, columns: headers.length, statements: statements.length },
    rows.slice(0, BACKLOG_LIMITS.rows).map((row, i) => ({ label: "#" + (i + 1), detail: row.join(" | ") })),
    output, rows.length > BACKLOG_LIMITS.rows ? ["previewLimited"] : []);
}
type SqliteNode = { id: number; parent: number; detail: string };
/** #41: only reads existing EXPLAIN QUERY PLAN results; never opens a database. */
export function inspectSqlitePlan(input: string): BacklogReport {
  guard(input);
  let rows: SqliteNode[] = [];
  try {
    const parsed: unknown = JSON.parse(input);
    if (Array.isArray(parsed)) rows = parsed.map(value => {
      if (Array.isArray(value) && value.length >= 4) return {
        id: Number(value[0]), parent: Number(value[1]), detail: String(value[3]),
      };
      if (value && typeof value === "object" && "id" in value && "parent" in value && "detail" in value)
        return { id: Number(value.id), parent: Number(value.parent), detail: String(value.detail) };
      return fail();
    });
  } catch (e) { if (e instanceof ToolError) throw e; }
  if (!rows.length) {
    rows = lines(input).filter(s => s.trim()).map(line => {
      const m = /^\s*(\d+)\s*[|\t]\s*(\d+)\s*[|\t]\s*(\d+)\s*[|\t]\s*(.*)\s*$/.exec(line);
      if (!m) return fail();
      return { id: Number(m[1]), parent: Number(m[2]), detail: m[4] };
    });
  }
  checkedRows(rows.length);
  const table = new Map<number, SqliteNode>();
  for (const node of rows) {
    if (!Number.isSafeInteger(node.id) || !Number.isSafeInteger(node.parent) ||
        table.has(node.id) || node.id < 0 || node.parent < 0 || !node.detail.trim()) return fail();
    table.set(node.id, node);
  }
  const warnings: string[] = [];
  const view = rows.map(node => {
    let depth = 0, parent = node.parent;
    const visited = new Set([node.id]);
    while (table.has(parent) && !visited.has(parent)) {
      visited.add(parent); parent = table.get(parent)!.parent; depth++;
    }
    if (table.has(parent)) { warnings.push("cycles"); depth = 0; }
    else if (node.parent !== 0 && !table.has(node.parent)) warnings.push("missingParent");
    return { label: " ".repeat(Math.min(depth, 30) * 2) + "#" + node.id,
      detail: node.detail };
  });
  const scan = rows.filter(node => /^\s*SCAN\b/i.test(node.detail)).length;
  const search = rows.filter(node => /^\s*SEARCH\b/i.test(node.detail)).length;
  const temporary = rows.filter(node => /\bUSE TEMP B-TREE\b/i.test(node.detail)).length;
  return report({ nodes: rows.length, scan, search, temporary },
    view, JSON.stringify(rows, null, 2), [...new Set(warnings)]);
}
/** #49: level and service frequencies, time ordering, exact request-id filter. */
export function aggregateJsonlLogs(input: string, opts: BacklogOptions = {}): BacklogReport {
  guard(input);
  const records = parseLines(input);
  const field = opts.field || "";
  if (field.length > 200) return fail();
  const levels = new Map<string, number>(), services = new Map<string, number>();
  const timeline: { time: string; level: string; service: string; id: string; line: number }[] = [];
  let invalid = 0, skipped = 0, missingTimestamp = 0;
  for (const rec of records) {
    if (rec.error || !rec.value || Array.isArray(rec.value) || typeof rec.value !== "object") { invalid++; continue; }
    const v = rec.value as Record<string, JsonValue>;
    const id = String(v.requestId ?? v.traceId ?? "");
    if (field && id !== field) { skipped++; continue; }
    const level = typeof v.level === "string" ? v.level.toUpperCase() : "(missing)";
    const service = typeof v.service === "string" ? v.service : "(missing)";
    levels.set(level, (levels.get(level) ?? 0) + 1);
    services.set(service, (services.get(service) ?? 0) + 1);
    const rawTime = v.timestamp ?? v.time ?? "";
    const ms = typeof rawTime === "number" ? rawTime : typeof rawTime === "string" ? Date.parse(rawTime) : NaN;
    if (!Number.isFinite(ms)) missingTimestamp++;
    timeline.push({ time: Number.isFinite(ms) ? new Date(ms).toISOString() : "", level, service, id, line: rec.line });
  }
  const counted = timeline.length;
  // Stable order: valid timestamps first, then original line as tie breaker.
  timeline.sort((a,b) => (!a.time ? 1 : !b.time ? -1 : a.time.localeCompare(b.time)) || a.line - b.line);
  const freq = (data: Map<string, number>) => [...data].sort((a,b) => b[1] - a[1]).slice(0, 30)
    .map(([name,count]) => ({ name, count }));
  const rows = timeline.map(p => ({ label: "L" + p.line + " " + (p.time || "—"),
    detail: p.level + " / " + p.service + (p.id ? " / " + p.id : "") }));
  return report({ records: records.length, counted, invalid, skipped, missingTimestamp,
    levels: [...levels].map(([k,v]) => k + ":" + v).join(", ") || "—", services: services.size },
    rows, JSON.stringify({ total: records.length, counted, invalid, skipped, levels: freq(levels),
      services: freq(services), timeline }, null, 2), invalid ? ["invalidRows"] : []);
}