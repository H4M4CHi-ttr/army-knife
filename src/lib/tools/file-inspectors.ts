import { ToolError } from "./errors";

export const FILE_INSPECTOR_LIMITS = {
  fileBytes: 8 * 1024 * 1024,
  hexCharacters: 64 * 1024,
  previewCharacters: 200,
} as const;

function checkSize(bytes: Uint8Array) {
  if (bytes.byteLength > FILE_INSPECTOR_LIMITS.fileBytes) throw new ToolError("INPUT_TOO_LARGE");
}
function begins(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return bytes.length >= offset + signature.length &&
    signature.every((value, index) => bytes[offset + index] === value);
}
const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(" ").toUpperCase();

export interface EncodingReport {
  encoding: string;
  bom: string;
  valid: boolean;
  inferred: boolean;
  crlf: number;
  lf: number;
  cr: number;
  preview: string;
  warnings: string[];
}

interface Decoded { encoding: string; bom: string; inferred: boolean; text: string; }

function decodeText(bytes: Uint8Array): Decoded {
  checkSize(bytes);
  let encoding = "utf-8", bom = "None", inferred = false, skip = 0;
  if (begins(bytes, [0xef, 0xbb, 0xbf])) {
    bom = "UTF-8"; skip = 3;
  } else if (begins(bytes, [0xff, 0xfe])) {
    encoding = "utf-16le"; bom = "UTF-16LE"; skip = 2;
  } else if (begins(bytes, [0xfe, 0xff])) {
    encoding = "utf-16be"; bom = "UTF-16BE"; skip = 2;
  } else if (bytes.length >= 8 && bytes.length % 2 === 0) {
    const sample = Math.min(bytes.length, 4096);
    let evenNull = 0, oddNull = 0;
    for (let i = 0; i + 1 < sample; i += 2) {
      if (bytes[i] === 0) evenNull++;
      if (bytes[i + 1] === 0) oddNull++;
    }
    const pairs = Math.floor(sample / 2);
    if (oddNull >= 4 && oddNull / pairs > 0.6 && evenNull / pairs < 0.1) {
      encoding = "utf-16le"; inferred = true;
    } else if (evenNull >= 4 && evenNull / pairs > 0.6 && oddNull / pairs < 0.1) {
      encoding = "utf-16be"; inferred = true;
    }
  }
  const text = new TextDecoder(encoding, { fatal: true }).decode(bytes.subarray(skip));
  return { encoding: encoding.toUpperCase(), bom, inferred, text };
}

/** Strict Unicode decode. Unknown legacy encodings are never guessed/converter silently. */
export function inspectEncoding(bytes: Uint8Array): EncodingReport {
  checkSize(bytes);
  try {
    const { encoding, bom, inferred, text } = decodeText(bytes);
    const crlf = (text.match(/\r\n/g) ?? []).length;
    const remaining = text.replace(/\r\n/g, "");
    return {
      encoding, bom, valid: true, inferred,
      crlf, lf: (remaining.match(/\n/g) ?? []).length,
      cr: (remaining.match(/\r/g) ?? []).length,
      preview: text.slice(0, FILE_INSPECTOR_LIMITS.previewCharacters),
      warnings: inferred ? ["ENCODING_INFERRED"] : [],
    };
  } catch (error) {
    if (error instanceof ToolError) throw error;
    return {
      encoding: "Unknown (possibly legacy or malformed Unicode)",
      bom: begins(bytes, [0xef, 0xbb, 0xbf]) ? "UTF-8" :
        begins(bytes, [0xff, 0xfe]) ? "UTF-16LE" :
        begins(bytes, [0xfe, 0xff]) ? "UTF-16BE" : "None",
      valid: false, inferred: false, crlf: 0, lf: 0, cr: 0, preview: "",
      warnings: ["INVALID_ENCODING"],
    };
  }
}

export function convertEncoding(bytes: Uint8Array, lineEnding: "lf" | "crlf"): Uint8Array {
  if (lineEnding !== "lf" && lineEnding !== "crlf") throw new ToolError("INVALID_REQUEST");
  let decoded: Decoded;
  try { decoded = decodeText(bytes); }
  catch (error) {
    if (error instanceof ToolError) throw error;
    throw new ToolError("INVALID_ENCODING");
  }
  const normalized = decoded.text.replace(/\r\n|\r|\n/g, "\n");
  return new TextEncoder().encode(lineEnding === "crlf" ? normalized.replace(/\n/g, "\r\n") : normalized);
}

export interface SignatureCandidate {
  format: string;
  mime: string;
  extensions: string[];
}
export interface MagicReport {
  size: number;
  headerHex: string;
  trailerHex: string;
  candidates: SignatureCandidate[];
  extension: string;
  declaredMime: string;
  warnings: string[];
}

/** Read-only fixed-signature hints, not a parser, antivirus scanner or authenticity proof. */
export function inspectMagic(bytes: Uint8Array, filename = "", declaredMime = ""): MagicReport {
  checkSize(bytes);
  const candidates: SignatureCandidate[] = [];
  const add = (format: string, mime: string, extensions: string[]) =>
    candidates.push({ format, mime, extensions });
  if (begins(bytes, [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))
    add("PNG", "image/png", ["png"]);
  if (begins(bytes, [0xff,0xd8,0xff])) add("JPEG", "image/jpeg", ["jpg","jpeg","jpe"]);
  if (begins(bytes, [0x47,0x49,0x46,0x38,0x37,0x61]) ||
      begins(bytes, [0x47,0x49,0x46,0x38,0x39,0x61]))
    add("GIF", "image/gif", ["gif"]);
  if (begins(bytes, [0x25,0x50,0x44,0x46,0x2d]))
    add("PDF", "application/pdf", ["pdf"]);
  if (begins(bytes, [0x50,0x4b,0x03,0x04]) ||
      begins(bytes, [0x50,0x4b,0x05,0x06]) ||
      begins(bytes, [0x50,0x4b,0x07,0x08]))
    add("ZIP", "application/zip", ["zip","docx","xlsx","pptx","jar","apk","epub"]);
  if (begins(bytes, [0x1f,0x8b,0x08])) add("GZIP", "application/gzip", ["gz","tgz"]);
  if (begins(bytes, [0x37,0x7a,0xbc,0xaf,0x27,0x1c]))
    add("7-Zip", "application/x-7z-compressed", ["7z"]);
  if (begins(bytes, [0x52,0x61,0x72,0x21,0x1a,0x07]))
    add("RAR", "application/vnd.rar", ["rar"]);
  if (begins(bytes, [0x53,0x51,0x4c,0x69,0x74,0x65,0x20,0x66,0x6f,0x72,0x6d,0x61,0x74,0x20,0x33,0x00]))
    add("SQLite 3", "application/vnd.sqlite3", ["db","sqlite","sqlite3"]);
  if (begins(bytes, [0x7f,0x45,0x4c,0x46])) add("ELF", "application/x-elf", ["elf","so"]);
  if (begins(bytes, [0x4d,0x5a])) add("DOS/PE candidate", "application/x-msdownload", ["exe","dll","sys"]);
  if (begins(bytes, [0x52,0x49,0x46,0x46]) && begins(bytes, [0x57,0x45,0x42,0x50], 8))
    add("WebP", "image/webp", ["webp"]);
  if (begins(bytes, [0x52,0x49,0x46,0x46]) && begins(bytes, [0x57,0x41,0x56,0x45], 8))
    add("WAVE", "audio/wav", ["wav"]);
  const trailer = bytes.subarray(Math.max(0, bytes.length - 128));
  // A ZIP central-directory end marker in another file can indicate a polyglot.
  if (!candidates.some((item) => item.format === "ZIP")) {
    for (let i = 0; i + 4 <= trailer.length; i++) {
      if (begins(trailer, [0x50,0x4b,0x05,0x06], i)) {
        add("ZIP trailer candidate", "application/zip", ["zip"]);
        break;
      }
    }
  }
  const extension = /\.([a-z0-9]+)$/i.exec(filename)?.[1]?.toLowerCase() ?? "";
  // File.type is a user-controlled browser/OS hint, not a signature or trusted source.
  const normalizedMime = declaredMime.toLowerCase().split(";")[0]?.trim() ?? "";
  const warnings: string[] = [];
  if (!candidates.length) warnings.push("UNKNOWN_SIGNATURE");
  if (candidates.length > 1) warnings.push("MULTIPLE_SIGNATURES");
  if (extension && candidates.length &&
      !candidates.some((item) => item.extensions.includes(extension)))
    warnings.push("EXTENSION_MISMATCH");
  const zipContainerMime = /^(?:application\/(?:vnd\.openxmlformats-officedocument\.(?:wordprocessingml|spreadsheetml|presentationml)\.(?:document|sheet|presentation)|vnd\.android\.package-archive|java-archive|epub\+zip|x-zip-compressed))$/;
  const mimeMatches = candidates.some((item) =>
    item.mime === normalizedMime ||
    (item.format === "ZIP" && zipContainerMime.test(normalizedMime)) ||
    (item.format === "DOS/PE candidate" &&
      ["application/vnd.microsoft.portable-executable", "application/x-msdos-program"].includes(normalizedMime)),
  );
  if (normalizedMime && normalizedMime !== "application/octet-stream" &&
      candidates.length && !mimeMatches)
    warnings.push("MIME_MISMATCH");
  return {
    size: bytes.byteLength, extension, declaredMime: normalizedMime,
    headerHex: hex(bytes.subarray(0, 32)),
    trailerHex: hex(trailer.subarray(Math.max(0, trailer.length - 16))),
    candidates, warnings,
  };
}

export function parseHexBytes(input: string): Uint8Array {
  if (input.length > FILE_INSPECTOR_LIMITS.hexCharacters) throw new ToolError("INPUT_TOO_LARGE");
  const clean = input.replace(/\s/g, "");
  if (clean.length % 2 !== 0 || !/^[\da-f]*$/i.test(clean)) throw new ToolError("INVALID_REQUEST");
  const result = new Uint8Array(clean.length / 2);
  for (let i = 0; i < result.length; i++) result[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return result;
}

export type SriAlgorithm = "SHA-256" | "SHA-384" | "SHA-512";
export interface SriReport {
  integrity: string;
  html: string;
  bytes: number;
  algorithm: SriAlgorithm;
}
export async function generateSri(bytes: Uint8Array, algorithm: SriAlgorithm, css = false): Promise<SriReport> {
  checkSize(bytes);
  if (!["SHA-256", "SHA-384", "SHA-512"].includes(algorithm)) throw new ToolError("INVALID_REQUEST");
  const digest = new Uint8Array(await crypto.subtle.digest(algorithm, Uint8Array.from(bytes)));
  const base64 = btoa(String.fromCharCode(...digest));
  const integrity = algorithm.toLowerCase().replace("-", "") + "-" + base64;
  const html = css
    ? '<link rel="stylesheet" href="/assets/style.css" integrity="' + integrity + '" crossorigin="anonymous">'
    : '<script src="/assets/app.js" integrity="' + integrity + '" crossorigin="anonymous"></script>';
  return { integrity, html, bytes: bytes.byteLength, algorithm };
}
