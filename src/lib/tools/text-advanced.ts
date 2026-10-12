import { assertInputSize, ToolError } from "./errors";

export const TEXT_ADVANCED_LIMITS = {
  statsBytes: 128 * 1024,
  literalBytes: 64 * 1024,
  outputBytes: 512 * 1024,
  deferredChars: 4096,
} as const;

export type CaseStyle = "original" | "upper" | "lower" | "title" | "camel" | "snake";
export type LiteralFormat = "json" | "js" | "c" | "xml" | "csv" | "sql";
export type LiteralDirection = "encode" | "decode";

function scalarText(input: string): void {
  for (let i = 0; i < input.length; i++) {
    const value = input.charCodeAt(i);
    if (value >= 0xd800 && value <= 0xdbff) {
      const next = input.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new ToolError("INSPECT_INVALID_UNICODE");
    } else if (value >= 0xdc00 && value <= 0xdfff) {
      throw new ToolError("INSPECT_INVALID_UNICODE");
    }
  }
}

function checkResult(text: string): string {
  scalarText(text);
  assertInputSize(text, TEXT_ADVANCED_LIMITS.outputBytes);
  return text;
}

export interface TextAnalysis {
  utf16: number;
  codePoints: number;
  graphemes: number;
  words: number;
  lines: number;
  bytes: number;
  transformed: string;
}

/** Unicode counts have intentionally different definitions (UTF-16 / scalars / EGC / segments). */
export function analyzeText(input: string, locale: string, style: CaseStyle): TextAnalysis {
  assertInputSize(input, TEXT_ADVANCED_LIMITS.statsBytes);
  scalarText(input);
  const graphemes = [...new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(input)].length;
  const segments = [...new Intl.Segmenter(locale, { granularity: "word" }).segment(input)];
  const words = segments.filter((segment) => segment.isWordLike);
  const upperFirst = (word: string) => {
    const [first = "", ...rest] = Array.from(word);
    return first.toLocaleUpperCase(locale) + rest.join("").toLocaleLowerCase(locale);
  };
  let transformed = input;
  switch (style) {
    case "upper": transformed = input.toLocaleUpperCase(locale); break;
    case "lower": transformed = input.toLocaleLowerCase(locale); break;
    case "title":
      transformed = segments.map((segment) =>
        segment.isWordLike ? upperFirst(segment.segment) : segment.segment,
      ).join("");
      break;
    case "camel":
      transformed = words.map((segment, index) => index === 0
        ? segment.segment.toLocaleLowerCase(locale)
        : upperFirst(segment.segment)).join("");
      break;
    case "snake":
      transformed = words.map((segment) => segment.segment.toLocaleLowerCase(locale)).join("_");
      break;
  }
  return {
    utf16: input.length,
    codePoints: Array.from(input).length,
    graphemes,
    words: words.length,
    lines: input.length === 0 ? 0 : input.split(/\r\n|\r|\n/).length,
    bytes: new TextEncoder().encode(input).byteLength,
    transformed: checkResult(transformed),
  };
}

function xmlScalar(codepoint: number): boolean {
  return codepoint === 0x9 || codepoint === 0xa || codepoint === 0xd ||
    (codepoint >= 0x20 && codepoint <= 0xd7ff) ||
    (codepoint >= 0xe000 && codepoint <= 0xfffd) ||
    (codepoint >= 0x10000 && codepoint <= 0x10ffff);
}

const xmlNames: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
};
function decodeXml(input: string): string {
  return input.replace(/&([^;\s]*);|&/g, (reference, name: string | undefined) => {
    if (name === undefined) throw new ToolError("INSPECT_INVALID_LITERAL");
    if (Object.hasOwn(xmlNames, name)) return xmlNames[name]!;
    const radix = /^#x[0-9a-f]+$/i.test(name) ? 16 : /^#[0-9]+$/.test(name) ? 10 : 0;
    if (!radix) throw new ToolError("INSPECT_INVALID_LITERAL");
    const cp = Number.parseInt(name.slice(radix === 16 ? 2 : 1), radix);
    if (!xmlScalar(cp)) throw new ToolError("INSPECT_INVALID_LITERAL");
    return String.fromCodePoint(cp);
  });
}

function encodeCLiteral(input: string): string {
  const escapes: Record<string, string> = {
    "\\": "\\\\", '"': '\\"', "\0": "\\0", "\n": "\\n", "\r": "\\r",
    "\t": "\\t", "\b": "\\b", "\f": "\\f", "\v": "\\v",
  };
  let out = '"';
  for (const char of input) {
    if (Object.hasOwn(escapes, char)) out += escapes[char];
    else if (char.codePointAt(0)! < 32 || char.codePointAt(0) === 127)
      throw new ToolError("INSPECT_INVALID_LITERAL");
    else out += char;
  }
  return out + '"';
}

function decodeCLiteral(input: string): string {
  if (!input.startsWith('"') || !input.endsWith('"') || input.length < 2)
    throw new ToolError("INSPECT_INVALID_LITERAL");
  const escapes: Record<string, string> = {
    "0": "\0", n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v",
    "\\": "\\", '"': '"', "'": "'",
  };
  const body = input.slice(1, -1);
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const char = body[i]!;
    if (char === '"' || char === "\n" || char === "\r") throw new ToolError("INSPECT_INVALID_LITERAL");
    if (char !== "\\") { out += char; continue; }
    const type = body[++i];
    if (!type) throw new ToolError("INSPECT_INVALID_LITERAL");
    if (Object.hasOwn(escapes, type)) { out += escapes[type]; continue; }
    const width = type === "x" ? 2 : type === "u" ? 4 : type === "U" ? 8 : 0;
    const digits = body.slice(i + 1, i + width + 1);
    if (!width || digits.length !== width || !/^[0-9a-f]+$/i.test(digits))
      throw new ToolError("INSPECT_INVALID_LITERAL");
    const cp = Number.parseInt(digits, 16);
    if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff))
      throw new ToolError("INSPECT_INVALID_LITERAL");
    out += String.fromCodePoint(cp);
    i += width;
  }
  return out;
}

/** No evaluation: JS accepts only the JSON-compatible double-quoted subset. */
export function transformLiteral(
  input: string, format: LiteralFormat, direction: LiteralDirection,
): string {
  assertInputSize(input, TEXT_ADVANCED_LIMITS.literalBytes);
  scalarText(input);
  if (direction === "encode") {
    switch (format) {
      case "json": case "js": return checkResult(JSON.stringify(input));
      case "c": return checkResult(encodeCLiteral(input));
      case "xml": {
        for (const char of input) {
          if (!xmlScalar(char.codePointAt(0)!)) throw new ToolError("INSPECT_INVALID_LITERAL");
        }
        return checkResult(input.replace(/[&<>"']/g, (char) => {
          const map: Record<string, string> = {
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
          };
          return map[char]!;
        }));
      }
      case "csv": return checkResult('"' + input.replace(/"/g, '""') + '"');
      case "sql": return checkResult("'" + input.replace(/'/g, "''") + "'");
    }
  }
  try {
    switch (format) {
      case "json": case "js": {
        const value: unknown = JSON.parse(input);
        if (typeof value !== "string") throw new ToolError("INSPECT_INVALID_LITERAL");
        return checkResult(value);
      }
      case "c": return checkResult(decodeCLiteral(input));
      case "xml": return checkResult(decodeXml(input));
      case "csv": {
        if (/^"(?:[^"]|"")*"$/.test(input))
          return checkResult(input.slice(1, -1).replace(/""/g, '"'));
        if (/^[^",\r\n]*$/.test(input)) return checkResult(input);
        throw new ToolError("INSPECT_INVALID_LITERAL");
      }
      case "sql": {
        if (!/^'(?:[^']|'')*'$/.test(input)) throw new ToolError("INSPECT_INVALID_LITERAL");
        return checkResult(input.slice(1, -1).replace(/''/g, "'"));
      }
    }
  } catch {
    throw new ToolError("INSPECT_INVALID_LITERAL");
  }
}