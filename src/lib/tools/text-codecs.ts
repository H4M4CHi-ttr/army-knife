import { assertInputSize, ToolError } from "./errors";

export type TextDirection = "encode" | "decode";
export type PercentMode = "component" | "form" | "path";
export type HtmlEscapeMode = "minimal" | "full";

export const TEXT_CODEC_LIMITS = {
  inputBytes: 64 * 1024,
  outputCharacters: 512 * 1024,
  deferredThreshold: 8192,
} as const;

/** Deliberately documented subset of named HTML5 references; no HTML is rendered. */
const named = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0",
  copy: "\u00a9", reg: "\u00ae", trade: "\u2122", euro: "\u20ac",
  hellip: "\u2026", mdash: "\u2014", ndash: "\u2013",
  times: "\u00d7", divide: "\u00f7",
} as const;
const unsafe = new Map([
  ["&", "&amp;"], ["<", "&lt;"], [">", "&gt;"],
  ['"', "&quot;"], ["'", "&#39;"],
]);

function checkedOutput(output: string): string {
  if (output.length > TEXT_CODEC_LIMITS.outputCharacters) throw new ToolError("INPUT_TOO_LARGE");
  return output;
}

/**
 * Encode special HTML characters; full also encodes non-ASCII Unicode scalars.
 * Decode only semicolon-terminated named references from the documented list
 * and valid decimal/hexadecimal numeric references. Never parse HTML or assign
 * user data to innerHTML. Unknown/invalid references are left verbatim.
 */
export function transformHtmlEntities(
  input: string,
  direction: TextDirection,
  mode: HtmlEscapeMode = "minimal",
): string {
  assertInputSize(input, TEXT_CODEC_LIMITS.inputBytes);
  if (!["encode", "decode"].includes(direction) || !["minimal", "full"].includes(mode))
    throw new ToolError("INVALID_REQUEST");
  if (direction === "decode") {
    return checkedOutput(input.replace(
      /&(#(?:[xX][\da-fA-F]+|\d+)|[a-zA-Z][a-zA-Z0-9]*);/g,
      (match, entity: string) => {
        if (entity.startsWith("#")) {
          const hex = /^#x/i.test(entity);
          const digits = entity.slice(hex ? 2 : 1);
          const number = Number.parseInt(digits, hex ? 16 : 10);
          return Number.isInteger(number) && number > 0 && number <= 0x10ffff &&
            (number < 0xd800 || number > 0xdfff)
            ? String.fromCodePoint(number)
            : match;
        }
        return named[entity as keyof typeof named] ?? match;
      },
    ));
  }
  let output = "";
  for (const character of input) {
    const point = character.codePointAt(0)!;
    if (point >= 0xd800 && point <= 0xdfff) throw new ToolError("CODEC_INVALID_TEXT");
    output += unsafe.get(character) ??
      (mode === "full" && point > 0x7e ? "&#x" + point.toString(16).toUpperCase() + ";" : character);
    if (output.length > TEXT_CODEC_LIMITS.outputCharacters) throw new ToolError("INPUT_TOO_LARGE");
  }
  return output;
}

/**
 * Percent-encoding a string, NOT parsing a URL or fetching a resource.
 * - component: encodeURIComponent rules
 * - form: WHATWG application/x-www-form-urlencoded (+ represents space)
 * - path: encode each slash-delimited path segment, preserving literal /.
 * Strict UTF-8 decoding rejects malformed escapes rather than replacing bytes.
 */
export function transformPercentEncoding(
  input: string,
  direction: TextDirection,
  mode: PercentMode,
): string {
  assertInputSize(input, TEXT_CODEC_LIMITS.inputBytes);
  if (!["encode", "decode"].includes(direction) ||
      !["component", "form", "path"].includes(mode)) throw new ToolError("INVALID_REQUEST");
  try {
    if (direction === "decode")
      return checkedOutput(decodeURIComponent(mode === "form" ? input.replace(/\+/g, " ") : input));
    if (mode === "form")
      return checkedOutput(new URLSearchParams([["value", input]]).toString().slice(6));
    if (mode === "path")
      return checkedOutput(input.split("/").map((segment) => encodeURIComponent(segment)).join("/"));
    return checkedOutput(encodeURIComponent(input));
  } catch (error) {
    if (error instanceof ToolError) throw error;
    throw new ToolError("CODEC_INVALID_TEXT");
  }
}
