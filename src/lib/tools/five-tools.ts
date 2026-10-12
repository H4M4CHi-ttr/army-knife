import { ToolError, assertInputSize } from "./errors";

export type DateInputKind = "iso" | "seconds" | "milliseconds";
export interface TimestampInfo {
  utc: string;
  unixSeconds: string;
  unixMilliseconds: string;
  zoned: string;
}

function invalid(): never {
  throw new ToolError("INVALID_REQUEST");
}

function exactEpochSeconds(milliseconds: number): string {
  const value = BigInt(milliseconds);
  const negative = value < 0n;
  const positive = negative ? -value : value;
  const integral = positive / 1000n;
  const remainder = positive % 1000n;
  const fraction = remainder === 0n ? "" : "." + remainder.toString().padStart(3, "0").replace(/0+$/, "");
  return (negative ? "-" : "") + integral.toString() + fraction;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parseIso(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) invalid();
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month) ||
      hour > 23 || minute > 59 || second > 59) invalid();
  const milliseconds = Number((match[7] ?? "").padEnd(3, "0"));
  let offset = 0;
  if (match[8] !== "Z") {
    const offsetHour = Number(match[8].slice(1, 3));
    const offsetMinute = Number(match[8].slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) invalid();
    offset = (offsetHour * 60 + offsetMinute) * (match[8][0] === "+" ? 1 : -1);
  }
  // setUTCFullYear handles years 0000–0099 without Date.UTC's 1900 offset.
  const timestamp = new Date(0);
  timestamp.setUTCFullYear(year, month - 1, day);
  timestamp.setUTCHours(hour, minute, second, milliseconds);
  return timestamp.getTime() - offset * 60_000;
}

function parseEpoch(value: string, seconds: boolean): number {
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(value) ||
      (!seconds && value.includes("."))) invalid();
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  const magnitude = BigInt(whole) * (seconds ? 1000n : 1n) +
    (seconds ? BigInt(fraction.padEnd(3, "0") || "0") : 0n);
  const signed = negative ? -magnitude : magnitude;
  if (signed < -8640000000000000n || signed > 8640000000000000n) invalid();
  return Number(signed);
}

export function inspectTimestamp(input: string, kind: DateInputKind, zone: string): TimestampInfo {
  assertInputSize(input, 256);
  if (zone.length > 80) invalid();
  const value = input.trim();
  if (!value || !zone.trim()) invalid();
  const ms = kind === "iso" ? parseIso(value)
    : kind === "seconds" ? parseEpoch(value, true)
    : kind === "milliseconds" ? parseEpoch(value, false) : invalid();
  const date = new Date(ms);
  if (!Number.isFinite(ms) || Number.isNaN(date.getTime())) invalid();
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone.trim(), year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23", timeZoneName: "short",
    }).formatToParts(date);
  } catch { invalid(); }
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zoned = fields.year + "-" + fields.month + "-" + fields.day + " " +
    fields.hour + ":" + fields.minute + ":" + fields.second + " " + (fields.timeZoneName ?? zone);
  return {
    utc: date.toISOString(),
    unixSeconds: exactEpochSeconds(ms),
    unixMilliseconds: String(ms),
    zoned,
  };
}

export interface JwtInspection {
  header: string;
  payload: string;
  signaturePresent: boolean;
  algorithm: string;
  expired: boolean;
  notYetValid: boolean;
  claimsTimes: { name: string; utc: string }[];
}

function decodeBase64Url(value: string, binaryOnly = false): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) invalid();
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  let decoded: string;
  try {
    decoded = atob(normalized);
    if (btoa(decoded).replace(/=+$/, "") !== normalized) invalid();
    return binaryOnly ? "" : new TextDecoder("utf-8", { fatal: true })
      .decode(Uint8Array.from(decoded, (character) => character.charCodeAt(0)));
  } catch { invalid(); }
}

function jsonObject(input: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(input);
    if (value && typeof value === "object" && !Array.isArray(value))
      return value as Record<string, unknown>;
  } catch { /* handled below */ }
  return invalid();
}

export function inspectJwt(input: string, nowSeconds = Date.now() / 1000): JwtInspection {
  assertInputSize(input, 64 * 1024);
  const segments = input.trim().split(".");
  if (segments.length !== 3 || !segments[0] || !segments[1] ||
      (segments[2] && !/^[A-Za-z0-9_-]+$/.test(segments[2]))) invalid();
  if (segments[2]) decodeBase64Url(segments[2], true); // Signatures are binary, not UTF-8.
  const header = jsonObject(decodeBase64Url(segments[0]));
  const payload = jsonObject(decodeBase64Url(segments[1]));
  const times: JwtInspection["claimsTimes"] = [];
  for (const name of ["iat", "nbf", "exp"]) {
    const value = payload[name];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const timestamp = new Date(value * 1000);
    if (!Number.isNaN(timestamp.getTime())) times.push({ name, utc: timestamp.toISOString() });
  }
  return {
    header: JSON.stringify(header, null, 2),
    payload: JSON.stringify(payload, null, 2),
    signaturePresent: segments[2].length > 0,
    algorithm: typeof header.alg === "string" ? header.alg : "(missing)",
    expired: typeof payload.exp === "number" && Number.isFinite(payload.exp) && payload.exp <= nowSeconds,
    notYetValid: typeof payload.nbf === "number" && Number.isFinite(payload.nbf) && payload.nbf > nowSeconds,
    claimsTimes: times,
  };
}

export type IdFormat = "v4" | "v7" | "ulid";
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const HEX = "0123456789abcdef";

function randomBytes(length: number): Uint8Array {
  const value = new Uint8Array(length);
  globalThis.crypto.getRandomValues(value);
  return value;
}

function uuidString(bytes: Uint8Array): string {
  const raw = Array.from(bytes, (byte) => HEX[byte >> 4] + HEX[byte & 15]).join("");
  return raw.slice(0, 8) + "-" + raw.slice(8, 12) + "-" + raw.slice(12, 16) +
    "-" + raw.slice(16, 20) + "-" + raw.slice(20);
}

export function generateIdentifier(format: IdFormat, now = Date.now()): string {
  if (!Number.isSafeInteger(now) || now < 0 || now > 281474976710655) invalid();
  if (format === "ulid") {
    let randomness = 0n;
    for (const byte of randomBytes(10)) randomness = (randomness << 8n) | BigInt(byte);
    let value = (BigInt(now) << 80n) | randomness;
    let result = "";
    for (let i = 0; i < 26; i++) {
      result = CROCKFORD[Number(value & 31n)] + result;
      value >>= 5n;
    }
    return result;
  }
  if (format !== "v4" && format !== "v7") invalid();
  const bytes = randomBytes(16);
  if (format === "v7") {
    let time = BigInt(now);
    for (let index = 5; index >= 0; index--) {
      bytes[index] = Number(time & 255n);
      time >>= 8n;
    }
    bytes[6] = (bytes[6] & 15) | 0x70;
  } else {
    bytes[6] = (bytes[6] & 15) | 0x40;
  }
  bytes[8] = (bytes[8] & 63) | 0x80;
  return uuidString(bytes);
}

export function generateIdentifiers(format: IdFormat, count: number): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 100) invalid();
  return Array.from({ length: count }, () => generateIdentifier(format));
}

export interface IdentifierInspection {
  format: string;
  normalized: string;
  utc: string | null;
}

export function inspectIdentifier(input: string): IdentifierInspection {
  assertInputSize(input, 128);
  const value = input.trim();
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(value)) {
    let timestamp = 0n;
    const upper = value.toUpperCase();
    for (const ch of upper.slice(0, 10))
      timestamp = timestamp * 32n + BigInt(CROCKFORD.indexOf(ch));
    if (timestamp > 281474976710655n) invalid();
    return { format: "ULID", normalized: upper, utc: new Date(Number(timestamp)).toISOString() };
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-([47])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(value);
  if (!uuid) invalid();
  const normalized = value.toLowerCase();
  return {
    format: "UUID v" + uuid[1],
    normalized,
    utc: uuid[1] === "7"
      ? new Date(Number(BigInt("0x" + normalized.replaceAll("-", "").slice(0, 12)))).toISOString()
      : null,
  };
}

export interface SecretOptions {
  length: number;
  count: number;
  mode: "password" | "hex";
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  exclude: string;
}
export interface SecretGeneration {
  values: string[];
  alphabetSize: number;
  estimatedBits: number;
}

export function generateSecrets(options: SecretOptions): SecretGeneration {
  const { length, count, mode, exclude } = options;
  if (!Number.isInteger(length) || length < 8 || length > 128 ||
      !Number.isInteger(count) || count < 1 || count > 20 ||
      exclude.length > 128) invalid();
  if (mode === "hex") {
    if (length % 2 !== 0) invalid();
    const values = Array.from({ length: count }, () =>
      Array.from(randomBytes(length / 2), (byte) => HEX[byte >> 4] + HEX[byte & 15]).join(""));
    return { values, alphabetSize: 16, estimatedBits: length * 4 };
  }
  if (mode !== "password") invalid();
  const excluded = new Set(Array.from(exclude));
  const groups = [
    options.lower && "abcdefghijklmnopqrstuvwxyz",
    options.upper && "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    options.digits && "0123456789",
    options.symbols && "!@#$%^&*()-_=+[]{}:;,.?",
  ].filter((group): group is string => typeof group === "string")
    .map((group) => Array.from(group).filter((character) => !excluded.has(character)));
  if (!groups.length || groups.some((group) => !group.length) || length < groups.length) invalid();
  const alphabet = [...new Set(groups.flat())];
  const numbers = new Uint32Array(256);
  let at = numbers.length;
  function draw(choices: number): number {
    const limit = Math.floor(0x100000000 / choices) * choices;
    let value: number;
    do {
      if (at === numbers.length) { globalThis.crypto.getRandomValues(numbers); at = 0; }
      value = numbers[at++];
    } while (value >= limit);
    return value % choices;
  }
  const values: string[] = [];
  for (let item = 0; item < count; item++) {
    const chars = groups.map((group) => group[draw(group.length)]);
    while (chars.length < length) chars.push(alphabet[draw(alphabet.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = draw(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    values.push(chars.join(""));
  }
  return { values, alphabetSize: alphabet.length, estimatedBits: Math.round(length * Math.log2(alphabet.length)) };
}

export interface OgFields {
  title: string;
  description: string;
  url: string;
  image: string;
  locale: string;
  type: "website" | "article";
}

function safeUrl(raw: string): string {
  if (!raw || raw.length > 2048 || /[\u0000-\u001f\u007f]/.test(raw)) invalid();
  try {
    const value = new URL(raw);
    if (!["https:", "http:"].includes(value.protocol) || !value.hostname ||
        value.username || value.password) invalid();
    return value.href;
  } catch { invalid(); }
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/[&<>"'\u0060\r\n]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
      "'": "&#39;", "\u0060": "&#96;", "\r": "&#13;", "\n": "&#10;",
    };
    return entities[character];
  });
}

export function generateOgTags(fields: OgFields): { html: string; host: string } {
  const { title, description, image, locale, type } = fields;
  assertInputSize(title + description + fields.url + image + locale, 8 * 1024);
  if (!title.trim() || title.length > 200 || description.length > 1000 ||
      !["article", "website"].includes(type) ||
      (locale && !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(locale))) invalid();
  const url = safeUrl(fields.url);
  const imageUrl = image.trim() ? safeUrl(image.trim()) : "";
  const tags: [string, string, string][] = [
    ["property", "og:type", type],
    ["property", "og:title", title],
    ["property", "og:url", url],
    ["name", "twitter:card", imageUrl ? "summary_large_image" : "summary"],
    ["name", "twitter:title", title],
  ];
  if (description) {
    tags.push(["property", "og:description", description], ["name", "twitter:description", description]);
  }
  if (locale) tags.push(["property", "og:locale", locale]);
  if (imageUrl) tags.push(["property", "og:image", imageUrl], ["name", "twitter:image", imageUrl]);
  return {
    html: tags.map(([key, name, content]) =>
      "<meta " + key + '="' + escapeHtmlAttribute(name) + '" content="' +
      escapeHtmlAttribute(content) + '">').join("\n"),
    host: new URL(url).host,
  };
}
