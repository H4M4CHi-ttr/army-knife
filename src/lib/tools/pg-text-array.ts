import { assertInputSize, ToolError } from "./errors";

export const PG_TEXT_ARRAY_LIMITS = {
  inputBytes: 8192, items: 256, outputBytes: 32768, previewItems: 32, deferredCharacters: 2048,
} as const;
export interface PgTextArrayReport {
  values: (string | null)[];
  array: string;
  json: string;
  nullCount: number;
  emptyCount: number;
  dimensions: 0 | 1;
}

const space = (c: string | undefined) => c !== undefined && " \t\n\r\v\f".includes(c);
function syntax(): never { throw new ToolError("PG_ARRAY_SYNTAX"); }
function text(value: string): void {
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c === 0) throw new ToolError("PG_ARRAY_TEXT");
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new ToolError("PG_ARRAY_TEXT");
    } else if (c >= 0xdc00 && c <= 0xdfff) throw new ToolError("PG_ARRAY_TEXT");
  }
}
function inputGuard(input: string): void {
  assertInputSize(input, PG_TEXT_ARRAY_LIMITS.inputBytes);
  text(input);
}
function report(values: (string | null)[]): PgTextArrayReport {
  if (values.length > PG_TEXT_ARRAY_LIMITS.items) throw new ToolError("PG_ARRAY_COUNT");
  for (const value of values) if (value !== null) text(value);
  const array = "{" + values.map(value => value === null ? "NULL" : '"' + value.replace(/["\\]/g, c => "\\" + c) + '"').join(",") + "}";
  const json = JSON.stringify(values, null, 2);
  const encoder = new TextEncoder();
  if (encoder.encode(array).length > PG_TEXT_ARRAY_LIMITS.outputBytes || encoder.encode(json).length > PG_TEXT_ARRAY_LIMITS.outputBytes) {
    throw new ToolError("PG_ARRAY_OUTPUT_LIMIT");
  }
  return { values, array, json, nullCount: values.filter(v => v === null).length,
    emptyCount: values.filter(v => v === "").length, dimensions: values.length ? 1 : 0 };
}

/** One comma-delimited text[] value with array_nulls=on; not a SQL string parser. */
export function decodePgTextArray(input: string): PgTextArrayReport {
  inputGuard(input);
  let i = 0;
  const skip = () => { while (space(input[i])) i++; };
  skip();
  if (/^\[[+-]?[0-9]+:[+-]?[0-9]+\]/.test(input.slice(i))) throw new ToolError("PG_ARRAY_DIMENSIONS");
  if (input[i++] !== "{") syntax();
  const values: (string | null)[] = [];
  skip();
  if (input[i] === "}") i++;
  else for (;;) {
    skip();
    if (input[i] === "{") throw new ToolError("PG_ARRAY_DIMENSIONS");
    if (input[i] === undefined || input[i] === "," || input[i] === "}") syntax();
    const quoted = input[i] === '"';
    let value = "", escaped = false;
    if (quoted) {
      i++;
      let closed = false;
      while (i < input.length) {
        const c = input[i++]!;
        if (c === '"') { closed = true; break; }
        if (c === "\\") {
          if (i === input.length) syntax();
          value += input[i++]!;
        } else value += c;
      }
      if (!closed) syntax();
      skip();
    } else {
      let kept = 0;
      while (i < input.length && input[i] !== "," && input[i] !== "}") {
        const c = input[i++]!;
        if (c === "{" || c === '"') syntax();
        if (c === "\\") {
          if (i === input.length) syntax();
          value += input[i++]!;
          kept = value.length; escaped = true;
        } else {
          value += c;
          if (!space(c)) kept = value.length;
        }
      }
      value = value.slice(0, kept);
      if (!value) syntax();
    }
    if (values.length === PG_TEXT_ARRAY_LIMITS.items) throw new ToolError("PG_ARRAY_COUNT");
    values.push(!quoted && !escaped && value.toUpperCase() === "NULL" ? null : value);
    if (input[i] === ",") { i++; continue; }
    if (input[i] === "}") { i++; break; }
    syntax();
  }
  skip();
  if (i !== input.length) syntax();
  return report(values);
}

/** Only JSON strings/nulls are accepted; numbers are never rounded or coerced. */
export function encodePgTextArray(input: string): PgTextArrayReport {
  inputGuard(input);
  let values: unknown;
  try { values = JSON.parse(input); }
  catch { throw new ToolError("PG_ARRAY_JSON_SYNTAX"); }
  if (!Array.isArray(values) || values.some(v => v !== null && typeof v !== "string")) throw new ToolError("PG_ARRAY_JSON_SHAPE");
  return report(values);
}
