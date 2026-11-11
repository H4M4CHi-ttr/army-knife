import { assertInputSize, ToolError } from "./errors";

export const DNS_TXT_LIMITS = {
  textBytes: 8192, rdataBytes: 65536, segments: 64, segmentBytes: 255, deferredCharacters: 2048,
} as const;

export interface DnsTxtReport {
  text: string;
  dataBytes: number;
  /** RDATA only: data octets plus one length octet per character-string. */
  wireBytes: number;
  segments: { index: number; bytes: number; literal: string }[];
  rdata: string;
}

function literal(bytes: Uint8Array): string {
  let value = '"';
  for (const byte of bytes) {
    if (byte === 34 || byte === 92) value += "\\" + String.fromCharCode(byte);
    else if (byte >= 32 && byte <= 126) value += String.fromCharCode(byte);
    else value += "\\" + String(byte).padStart(3, "0");
  }
  return value + '"';
}

function report(text: string, chunks: Uint8Array[]): DnsTxtReport {
  const segments = chunks.map((bytes, index) => ({ index: index + 1, bytes: bytes.length, literal: literal(bytes) }));
  const dataBytes = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  return {
    text, dataBytes, wireBytes: dataBytes + chunks.length, segments,
    rdata: segments.length === 1 ? segments[0]!.literal : "(\n" + segments.map(s => "  " + s.literal).join("\n") + "\n)",
  };
}

/** UTF-8 text only; TXT itself also permits binary data outside this codec. */
export function splitDnsTxt(text: string): DnsTxtReport {
  assertInputSize(text, DNS_TXT_LIMITS.textBytes);
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new ToolError("DNS_TXT_UNICODE");
    } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new ToolError("DNS_TXT_UNICODE");
  }
  const bytes = new TextEncoder().encode(text);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += DNS_TXT_LIMITS.segmentBytes) chunks.push(bytes.slice(i, i + DNS_TXT_LIMITS.segmentBytes));
  return report(text, chunks.length ? chunks : [new Uint8Array()]);
}

const whitespace = (value: string | undefined) => value === " " || value === "\t" || value === "\r" || value === "\n";
const digit = (value: number) => value >= 48 && value <= 57;
function syntax(): never { throw new ToolError("DNS_TXT_SYNTAX"); }

/** One quoted TXT RDATA, optionally grouped; deliberately not a zone parser. */
export function restoreDnsTxt(input: string): DnsTxtReport {
  assertInputSize(input, DNS_TXT_LIMITS.rdataBytes);
  let start = 0, end = input.length;
  while (whitespace(input[start])) start++;
  while (end > start && whitespace(input[end - 1])) end--;
  const grouped = input[start] === "(";
  if (grouped) {
    if (input[end - 1] !== ")") syntax();
    start++; end--;
  }
  let i = start, total = 0;
  const chunks: Uint8Array[] = [];
  while (i < end && whitespace(input[i])) i++;
  while (i < end) {
    if (input[i++] !== '"') syntax();
    if (chunks.length >= DNS_TXT_LIMITS.segments) throw new ToolError("DNS_TXT_COUNT_LIMIT");
    const bytes: number[] = [];
    let closed = false;
    while (i < end) {
      let byte = input.charCodeAt(i++);
      if (byte === 34) { closed = true; break; }
      if (byte === 92) {
        byte = input.charCodeAt(i++);
        if (digit(byte)) {
          const second = input.charCodeAt(i++), third = input.charCodeAt(i++);
          if (!digit(second) || !digit(third)) syntax();
          byte = (byte - 48) * 100 + (second - 48) * 10 + third - 48;
          if (byte > 255) syntax();
        } else if (!(byte >= 32 && byte <= 126)) syntax();
      } else if (!(byte >= 32 && byte <= 126)) syntax();
      bytes.push(byte);
      if (bytes.length > DNS_TXT_LIMITS.segmentBytes) throw new ToolError("DNS_TXT_SEGMENT_LIMIT");
      if (++total > DNS_TXT_LIMITS.textBytes) throw new ToolError("DNS_TXT_DATA_LIMIT");
    }
    if (!closed) syntax();
    chunks.push(Uint8Array.from(bytes));
    const separator = i;
    let lineBreak = false;
    while (i < end && whitespace(input[i])) {
      if (input[i] === "\r" || input[i] === "\n") lineBreak = true;
      i++;
    }
    if (i < end && (i === separator || (lineBreak && !grouped))) syntax();
  }
  if (!chunks.length) syntax();
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length; }
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(joined); }
  catch { throw new ToolError("DNS_TXT_UTF8"); }
  return report(text, chunks);
}
