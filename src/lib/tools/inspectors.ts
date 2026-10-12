import { assertInputSize, ToolError } from "./errors";

export const INSPECTOR_LIMITS = {
  conflictBytes: 256 * 1024,
  conflictCount: 32,
  referenceQueryChars: 128,
  colorChars: 128,
} as const;

export type ReferenceKind = "status" | "mime";
export interface ReferenceEntry {
  value: string;
  title: string;
  category: string;
  extensions: string;
  usage: string;
}
const statusData: readonly (readonly [number, string, string])[] = [
  [100, "Continue", "Interim response; do not cache"],
  [101, "Switching Protocols", "Upgrade negotiated; validate Upgrade headers"],
  [103, "Early Hints", "Interim link hints, not the final response"],
  [200, "OK", "Successful response; caching depends on method and headers"],
  [201, "Created", "Resource created; Location often identifies it"],
  [202, "Accepted", "Processing may not have finished"],
  [204, "No Content", "Successful response without a message body"],
  [206, "Partial Content", "Range response; check Content-Range"],
  [301, "Moved Permanently", "Permanent redirect; caches and clients may remember it"],
  [302, "Found", "Temporary redirect; method rewriting differs by client"],
  [303, "See Other", "Redirect to a GET resource"],
  [304, "Not Modified", "Revalidation response; no response body"],
  [307, "Temporary Redirect", "Temporary redirect preserves method and body"],
  [308, "Permanent Redirect", "Permanent redirect preserves method and body"],
  [400, "Bad Request", "Malformed or invalid request"],
  [401, "Unauthorized", "Authentication is required; WWW-Authenticate applies"],
  [403, "Forbidden", "Server refuses authorization; not a sign-in prompt"],
  [404, "Not Found", "Resource absent or intentionally undisclosed; may be cached"],
  [405, "Method Not Allowed", "Include Allow header with permitted methods"],
  [406, "Not Acceptable", "Content negotiation failed"],
  [408, "Request Timeout", "Server timeout waiting for request"],
  [409, "Conflict", "Request conflicts with current resource state"],
  [410, "Gone", "Resource is intentionally unavailable"],
  [412, "Precondition Failed", "Conditional request failed"],
  [413, "Content Too Large", "Request content exceeds a configured limit"],
  [415, "Unsupported Media Type", "Check Content-Type and body format"],
  [422, "Unprocessable Content", "Content is syntactically valid but cannot be processed"],
  [425, "Too Early", "Replay risk: retry when request is safe"],
  [429, "Too Many Requests", "Rate limited; check Retry-After"],
  [431, "Request Header Fields Too Large", "Request header fields are too large"],
  [500, "Internal Server Error", "Unexpected server failure; avoid leaking internals"],
  [501, "Not Implemented", "Server does not support this functionality"],
  [502, "Bad Gateway", "Bad upstream response"],
  [503, "Service Unavailable", "Temporary overload or maintenance; consider Retry-After"],
  [504, "Gateway Timeout", "Upstream did not reply before a gateway timeout"],
];
const mimeData: readonly (readonly [string, string, string])[] = [
  ["text/plain", ".txt .log", "Plain text; specify charset when relevant"],
  ["text/html", ".html .htm", "Markup; serve untrusted content cautiously"],
  ["text/css", ".css", "CSS stylesheets"],
  ["text/csv", ".csv", "CSV text; spreadsheet formula injection is a separate risk"],
  ["text/markdown", ".md .markdown", "Markdown text; rendering requires sanitization"],
  ["text/calendar", ".ics", "iCalendar events"],
  ["text/event-stream", ".event", "Server-sent events stream"],
  ["application/json", ".json", "JSON data; no implicit script execution"],
  ["application/problem+json", ".json", "Structured HTTP problem details"],
  ["application/javascript", ".js .mjs", "JavaScript; execute only from trusted origins"],
  ["application/xml", ".xml", "XML data; external entity resolution must be disabled"],
  ["application/pdf", ".pdf", "PDF document; validate content independently"],
  ["application/wasm", ".wasm", "WebAssembly binary"],
  ["application/octet-stream", ".bin .dat", "Generic binary; content may be anything"],
  ["application/x-www-form-urlencoded", ".form", "Form key/value encoding"],
  ["multipart/form-data", "", "Multipart form uploads; boundary parameter is required"],
  ["application/zip", ".zip", "ZIP archive; bound decompressed sizes"],
  ["application/gzip", ".gz", "GZip compressed data; bound decompressed sizes"],
  ["application/yaml", ".yaml .yml", "YAML configuration; disable executable tags"],
  ["application/ld+json", ".jsonld", "Linked Data in JSON"],
  ["image/png", ".png", "PNG raster image"],
  ["image/jpeg", ".jpg .jpeg", "JPEG raster image"],
  ["image/webp", ".webp", "WebP image"],
  ["image/avif", ".avif", "AVIF image"],
  ["image/svg+xml", ".svg", "SVG can contain active content; sanitize before embedding"],
  ["image/x-icon", ".ico", "Icon image"],
  ["font/woff2", ".woff2", "WOFF2 web font"],
  ["audio/mpeg", ".mp3", "MP3 audio"],
  ["video/mp4", ".mp4", "MP4 video"],
  ["video/webm", ".webm", "WebM media"],
];

const entries: Record<ReferenceKind, ReferenceEntry[]> = {
  status: statusData.map(([code, title, usage]) => ({
    value: String(code), title, category: String(Math.floor(code / 100)) + "xx",
    extensions: "", usage,
  })),
  mime: mimeData.map(([value, extensions, usage]) => ({
    value, title: value.split("/")[1] || value, category: value.split("/")[0] || "",
    extensions, usage,
  })),
};

/** A bundled, intentionally bounded offline reference; not a live IANA registry. */
export function lookupReference(query: string, kind: ReferenceKind) {
  if (query.length > INSPECTOR_LIMITS.referenceQueryChars || /[\u0000-\u001f\u007f]/.test(query))
    throw new ToolError("INSPECT_INVALID_QUERY");
  const needle = (kind === "mime" ? query.split(";")[0]! : query).trim().toLowerCase().replace(/^\./, "");
  const matches = entries[kind].filter((entry) =>
    !needle || [entry.value, entry.title, entry.category, entry.extensions, entry.usage]
      .some((field) => field.toLowerCase().includes(needle)),
  );
  return { entries: matches.slice(0, 20), total: matches.length, truncated: matches.length > 20 };
}

export interface ConflictDiagnostic {
  line: number;
  code: "stray" | "nested" | "order" | "incomplete";
}
export interface ConflictEntry {
  start: number;
  end: number;
  label: string;
  ours: string;
  base: string | null;
  theirs: string;
  before: string;
  after: string;
}
type Phase = "ours" | "base" | "theirs";
interface ActiveConflict {
  start: number;
  label: string;
  phase: Phase;
  ours: string[];
  base: string[];
  hasBase: boolean;
  theirs: string[];
  invalid: boolean;
}

const begin = /^<{7}(?:[ \t].*)?$/;
const ancestor = /^\|{7}(?:[ \t].*)?$/;
const divider = /^={7}$/;
const finish = /^>{7}(?:[ \t].*)?$/;

/** Scans merge and diff3 conflicts; incomplete/malformed markers are not silently repaired. */
export function inspectConflicts(input: string) {
  assertInputSize(input, INSPECTOR_LIMITS.conflictBytes);
  const lines = input.split(/\r\n|\n|\r/);
  const conflicts: ConflictEntry[] = [];
  const diagnostics: ConflictDiagnostic[] = [];
  let active: ActiveConflict | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const number = i + 1;
    if (begin.test(line)) {
      if (active) { active.invalid = true; diagnostics.push({ line: number, code: "nested" }); }
      else active = { start: number, label: line.slice(7).trim(), phase: "ours", ours: [], base: [], hasBase: false, theirs: [], invalid: false };
      continue;
    }
    if (ancestor.test(line)) {
      if (!active || active.phase !== "ours") {
        diagnostics.push({ line: number, code: active ? "order" : "stray" });
        if (active) active.invalid = true;
      } else { active.phase = "base"; active.hasBase = true; }
      continue;
    }
    if (divider.test(line)) {
      if (!active || active.phase === "theirs") {
        diagnostics.push({ line: number, code: active ? "order" : "stray" });
        if (active) active.invalid = true;
      } else active.phase = "theirs";
      continue;
    }
    if (finish.test(line)) {
      if (!active || active.phase !== "theirs") {
        diagnostics.push({ line: number, code: active ? "order" : "stray" });
        if (active) active.invalid = true;
      } else if (!active.invalid) {
        if (conflicts.length >= INSPECTOR_LIMITS.conflictCount) throw new ToolError("INSPECT_CONFLICT_LIMIT");
        conflicts.push({
          start: active.start, end: number, label: active.label,
          ours: active.ours.join("\n"),
          base: active.hasBase ? active.base.join("\n") : null,
          theirs: active.theirs.join("\n"),
          before: lines.slice(Math.max(0, active.start - 3), active.start - 1).join("\n"),
          after: lines.slice(i + 1, i + 3).join("\n"),
        });
      }
      if (active) active = null;
      continue;
    }
    if (active) active[active.phase].push(line);
  }
  if (active) diagnostics.push({ line: active.start, code: "incomplete" });
  return { conflicts, diagnostics, lines: input.length === 0 ? 0 : lines.length };
}

export interface ParsedColor {
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
  r: number;
  g: number;
  b: number;
  a: number;
}

function invalidColor(): never { throw new ToolError("INSPECT_INVALID_COLOR"); }
function readNumber(input: string, max: number, percent = false): number {
  const pattern = percent ? /^(?:\d+(?:\.\d+)?|\.\d+)%$/ : /^(?:\d+(?:\.\d+)?|\.\d+)$/;
  if (!pattern.test(input)) return invalidColor();
  const n = Number.parseFloat(input);
  if (!Number.isFinite(n) || n < 0 || n > max) return invalidColor();
  return n;
}
function alpha(value: string): number {
  return value.endsWith("%") ? readNumber(value, 100, true) / 100 : readNumber(value, 1);
}
function rgbComponent(value: string): number {
  return Math.round(value.endsWith("%")
    ? readNumber(value, 100, true) * 255 / 100 : readNumber(value, 255));
}
function percent(value: string): number { return readNumber(value, 100, true) / 100; }
function hue(value: string): number {
  const normalized = value.endsWith("deg") ? value.slice(0, -3) : value;
  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) return invalidColor();
  const number = Number(normalized);
  if (!Number.isFinite(number) || Math.abs(number) > 360000) return invalidColor();
  return (number % 360 + 360) % 360;
}
function hslRgb(h: number, s: number, l: number): number[] {
  const a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map((n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  });
}
function hsvRgb(h: number, s: number, v: number): number[] {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  const values = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h / 60)]!;
  return values.map((n) => Math.round((n + m) * 255));
}
function format(n: number, places = 2): string { return String(Number(n.toFixed(places))); }

export function convertColor(input: string): ParsedColor {
  if (input.length > INSPECTOR_LIMITS.colorChars) return invalidColor();
  const value = input.trim();
  let r = 0, g = 0, b = 0, a = 1;
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value);
  if (hex) {
    let digits = hex[1]!;
    if (digits.length <= 4) digits = Array.from(digits, (n) => n + n).join("");
    r = Number.parseInt(digits.slice(0, 2), 16);
    g = Number.parseInt(digits.slice(2, 4), 16);
    b = Number.parseInt(digits.slice(4, 6), 16);
    if (digits.length === 8) a = Number.parseInt(digits.slice(6, 8), 16) / 255;
  } else {
    const match = /^(rgb|rgba|hsl|hsla|hsv|hsva)\(([^()]*)\)$/i.exec(value);
    if (!match) return invalidColor();
    const method = match[1]!.toLowerCase();
    const tokens = match[2]!.replace(/\s*\/\s*/g, " / ").trim().split(/[\s,]+/).filter(Boolean);
    const slash = tokens.indexOf("/");
    if (slash !== -1 && (slash !== 3 || tokens.length !== 5)) return invalidColor();
    const parts = tokens.filter((token) => token !== "/");
    if (parts.length !== 3 && parts.length !== 4) return invalidColor();
    if (slash !== -1 && parts.length !== 4) return invalidColor();
    if (parts.length === 4) a = alpha(parts[3]!);
    if (method.startsWith("rgb")) {
      r = rgbComponent(parts[0]!);
      g = rgbComponent(parts[1]!);
      b = rgbComponent(parts[2]!);
    } else {
      const h = hue(parts[0]!);
      const s = percent(parts[1]!);
      const x = percent(parts[2]!);
      [r,g,b] = method.startsWith("hsl") ? hslRgb(h,s,x) : hsvRgb(h,s,x);
    }
  }
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2,"0").toUpperCase();
  const color = "#" + toHex(r) + toHex(g) + toHex(b);
  const alphaHex = toHex(Math.round(a * 255));
  const red = r / 255, green = g / 255, blue = b / 255;
  const max = Math.max(red,green,blue), min = Math.min(red,green,blue), delta = max-min;
  let h = 0;
  if (delta !== 0) {
    if (max === red) h = ((green-blue)/delta) % 6;
    else if (max === green) h = (blue-red)/delta + 2;
    else h = (red-green)/delta + 4;
    h = (h * 60 + 360) % 360;
  }
  const l = (max + min) / 2;
  const hslS = delta === 0 ? 0 : delta / (1 - Math.abs(2*l - 1));
  const hsvS = max === 0 ? 0 : delta / max;
  const renderedAlpha = format(a, 4);
  return {
    hex: color + alphaHex,
    rgb: "rgb(" + r + " " + g + " " + b + " / " + renderedAlpha + ")",
    hsl: "hsl(" + format(h) + "deg " + format(hslS*100) + "% " + format(l*100) + "% / " + renderedAlpha + ")",
    hsv: "hsv(" + format(h) + "deg " + format(hsvS*100) + "% " + format(max*100) + "% / " + renderedAlpha + ")",
    r,g,b,a,
  };
}