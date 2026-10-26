import { assertInputSize, ToolError } from "./errors";

export const DISPOSITION_LIMITS = { bytes: 8192, parameters: 32, nameCharacters: 64, valueCharacters: 1024, deferredCharacters: 2048 } as const;
export type DispositionNote = "unknown-disposition" | "extension" | "legacy-charset" | "unsupported-charset";
export type FilenameNote = "empty" | "path" | "controls" | "edge-whitespace" | "trailing-dot" | "reserved" | "platform-characters" | "percent-literal";
export interface DispositionParameter {
  name: string;
  value: string;
  charset: string | null;
  language: string | null;
  decoded: string | null;
}
export interface DispositionReport {
  disposition: string;
  parameters: DispositionParameter[];
  filename: string | null;
  preferredFilename: string | null;
  preferredSource: "filename" | "filename*" | null;
  notes: DispositionNote[];
  filenameNotes: FilenameNote[];
}
const TOKEN = /[!#$%&'*+.^_`|~0-9A-Za-z-]/;
// Inspection deliberately detects controls instead of removing them from names.
// eslint-disable-next-line no-control-regex, no-misleading-character-class
const HIDDEN = /[\x00-\x1f\x7f-\x9f\u00ad\u{034f}\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/u;
const trim = (s: string) => s.replace(/^[ \t]+|[ \t]+$/g, "");
function fail(code = "DISPOSITION_SYNTAX"): never { throw new ToolError(code); }

/** Quote strings and expose invisible characters; the report preserves originals. */
export function dispositionDisplay(value: string): string {
  // U+034F is intentionally matched as a single invisible combining character.
  // eslint-disable-next-line no-misleading-character-class
  return JSON.stringify(value).replace(/[\x7f-\x9f\u00ad\u{034f}\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/gu,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
function filenameNotes(value: string): FilenameNote[] {
  const notes: FilenameNote[] = [];
  if (!value) notes.push("empty");
  if (/[\\/]/.test(value)) notes.push("path");
  if (HIDDEN.test(value)) notes.push("controls");
  if (value !== value.trim()) notes.push("edge-whitespace");
  if (value.endsWith(".")) notes.push("trailing-dot");
  if (/^(?:\.{1,2}|~|\||(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\..*)?)$/i.test(value.trim())) notes.push("reserved");
  if (/[<>:"|?*]/.test(value)) notes.push("platform-characters");
  if (/%[0-9a-f]{2}/i.test(value)) notes.push("percent-literal");
  return notes;
}
function extended(value: string, quoted: boolean): Pick<DispositionParameter, "charset" | "language" | "decoded"> {
  // Only the subtag shape is checked; this is not a BCP 47 registry validator.
  const parts = /^([A-Za-z0-9!#$%&+^_`{}~-]+)'([A-Za-z0-9-]*)'(.*)$/.exec(value);
  if (quoted || !parts || (parts[2] && !/^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/.test(parts[2]))) fail("DISPOSITION_ENCODING");
  const [, charset, language, encoded] = parts;
  const bytes: number[] = [];
  for (let i = 0; i < encoded!.length; i++) {
    const c = encoded![i]!;
    if (c === "%") {
      const hex = encoded!.slice(i + 1, i + 3);
      if (!/^[0-9a-f]{2}$/i.test(hex)) fail("DISPOSITION_ENCODING");
      bytes.push(Number.parseInt(hex, 16)); i += 2;
    } else {
      if (!/[A-Za-z0-9!#$&+.^_`|~-]/.test(c)) fail("DISPOSITION_ENCODING");
      bytes.push(c.charCodeAt(0));
    }
  }
  let decoded: string | null = null;
  if (charset!.toLowerCase() === "utf-8") {
    try { decoded = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(bytes)); }
    catch { fail("DISPOSITION_ENCODING"); }
  } else if (charset!.toLowerCase() === "iso-8859-1") {
    // TextDecoder's latin1 alias is Windows-1252, which changes bytes 80–9F.
    decoded = String.fromCharCode(...bytes);
  }
  return { charset: charset!, language: language!, decoded };
}

/** Bounded HTTP response field inspection, without browser recovery or file I/O. */
export function inspectContentDisposition(input: string): DispositionReport {
  assertInputSize(input, DISPOSITION_LIMITS.bytes);
  let source = trim(input.replace(/\r?\n$/, ""));
  if (!source) fail("DISPOSITION_EMPTY");
  if (/[^\t\x20-\x7e\x80-\xff]/.test(source)) fail();
  if (/^content-disposition:/i.test(source)) source = trim(source.slice(20));
  let position = 0;
  function whitespace() { while (source[position] === " " || source[position] === "\t") position++; }
  function token() {
    const start = position;
    while (position < source.length && TOKEN.test(source[position]!)) position++;
    const value = source.slice(start, position);
    if (!value) fail();
    return value;
  }
  function name() {
    const value = token().toLowerCase();
    if (value.length > DISPOSITION_LIMITS.nameCharacters) fail("DISPOSITION_LIMIT");
    return value;
  }
  function parameterValue() {
    if (source[position] !== '"') return { value: token(), quoted: false };
    position++;
    let value = "";
    while (position < source.length) {
      let c = source[position++]!;
      if (c === '"') return { value, quoted: true };
      if (c === "\\") {
        if (position === source.length) fail();
        c = source[position++]!;
      }
      value += c;
      if (value.length > DISPOSITION_LIMITS.valueCharacters) fail("DISPOSITION_LIMIT");
    }
    return fail();
  }
  const disposition = name();
  const parameters: DispositionParameter[] = [];
  const seen = new Set<string>();
  whitespace();
  while (position < source.length) {
    if (source[position++] !== ";") fail();
    if (parameters.length >= DISPOSITION_LIMITS.parameters) fail("DISPOSITION_LIMIT");
    whitespace();
    const parameterName = name();
    if (/\*\d+\*?$/.test(parameterName)) fail("DISPOSITION_CONTINUATION");
    if (seen.has(parameterName)) fail("DISPOSITION_DUPLICATE");
    seen.add(parameterName);
    whitespace();
    if (source[position++] !== "=") fail();
    whitespace();
    const { value, quoted } = parameterValue();
    if (value.length > DISPOSITION_LIMITS.valueCharacters) fail("DISPOSITION_LIMIT");
    const detail = parameterName.endsWith("*") ? extended(value, quoted) : { charset: null, language: null, decoded: null };
    parameters.push({ name: parameterName, value, ...detail });
    whitespace();
  }
  const filename = parameters.find((p) => p.name === "filename")?.value ?? null;
  const star = parameters.find((p) => p.name === "filename*");
  const preferredFilename = star ? star.decoded : filename;
  const preferredSource = preferredFilename === null ? null : star ? "filename*" : "filename";
  const notes: DispositionNote[] = [];
  if (disposition !== "inline" && disposition !== "attachment") notes.push("unknown-disposition");
  if (parameters.some((p) => p.name !== "filename" && p.name !== "filename*")) notes.push("extension");
  if (parameters.some((p) => p.charset?.toLowerCase() === "iso-8859-1")) notes.push("legacy-charset");
  if (parameters.some((p) => p.charset !== null && p.decoded === null)) notes.push("unsupported-charset");
  const names = [filename, star?.decoded ?? null].filter((v): v is string => v !== null);
  return { disposition, parameters, filename, preferredFilename, preferredSource, notes,
    filenameNotes: [...new Set(names.flatMap(filenameNotes))] };
}
