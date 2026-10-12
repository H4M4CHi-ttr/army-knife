import { assertInputSize, ToolError } from "./errors";

export type QuickToolId =
  | "data-units"
  | "css-units"
  | "radix"
  | "unicode-normalize"
  | "slug"
  | "unicode-escape";
export type UnicodeForm = "NFC" | "NFD" | "NFKC" | "NFKD";
export type EscapeNotation = "uplus" | "js-utf16" | "js-codepoint";
export interface QuickRow {
  label: string;
  value: string;
}
export interface QuickResult {
  output: string;
  rows: QuickRow[];
  notice?: "rounded" | "compatibility" | "unpaired" | "ascii" | "partial";
}
export const QUICK_LIMITS = {
  inputBytes: 16 * 1024,
  radixBytes: 4 * 1024,
  maxSlugLines: 100,
  previewPoints: 32,
  shownPoints: 64,
} as const;

export const RADIX_BASES = [2, 8, 10, 16, 36] as const;
export type RadixBase = (typeof RADIX_BASES)[number];

/** Exact signed integer conversion; prefixes, grouping, whitespace and fractions are intentionally unsupported. */
export function convertRadixInteger(text: string, from: number): QuickResult {
  assertInputSize(text, QUICK_LIMITS.radixBytes);
  if (!RADIX_BASES.includes(from as RadixBase)) throw new ToolError("QUICK_INVALID_UNIT");
  const sign = text[0] === "-" || text[0] === "+" ? text[0] : "";
  const digits = sign ? text.slice(1) : text;
  if (!digits || !/^[0-9A-Za-z]+$/.test(digits))
    throw new ToolError("QUICK_INVALID_RADIX_INTEGER");

  const radix = BigInt(from);
  let value = 0n;
  for (const character of digits) {
    const code = character.charCodeAt(0);
    const digit = code >= 48 && code <= 57 ? code - 48 :
      code >= 65 && code <= 90 ? code - 55 : code - 87;
    if (digit >= from) throw new ToolError("QUICK_INVALID_RADIX_INTEGER");
    value = value * radix + BigInt(digit);
  }
  if (sign === "-") value = -value;
  const rows = RADIX_BASES.map((base) => ({
    label: String(base),
    value: value.toString(base).toUpperCase(),
  }));
  return { output: rows.map((row) => `${row.label}: ${row.value}`).join("\n"), rows };
}

interface Unit {
  symbol: string;
  bits: bigint;
}
export const SIZE_UNITS: readonly Unit[] = [
  { symbol: "b", bits: 1n },
  { symbol: "B", bits: 8n },
  { symbol: "kb", bits: 1_000n },
  { symbol: "kB", bits: 8_000n },
  { symbol: "Mb", bits: 1_000_000n },
  { symbol: "MB", bits: 8_000_000n },
  { symbol: "Gb", bits: 1_000_000_000n },
  { symbol: "GB", bits: 8_000_000_000n },
  { symbol: "Kib", bits: 1_024n },
  { symbol: "KiB", bits: 8_192n },
  { symbol: "Mib", bits: 1_048_576n },
  { symbol: "MiB", bits: 8_388_608n },
  { symbol: "Gib", bits: 1_073_741_824n },
  { symbol: "GiB", bits: 8_589_934_592n },
];

export function rateSymbol(sizeSymbol: string): string {
  return sizeSymbol.endsWith("B") ? sizeSymbol + "/s" : sizeSymbol + "ps";
}

function decimalFraction(text: string): { numerator: bigint; denominator: bigint } {
  const cleaned = text.trim();
  if (cleaned.length > 96 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned))
    throw new ToolError("QUICK_INVALID_NUMBER");
  const negative = cleaned.startsWith("-");
  const positive = cleaned.replace(/^[+-]/, "");
  const parts = positive.split(".");
  if ((parts[1]?.length ?? 0) > 24) throw new ToolError("QUICK_INVALID_NUMBER");
  const numerator = BigInt((parts[0] || "0") + (parts[1] ?? ""));
  return {
    numerator: negative ? -numerator : numerator,
    denominator: 10n ** BigInt(parts[1]?.length ?? 0),
  };
}

function formatFraction(n: bigint, d: bigint): { value: string; rounded: boolean } {
  const negative = n < 0n;
  let number = negative ? -n : n;
  const whole = number / d;
  let remainder = number % d;
  const digits: string[] = [];
  while (remainder !== 0n && digits.length < 24) {
    remainder *= 10n;
    digits.push(String(remainder / d));
    remainder %= d;
  }
  while (digits.at(-1) === "0") digits.pop();
  const grouping = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const value = (negative && number !== 0n ? "-" : "") + grouping +
    (digits.length ? "." + digits.join("") : "");
  return { value: (remainder ? "≈ " : "") + value, rounded: remainder !== 0n };
}

/** Exact integer/rational arithmetic; non-terminating results show ≈ after 24 decimals. */
export function convertDataUnits(value: string, unit: string, rate = false): QuickResult {
  const { numerator, denominator } = decimalFraction(value);
  const source = SIZE_UNITS.find((item) =>
    rate ? rateSymbol(item.symbol) === unit : item.symbol === unit,
  );
  if (!source) throw new ToolError("QUICK_INVALID_UNIT");
  let rounded = false;
  const rows = SIZE_UNITS.map((target) => {
    const converted = formatFraction(numerator * source.bits, denominator * target.bits);
    rounded ||= converted.rounded;
    return { label: rate ? rateSymbol(target.symbol) : target.symbol, value: converted.value };
  });
  return {
    output: rows.map((row) => row.label + " = " + row.value).join("\n"),
    rows,
    notice: rounded ? "rounded" : undefined,
  };
}

export type CssUnit = "px" | "rem" | "em" | "vw" | "vh";
export interface CssContext {
  root: string;
  element: string;
  width: string;
  height: string;
}
export const CSS_UNITS: readonly CssUnit[] = ["px", "rem", "em", "vw", "vh"];

function cssNumber(value: string, allowZero: boolean): number {
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed) || trimmed.length > 32)
    throw new ToolError("QUICK_INVALID_CSS");
  const result = Number(trimmed);
  if (!Number.isFinite(result) || Math.abs(result) > 1_000_000 ||
      (!allowZero && result <= 0))
    throw new ToolError("QUICK_INVALID_CSS");
  return result;
}

export function convertCssUnits(
  value: string,
  from: CssUnit,
  context: CssContext,
): QuickResult {
  if (!CSS_UNITS.includes(from)) throw new ToolError("QUICK_INVALID_UNIT");
  const n = cssNumber(value, true);
  const root = cssNumber(context.root, false);
  const element = cssNumber(context.element, false);
  const width = cssNumber(context.width, false);
  const height = cssNumber(context.height, false);
  const bases: Record<CssUnit, number> = {
    px: 1,
    rem: root,
    em: element,
    vw: width / 100,
    vh: height / 100,
  };
  const px = n * bases[from];
  let rounded = false;
  const rows = CSS_UNITS.map((unit) => {
    const exact = px / bases[unit];
    if (!Number.isFinite(exact) || Math.abs(exact) >= 1e15)
      throw new ToolError("QUICK_INVALID_CSS");
    const displayed = Number(exact.toFixed(6));
    const approximate = Math.abs(exact - displayed) > 1e-10;
    rounded ||= approximate;
    return { label: unit, value: (approximate ? "≈ " : "") + String(displayed) };
  });
  return {
    output: rows.map((row) => row.label + " = " + row.value).join("\n"),
    rows,
    notice: rounded ? "rounded" : undefined,
  };
}

function scalars(text: string): number[] {
  const points: number[] = [];
  for (const char of text) {
    const value = char.codePointAt(0)!;
    if (value >= 0xd800 && value <= 0xdfff) throw new ToolError("QUICK_INVALID_SCALAR");
    points.push(value);
  }
  return points;
}

function pointName(value: number): string {
  return "U+" + value.toString(16).toUpperCase().padStart(4, "0");
}
function pointPreview(text: string): string {
  const points = [...text].slice(0, QUICK_LIMITS.previewPoints)
    .map((part) => pointName(part.codePointAt(0)!));
  return points.join(" ") + ([...text].length > QUICK_LIMITS.previewPoints ? " …" : "");
}

/** Normalize without changing the source. Original and four code-point sequences are visible. */
export function normalizeUnicode(text: string, chosen: UnicodeForm = "NFC"): QuickResult {
  assertInputSize(text, QUICK_LIMITS.inputBytes);
  const forms: UnicodeForm[] = ["NFC", "NFD", "NFKC", "NFKD"];
  if (!forms.includes(chosen)) throw new ToolError("QUICK_INVALID_UNIT");
  const unpaired = [...text].some((char) => {
    const cp = char.codePointAt(0)!;
    return cp >= 0xd800 && cp <= 0xdfff;
  });
  const rows: QuickRow[] = [
    { label: "Original", value: pointPreview(text) },
    ...forms.map((form) => {
      const transformed = text.normalize(form);
      return {
        label: form + (text === transformed ? " (=)" : " (≠)"),
        value: pointPreview(transformed),
      };
    }),
  ];
  return {
    output: text.normalize(chosen),
    rows,
    notice: unpaired ? "unpaired" :
      (chosen.startsWith("NFK") && text !== text.normalize(chosen) ? "compatibility" : undefined),
  };
}

export type SlugMode = "ascii" | "unicode";
export type SlugSeparator = "-" | "_";

/** Each non-empty line is a slug; collisions receive a deterministic numeric suffix. */
export function createSlugs(
  text: string,
  mode: SlugMode = "unicode",
  separator: SlugSeparator = "-",
): QuickResult {
  assertInputSize(text, QUICK_LIMITS.inputBytes);
  if (!["ascii", "unicode"].includes(mode) || !["-", "_"].includes(separator))
    throw new ToolError("QUICK_INVALID_UNIT");
  const lines = text.split(/\r\n|\r|\n/).filter((part) => part.trim().length);
  if (lines.length > QUICK_LIMITS.maxSlugLines) throw new ToolError("QUICK_TOO_MANY_LINES");
  const seen = new Set<string>();
  const rows = lines.map((line, index) => {
    const lowered = line.normalize("NFKD").toLowerCase();
    const basis = mode === "ascii" ? lowered.replace(/\p{M}/gu, "") : lowered;
    const tokens = (mode === "ascii" ? basis.split(/[^a-z0-9]+/g) :
      basis.split(/[^\p{L}\p{N}\p{M}]+/gu)).filter(Boolean);
    const base = tokens.join(separator);
    if (!base) throw new ToolError("QUICK_EMPTY_SLUG");
    let result = base;
    let ordinal = 2;
    while (seen.has(result)) result = base + separator + ordinal++;
    seen.add(result);
    return { label: String(index + 1), value: result };
  });
  return {
    output: rows.map((row) => row.value).join("\n"),
    rows,
    notice: mode === "ascii" ? "ascii" : undefined,
  };
}

export function convertUnicodeEscape(
  text: string,
  notation: EscapeNotation = "uplus",
  direction: "encode" | "decode" = "encode",
): QuickResult {
  assertInputSize(text, QUICK_LIMITS.inputBytes);
  if (!["uplus", "js-utf16", "js-codepoint"].includes(notation) ||
      !["encode", "decode"].includes(direction))
    throw new ToolError("QUICK_INVALID_UNIT");
  let output: string;
  if (direction === "encode") {
    const points = scalars(text);
    if (notation === "uplus") output = points.map(pointName).join(" ");
    else if (notation === "js-codepoint") {
      output = points.map((cp) => "\\u{" + cp.toString(16).toUpperCase() + "}").join("");
    } else {
      output = Array.from(text).map((char) =>
        [...Array(char.length)].map((_, i) =>
          "\\u" + char.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0"),
        ).join(""),
      ).join("");
    }
  } else if (notation === "uplus") {
    const tokens = text.trim().split(/\s+/).filter(Boolean);
    if (!tokens.every((token) => /^U\+[0-9A-Fa-f]{1,6}$/.test(token)))
      throw new ToolError("QUICK_INVALID_ESCAPE");
    output = tokens.map((token) => {
      const cp = Number.parseInt(token.slice(2), 16);
      if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff))
        throw new ToolError("QUICK_INVALID_SCALAR");
      return String.fromCodePoint(cp);
    }).join("");
  } else if (notation === "js-codepoint") {
    const compact = text.replace(/\s+/g, "");
    if (compact && !/^(?:\\u\{[0-9A-Fa-f]{1,6}\})+$/.test(compact))
      throw new ToolError("QUICK_INVALID_ESCAPE");
    output = compact.replace(/\\u\{([0-9A-Fa-f]{1,6})\}/g, (_, hex: string) => {
      const cp = Number.parseInt(hex, 16);
      if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff))
        throw new ToolError("QUICK_INVALID_SCALAR");
      return String.fromCodePoint(cp);
    });
  } else {
    const compact = text.replace(/\s+/g, "");
    if (compact && !/^(?:\\u[0-9A-Fa-f]{4})+$/.test(compact))
      throw new ToolError("QUICK_INVALID_ESCAPE");
    const values = [...compact.matchAll(/\\u([0-9A-Fa-f]{4})/g)]
      .map((match) => Number.parseInt(match[1]!, 16));
    output = String.fromCharCode(...values);
    scalars(output);
  }
  const points = scalars(direction === "encode" ? text : output);
  const rows = points.slice(0, QUICK_LIMITS.shownPoints).map((cp, index) => ({
    label: String(index + 1) + " · " + pointName(cp),
    value: String.fromCodePoint(cp),
  }));
  return {
    output,
    rows,
    notice: points.length > QUICK_LIMITS.shownPoints ? "partial" : undefined,
  };
}
