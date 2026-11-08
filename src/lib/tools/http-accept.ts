import { assertInputSize, ToolError } from "./errors.ts";

export const ACCEPT_LIMITS = { bytes: 8192, ranges: 32, offers: 32, slots: 64, parameters: 16, parameterSlots: 32, deferredCharacters: 2048 } as const;
export interface MediaEntry {
  index: number;
  source: string;
  type: string;
  subtype: string;
  parameters: { name: string; value: string }[];
}
export interface AcceptRange extends MediaEntry { quality: number }
export interface AcceptOffer extends MediaEntry {
  quality: number;
  governingRanges: number[];
  reason: "absent" | "unmatched" | "excluded" | "matched";
}
export interface AcceptReport {
  acceptAbsent: boolean;
  ranges: AcceptRange[];
  offers: AcceptOffer[];
  rankedOfferIndexes: number[];
  selectedOfferIndex: number | null;
  emptyAcceptSlots: number;
  emptyOfferLines: number;
}
const token = /[!#$%&'*+.^_`|~0-9A-Za-z-]/;
const fail = (code = "ACCEPT_SYNTAX"): never => { throw new ToolError(code); };
const trim = (value: string) => value.replace(/^[ \t]+|[ \t]+$/g, "");

/** ASCII token/quoted-string scanner; delimiters inside quotes are data. */
function split(input: string, delimiter: string, maximum: number): string[] {
  const parts: string[] = [];
  let start = 0, quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;
    if (char === "\\" && quoted) { if (++i === input.length) fail(); }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) {
      parts.push(input.slice(start, i)); start = i + 1;
      if (parts.length >= maximum) fail("ACCEPT_LIMIT");
    }
  }
  if (quoted) fail();
  parts.push(input.slice(start));
  return parts;
}
function ascii(input: string) {
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code !== 9 && (code < 32 || code > 126)) fail();
  }
}
function entry(source: string, index: number, range: boolean): AcceptRange {
  const parts = split(source, ";", ACCEPT_LIMITS.parameterSlots);
  const media = /^([!#$%&'*+.^_`|~0-9A-Za-z-]+)\/([!#$%&'*+.^_`|~0-9A-Za-z-]+)$/.exec(trim(parts.shift()!));
  if (!media) fail();
  const type = media![1]!.toLowerCase(), subtype = media![2]!.toLowerCase();
  if ((type.includes("*") && type !== "*") || (subtype.includes("*") && subtype !== "*")) fail("ACCEPT_WILDCARD");
  if ((!range && (type === "*" || subtype === "*")) || (type === "*" && subtype !== "*")) fail("ACCEPT_WILDCARD");
  const parameters: MediaEntry["parameters"] = [], seen = new Set<string>();
  let quality = 1000;
  for (const raw of parts) {
    const field = trim(raw);
    if (!field) continue;
    if (seen.size === ACCEPT_LIMITS.parameters) fail("ACCEPT_LIMIT");
    let cursor = 0;
    while (cursor < field.length && token.test(field[cursor]!)) cursor++;
    if (!cursor || field[cursor++] !== "=") fail();
    const name = field.slice(0, cursor - 1).toLowerCase();
    if (seen.has(name)) fail("ACCEPT_DUPLICATE");
    seen.add(name);
    const encoded = field.slice(cursor), quoted = encoded[0] === '"';
    let value = "";
    if (quoted) {
      cursor++;
      let closed = false;
      while (cursor < field.length) {
        const char = field[cursor++]!;
        if (char === '"') { closed = true; break; }
        if (char === "\\") { if (cursor === field.length) fail(); value += field[cursor++]!; }
        else value += char;
      }
      if (!closed || cursor !== field.length) fail();
    } else {
      if (!encoded || ![...encoded].every(char => token.test(char))) fail();
      value = encoded;
    }
    if (name === "q") {
      if (!range || quoted || !/^(?:0(?:\.[0-9]{0,3})?|1(?:\.0{0,3})?)$/.test(value)) fail("ACCEPT_QUALITY");
      const [whole, fraction = ""] = value.split(".");
      quality = Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
    } else parameters.push({ name, value });
  }
  return { index, source, type, subtype, parameters, quality };
}
const normalizedValue = (name: string, value: string) => name === "charset" ? value.toLowerCase() : value;
function matches(range: AcceptRange, offer: MediaEntry) {
  return (range.type === "*" || range.type === offer.type) &&
    (range.subtype === "*" || range.subtype === offer.subtype) &&
    range.parameters.every(param => offer.parameters.some(candidate => candidate.name === param.name &&
      normalizedValue(param.name, param.value) === normalizedValue(candidate.name, candidate.value)));
}
const specificity = (range: AcceptRange) => range.type === "*" ? 0 : range.subtype === "*" ? 1 : 2;

/** Bounded literal-parameter preview, never an HTTP request or server emulator. */
export function previewHttpAccept(accept: string, offered: string, acceptAbsent = false): AcceptReport {
  // An absent field ignores its disabled text; the active offered input is always checked.
  if (!acceptAbsent) { assertInputSize(accept, ACCEPT_LIMITS.bytes); ascii(accept); }
  assertInputSize(offered, ACCEPT_LIMITS.bytes);
  if (/\r(?!\n)/.test(offered)) fail();
  const lines = offered.replace(/\r\n/g, "\n").split("\n");
  if (lines.length > ACCEPT_LIMITS.slots) fail("ACCEPT_LIMIT");
  const offers: MediaEntry[] = [];
  let emptyOfferLines = 0;
  for (const line of lines) {
    ascii(line);
    const source = trim(line);
    if (!source) { emptyOfferLines++; continue; }
    if (offers.length === ACCEPT_LIMITS.offers) fail("ACCEPT_LIMIT");
    const { quality: _quality, ...parsed } = entry(source, offers.length + 1, false);
    offers.push(parsed);
  }
  if (!offers.length) fail("ACCEPT_OFFERS");
  const ranges: AcceptRange[] = [];
  let emptyAcceptSlots = 0;
  if (!acceptAbsent) for (const slot of split(accept, ",", ACCEPT_LIMITS.slots)) {
    const source = trim(slot);
    if (!source) { emptyAcceptSlots++; continue; }
    if (ranges.length === ACCEPT_LIMITS.ranges) fail("ACCEPT_LIMIT");
    ranges.push(entry(source, ranges.length + 1, true));
  }
  const evaluated: AcceptOffer[] = offers.map(offer => {
    if (acceptAbsent) return { ...offer, quality: 1000, governingRanges: [], reason: "absent" };
    const matched = ranges.filter(range => matches(range, offer));
    if (!matched.length) return { ...offer, quality: 0, governingRanges: [], reason: "unmatched" };
    const bestType = Math.max(...matched.map(specificity));
    const sameType = matched.filter(range => specificity(range) === bestType);
    const bestParams = Math.max(...sameType.map(range => range.parameters.length));
    const governing = sameType.filter(range => range.parameters.length === bestParams);
    const quality = governing[0]!.quality;
    if (governing.some(range => range.quality !== quality)) fail("ACCEPT_AMBIGUOUS");
    return { ...offer, quality, governingRanges: governing.map(range => range.index), reason: quality ? "matched" : "excluded" };
  });
  const rankedOfferIndexes = evaluated.filter(offer => offer.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index).map(offer => offer.index);
  return { acceptAbsent, ranges, offers: evaluated, rankedOfferIndexes,
    selectedOfferIndex: rankedOfferIndexes[0] ?? null, emptyAcceptSlots, emptyOfferLines };
}
export function formatAcceptQuality(quality: number): string {
  return quality === 1000 ? "1" : quality === 0 ? "0" : `0.${String(quality).padStart(3, "0").replace(/0+$/, "")}`;
}
