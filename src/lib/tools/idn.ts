import { assertInputSize, ToolError } from "./errors.ts";

export const IDN_LIMITS = { bytes: 2048, labelBytes: 63, domainBytes: 253, labels: 127, deferredCharacters: 128 } as const;
export const IDN_SAMPLE = "bücher。example";
export type IdnScript = "Latin" | "Greek" | "Cyrillic" | "Han" | "Hiragana" | "Katakana" | "Hangul" | "Arabic" | "Hebrew" | "Devanagari" | "Common" | "Inherited" | "Other";
export type IdnWarning = "mixed" | "lookalike" | "other";
export interface IdnCodePoint { character: string; point: string; script: IdnScript }
export interface IdnLabel {
  ascii: string;
  unicode: string;
  scripts: IdnScript[];
  warnings: IdnWarning[];
  codePoints: IdnCodePoint[];
}
export interface IdnReport { input: string; ascii: string; unicode: string; absolute: boolean; changed: boolean; labels: IdnLabel[] }

function fail(code = "IDN_SYNTAX"): never { throw new ToolError(code); }

// RFC 3492 section 6.2, bounded by a 63-byte A-label. BigInt also handles
// malicious digit sequences without floating-point overflow or wraparound.
function decodePunycode(payload: string): string {
  const delimiter = payload.lastIndexOf("-");
  const points = delimiter < 0 ? [] : Array.from(payload.slice(0, delimiter), c => c.codePointAt(0)!);
  let position = delimiter < 0 ? 0 : delimiter + 1;
  let n = 128n;
  let i = 0n;
  let bias = 72n;
  while (position < payload.length) {
    const old = i;
    let weight = 1n;
    for (let k = 36n; ; k += 36n) {
      if (position >= payload.length) fail();
      const char = payload.charCodeAt(position++);
      const digit = char >= 97 && char <= 122 ? BigInt(char - 97) : char >= 48 && char <= 57 ? BigInt(char - 22) : fail();
      i += digit * weight;
      const threshold = k <= bias ? 1n : k >= bias + 26n ? 26n : k - bias;
      if (digit < threshold) break;
      weight *= 36n - threshold;
    }
    const count = BigInt(points.length + 1);
    let delta = (i - old) / (old === 0n ? 700n : 2n);
    delta += delta / count;
    let k = 0n;
    while (delta > 455n) { delta /= 35n; k += 36n; }
    bias = k + 36n * delta / (delta + 38n);
    n += i / count;
    if (n > 0x10ffffn || (n >= 0xd800n && n <= 0xdfffn)) fail();
    i %= count;
    points.splice(Number(i), 0, Number(n));
    i++;
  }
  return String.fromCodePoint(...points);
}

const scriptPatterns: readonly [IdnScript, RegExp][] = [
  ["Latin", /\p{Script=Latin}/u], ["Greek", /\p{Script=Greek}/u],
  ["Cyrillic", /\p{Script=Cyrillic}/u], ["Han", /\p{Script=Han}/u],
  ["Hiragana", /\p{Script=Hiragana}/u], ["Katakana", /\p{Script=Katakana}/u],
  ["Hangul", /\p{Script=Hangul}/u], ["Arabic", /\p{Script=Arabic}/u],
  ["Hebrew", /\p{Script=Hebrew}/u], ["Devanagari", /\p{Script=Devanagari}/u],
  ["Common", /\p{Script=Common}/u], ["Inherited", /\p{Script=Inherited}/u],
];
function scriptOf(character: string): IdnScript {
  return scriptPatterns.find(([, pattern]) => pattern.test(character))?.[0] ?? "Other";
}
function mapHost(input: string): string {
  // Constructing a URL only parses a string. It does not navigate or fetch.
  try { return new URL(`https://${input}/`).hostname; }
  catch { return fail(); }
}

export function inspectIdn(input: string): IdnReport {
  assertInputSize(input, IDN_LIMITS.bytes);
  if (!input || Array.from(input).some(character => {
    const point = character.codePointAt(0)!;
    return point <= 0x20 || (point >= 0x7f && point <= 0x9f) ||
      (point >= 0xd800 && point <= 0xdfff) || /\s/u.test(character) || "/:\\?#@%[]".includes(character);
  })) fail();
  const separated = input.replace(/[\u3002\uff0e\uff61]/g, ".");
  const ascii = mapHost(separated);
  const absolute = ascii.endsWith(".");
  const domain = absolute ? ascii.slice(0, -1) : ascii;
  if (/^[0-9.]+$/.test(domain) || ascii.includes(":")) fail("IDN_IP");
  const rawLabels = domain.split(".");
  if (domain.length > IDN_LIMITS.domainBytes || rawLabels.length > IDN_LIMITS.labels || rawLabels.some(l => l.length > IDN_LIMITS.labelBytes)) fail("IDN_LIMIT");
  const labels = rawLabels.map((ascii): IdnLabel => {
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(ascii)) fail();
    const encoded = ascii.startsWith("xn--");
    const unicode = encoded ? decodePunycode(ascii.slice(4)) : ascii;
    // Reject fake ACE forms, invalid Unicode mappings and noncanonical encodings.
    if (encoded && mapHost(unicode) !== ascii) fail();
    const codePoints = Array.from(unicode, (character): IdnCodePoint => ({
      character, point: `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`, script: scriptOf(character),
    }));
    const scripts = [...new Set(codePoints.map(p => p.script).filter(s => s !== "Common" && s !== "Inherited"))];
    const known = scripts.filter(s => s !== "Other");
    const japanese = known.every(s => s === "Han" || s === "Hiragana" || s === "Katakana");
    const warnings: IdnWarning[] = [];
    if (known.length > 1 && !japanese) warnings.push("mixed");
    if (scripts.includes("Greek") || scripts.includes("Cyrillic")) warnings.push("lookalike");
    if (scripts.includes("Other")) warnings.push("other");
    return { ascii, unicode, codePoints, scripts, warnings };
  });
  const unicode = labels.map(l => l.unicode).join(".") + (absolute ? "." : "");
  return { input, ascii, unicode, absolute, changed: input !== unicode, labels };
}
