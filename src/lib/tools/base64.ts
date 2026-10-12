import { ToolError } from "./errors";

export type Base64Direction = "encode" | "decode";
export type Base64Alphabet = "standard" | "url";
export interface Base64Result {
  output: string;
  inputBytes: number;
  outputBytes: number;
}

export const BASE64_LIMITS = {
  inputBytes: 256 * 1024,
  workerThreshold: 8192,
} as const;

function encodedUtf8(input: string): Uint8Array {
  // TextEncoder normally replaces lone UTF-16 surrogates with U+FFFD.
  // Refuse that lossy conversion rather than silently changing user input.
  for (let i = 0; i < input.length; i++) {
    const unit = input.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = input.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new ToolError("BASE64_INVALID_TEXT");
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new ToolError("BASE64_INVALID_TEXT");
    }
  }
  const bytes = new TextEncoder().encode(input);
  if (bytes.length > BASE64_LIMITS.inputBytes) throw new ToolError("INPUT_TOO_LARGE");
  return bytes;
}

function binaryString(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    parts.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
  }
  return parts.join("");
}

export function transformBase64(
  input: string,
  direction: Base64Direction,
  alphabet: Base64Alphabet,
): Base64Result {
  if (direction !== "encode" && direction !== "decode") throw new ToolError("INVALID_REQUEST");
  if (alphabet !== "standard" && alphabet !== "url") throw new ToolError("INVALID_REQUEST");
  if (input.length > BASE64_LIMITS.inputBytes) throw new ToolError("INPUT_TOO_LARGE");

  if (direction === "encode") {
    const bytes = encodedUtf8(input);
    const standard = btoa(binaryString(bytes));
    const output = alphabet === "url"
      ? standard.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
      : standard;
    return { output, inputBytes: bytes.length, outputBytes: output.length };
  }

  const valid = alphabet === "url"
    ? /^[A-Za-z0-9_-]*={0,2}$/
    : /^[A-Za-z0-9+/]*={0,2}$/;
  if (!valid.test(input)) throw new ToolError("BASE64_INVALID_INPUT");
  const bare = input.replace(/=+$/, "");
  const padCount = input.length - bare.length;
  const remainder = bare.length % 4;
  if (
    remainder === 1 ||
    (padCount > 0 && (input.length % 4 !== 0 || padCount !== (4 - remainder) % 4))
  ) {
    throw new ToolError("BASE64_INVALID_INPUT");
  }
  const normalized = alphabet === "url" ? bare.replace(/-/g, "+").replace(/_/g, "/") : bare;
  let binary: string;
  try {
    binary = atob(normalized);
  } catch {
    throw new ToolError("BASE64_INVALID_INPUT");
  }
  // Reject nonzero trailing pad bits; atob alone permits noncanonical aliases.
  if (btoa(binary).replace(/=+$/, "") !== normalized) {
    throw new ToolError("BASE64_INVALID_INPUT");
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  let output: string;
  try {
    // Preserve an initial UTF-8 BOM as U+FEFF so decoding is lossless.
    output = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new ToolError("INVALID_UTF8");
  }
  return { output, inputBytes: input.length, outputBytes: bytes.length };
}
