import { assertInputSize, ToolError } from "./errors";

export const SERVER_TIMING_LIMITS = {
  bytes: 8192, lines: 32, metrics: 64, parameters: 16,
  nameCharacters: 64, valueCharacters: 1024, deferredCharacters: 2048,
} as const;
export type ServerTimingNote = "duplicate-parameter" | "extension" | "duration-format";
export interface ServerTimingMetric {
  name: string;
  duration: string | null;
  description: string | null;
  parameters: { name: string; value: string; ignored: boolean }[];
  notes: ServerTimingNote[];
}
export interface ServerTimingReport { metrics: ServerTimingMetric[] }
const TOKEN_CHARACTER = /[!#$%&'*+.^_`|~0-9A-Za-z-]/;
const trim = (value: string) => value.replace(/^[ \t]+|[ \t]+$/g, "");
function syntax(): never { throw new ToolError("SERVER_TIMING_SYNTAX"); }
function limit(): never { throw new ToolError("SERVER_TIMING_LIMIT"); }

/** Strict sender grammar inspection; deliberately not browser error recovery. */
export function inspectServerTiming(input: string): ServerTimingReport {
  assertInputSize(input, SERVER_TIMING_LIMITS.bytes);
  const normalized = input.replace(/\r\n/g, "\n");
  if (/[^\t\n\x20-\x7e\x80-\xff]/.test(normalized)) syntax();
  const physicalLines = normalized.split("\n");
  if (physicalLines.length > SERVER_TIMING_LIMITS.lines) limit();
  const lines = physicalLines.map(trim).filter(Boolean);
  if (!lines.length) throw new ToolError("SERVER_TIMING_EMPTY");
  let sources: string[];
  if (/^server-timing:/i.test(lines[0]!)) {
    if (physicalLines.some((line) => /^[ \t]/.test(line)) || lines.some((line) => !/^server-timing:/i.test(line))) {
      throw new ToolError("SERVER_TIMING_HEADERS");
    }
    sources = lines.map((line) => line.slice(14));
  } else {
    if (lines.length !== 1) throw new ToolError("SERVER_TIMING_HEADERS");
    sources = [lines[0]!];
  }
  const metrics: ServerTimingMetric[] = [];
  // Validate every physical field independently. Joining values first could let
  // a malformed quote or escape consume the beginning of the next header.
  for (const source of sources) {
    let position = 0;
    function whitespace() { while (source[position] === " " || source[position] === "\t") position++; }
    function token() {
      const start = position;
      while (position < source.length && TOKEN_CHARACTER.test(source[position]!)) position++;
      const value = source.slice(start, position);
      if (!value) syntax();
      return value;
    }
    function name() {
      const value = token();
      if (value.length > SERVER_TIMING_LIMITS.nameCharacters) limit();
      return value;
    }
    function parameterValue() {
      if (source[position] !== '"') {
        const value = token();
        if (value.length > SERVER_TIMING_LIMITS.valueCharacters) limit();
        return value;
      }
      position++;
      let value = "";
      while (position < source.length) {
        let character = source[position++]!;
        if (character === '"') return value;
        if (character === "\\") {
          if (position === source.length) syntax();
          character = source[position++]!;
        }
        if (character === "\n") syntax();
        value += character;
        if (value.length > SERVER_TIMING_LIMITS.valueCharacters) limit();
      }
      return syntax();
    }
    while (position < source.length) {
      whitespace();
      if (source[position] === ",") { position++; continue; }
      if (position === source.length) break;
      if (metrics.length >= SERVER_TIMING_LIMITS.metrics) limit();
      const row: ServerTimingMetric = { name: name(), duration: null, description: null, parameters: [], notes: [] };
      const first = new Map<string, string>();
      whitespace();
      while (source[position] === ";") {
        if (row.parameters.length >= SERVER_TIMING_LIMITS.parameters) limit();
        position++;
        whitespace();
        const parameterName = name();
        whitespace();
        if (source[position++] !== "=") syntax();
        whitespace();
        const value = parameterValue();
        const ignored = first.has(parameterName);
        row.parameters.push({ name: parameterName, value, ignored });
        if (!ignored) first.set(parameterName, value);
        whitespace();
      }
      if (position < source.length && source[position] !== ",") syntax();
      if (row.parameters.some((parameter) => parameter.ignored)) row.notes.push("duplicate-parameter");
      if (row.parameters.some((parameter) => parameter.name !== "dur" && parameter.name !== "desc")) row.notes.push("extension");
      const duration = first.get("dur");
      if (duration !== undefined) {
        // Keep every digit: no Number conversion, summation or invented timeline.
        if (/^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(duration)) row.duration = duration;
        else row.notes.push("duration-format");
      }
      row.description = first.get("desc") ?? null;
      metrics.push(row);
    }
  }
  if (!metrics.length) throw new ToolError("SERVER_TIMING_EMPTY");
  return { metrics };
}
