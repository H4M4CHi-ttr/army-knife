import { assertInputSize } from "./errors";

export type UnicodeFindingKind =
  | "bidi"
  | "joiner"
  | "variation"
  | "tag"
  | "space"
  | "control"
  | "format"
  | "invalid";

export interface UnicodeFinding {
  /** Zero-based offset in the source JavaScript UTF-16 string. */
  utf16Offset: number;
  /** One-based code-point position, line, and column. */
  position: number;
  line: number;
  column: number;
  codePoint: string;
  escape: string;
  name: string;
  kind: UnicodeFindingKind;
}

export interface UnicodeReport {
  findings: UnicodeFinding[];
  totalFindings: number;
  truncated: boolean;
  codePoints: number;
  utf16Length: number;
  utf8Bytes: number;
  lineCount: number;
  isNfc: boolean;
  isNfkc: boolean;
  /** Invisible controls are replaced with visible labels, never silently removed. */
  visualized: string;
  previewTruncated: boolean;
}

export const UNICODE_LIMITS = Object.freeze({
  inputBytes: 512 * 1024,
  findings: 1_000,
  previewCharacters: 20_000,
});

const names: Record<number, string> = {
  0x0000: "NULL",
  0x0008: "BACKSPACE",
  0x0009: "CHARACTER TABULATION",
  0x000a: "LINE FEED",
  0x000b: "LINE TABULATION",
  0x000c: "FORM FEED",
  0x000d: "CARRIAGE RETURN",
  0x001b: "ESCAPE",
  0x007f: "DELETE",
  0x0085: "NEXT LINE",
  0x00a0: "NO-BREAK SPACE",
  0x00ad: "SOFT HYPHEN",
  0x034f: "COMBINING GRAPHEME JOINER",
  0x061c: "ARABIC LETTER MARK",
  0x115f: "HANGUL CHOSEONG FILLER",
  0x1160: "HANGUL JUNGSEONG FILLER",
  0x1680: "OGHAM SPACE MARK",
  0x180e: "MONGOLIAN VOWEL SEPARATOR",
  0x2000: "EN QUAD",
  0x2001: "EM QUAD",
  0x2002: "EN SPACE",
  0x2003: "EM SPACE",
  0x2004: "THREE-PER-EM SPACE",
  0x2005: "FOUR-PER-EM SPACE",
  0x2006: "SIX-PER-EM SPACE",
  0x2007: "FIGURE SPACE",
  0x2008: "PUNCTUATION SPACE",
  0x2009: "THIN SPACE",
  0x200a: "HAIR SPACE",
  0x200b: "ZERO WIDTH SPACE",
  0x200c: "ZERO WIDTH NON-JOINER",
  0x200d: "ZERO WIDTH JOINER",
  0x200e: "LEFT-TO-RIGHT MARK",
  0x200f: "RIGHT-TO-LEFT MARK",
  0x2028: "LINE SEPARATOR",
  0x2029: "PARAGRAPH SEPARATOR",
  0x202a: "LEFT-TO-RIGHT EMBEDDING",
  0x202b: "RIGHT-TO-LEFT EMBEDDING",
  0x202c: "POP DIRECTIONAL FORMATTING",
  0x202d: "LEFT-TO-RIGHT OVERRIDE",
  0x202e: "RIGHT-TO-LEFT OVERRIDE",
  0x202f: "NARROW NO-BREAK SPACE",
  0x205f: "MEDIUM MATHEMATICAL SPACE",
  0x2060: "WORD JOINER",
  0x2061: "FUNCTION APPLICATION",
  0x2062: "INVISIBLE TIMES",
  0x2063: "INVISIBLE SEPARATOR",
  0x2064: "INVISIBLE PLUS",
  0x2066: "LEFT-TO-RIGHT ISOLATE",
  0x2067: "RIGHT-TO-LEFT ISOLATE",
  0x2068: "FIRST STRONG ISOLATE",
  0x2069: "POP DIRECTIONAL ISOLATE",
  0x3000: "IDEOGRAPHIC SPACE",
  0x3164: "HANGUL FILLER",
  0xfeff: "ZERO WIDTH NO-BREAK SPACE / BOM",
  0xffa0: "HALFWIDTH HANGUL FILLER",
  0xe0001: "LANGUAGE TAG",
  0xe007f: "CANCEL TAG",
};

function classify(
  character: string,
  value: number,
  includeCommonWhitespace: boolean,
): UnicodeFindingKind | null {
  if (value >= 0xd800 && value <= 0xdfff) return "invalid";
  if (
    value === 0x061c ||
    value === 0x200e ||
    value === 0x200f ||
    (value >= 0x202a && value <= 0x202e) ||
    (value >= 0x2066 && value <= 0x2069)
  )
    return "bidi";
  if (value === 0x200c || value === 0x200d) return "joiner";
  if (
    (value >= 0xfe00 && value <= 0xfe0f) ||
    (value >= 0xe0100 && value <= 0xe01ef) ||
    (value >= 0x180b && value <= 0x180d) ||
    value === 0x180f
  )
    return "variation";
  if (value === 0xe0001 || (value >= 0xe0020 && value <= 0xe007f)) return "tag";
  if (value === 0x09 || value === 0x0a || value === 0x0d)
    return includeCommonWhitespace ? "control" : null;
  if (value <= 0x1f || (value >= 0x7f && value <= 0x9f)) return "control";
  if (value !== 0x20 && /\p{White_Space}/u.test(character)) return "space";
  if (/\p{Default_Ignorable_Code_Point}|\p{Cf}/u.test(character)) return "format";
  return null;
}

function characterName(value: number, kind: UnicodeFindingKind): string {
  if (names[value]) return names[value];
  if (value >= 0xfe00 && value <= 0xfe0f) return `VARIATION SELECTOR-${value - 0xfe00 + 1}`;
  if (value >= 0xe0100 && value <= 0xe01ef) return `VARIATION SELECTOR-${value - 0xe0100 + 17}`;
  if (value >= 0xe0020 && value <= 0xe007e) return `TAG ${String.fromCodePoint(value - 0xe0000)}`;
  if (kind === "invalid") return "UNPAIRED UTF-16 SURROGATE";
  return kind === "control" ? "CONTROL CHARACTER" : "INVISIBLE / FORMATTING CHARACTER";
}

export function inspectUnicode(input: string, includeCommonWhitespace = false): UnicodeReport {
  assertInputSize(input, UNICODE_LIMITS.inputBytes);
  const findings: UnicodeFinding[] = [];
  let totalFindings = 0;
  let codePoints = 0;
  let utf16Offset = 0;
  let line = 1;
  let column = 1;
  let previousWasCr = false;
  let visualized = "";
  let previewTruncated = false;
  for (const character of input) {
    const value = character.codePointAt(0) as number;
    codePoints += 1;
    const kind = classify(character, value, includeCommonWhitespace);
    const codePoint = `U+${value.toString(16).toUpperCase().padStart(4, "0")}`;
    const label = kind ? `⟦${codePoint}⟧` : character;
    if (visualized.length + label.length <= UNICODE_LIMITS.previewCharacters && !previewTruncated) {
      visualized += label;
    } else {
      previewTruncated = true;
    }
    if (kind) {
      totalFindings += 1;
      if (findings.length < UNICODE_LIMITS.findings) {
        findings.push({
          utf16Offset,
          position: codePoints,
          line,
          column,
          codePoint,
          escape:
            value <= 0xffff
              ? `\\u${value.toString(16).padStart(4, "0")}`
              : `\\u{${value.toString(16)}}`,
          name: characterName(value, kind),
          kind,
        });
      }
    }
    if (character === "\r") {
      line += 1;
      column = 1;
    } else if (character === "\n") {
      if (!previousWasCr) line += 1;
      column = 1;
    } else if (value === 0x2028 || value === 0x2029 || value === 0x0085) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
    previousWasCr = character === "\r";
    utf16Offset += character.length;
  }
  return {
    findings,
    totalFindings,
    truncated: totalFindings > findings.length,
    codePoints,
    utf16Length: input.length,
    utf8Bytes: new TextEncoder().encode(input).byteLength,
    lineCount: line,
    isNfc: input.normalize("NFC") === input,
    isNfkc: input.normalize("NFKC") === input,
    visualized,
    previewTruncated,
  };
}
