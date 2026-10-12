import { ENGINE_LIMITS, type EngineRequest } from "./types";

/** Called only in the local Worker before loading WASM. */
export function findUtf8InputError(
  request: EngineRequest,
): "INPUT_TOO_LARGE" | "REGEX_TOO_LARGE" | null {
  const values =
    request.operation === "sets"
      ? [request.left, request.right]
      : request.operation === "logs"
        ? [request.text, request.pattern]
        : [request.text];
  const encoder = new TextEncoder();
  let total = 0;
  let regexBytes = 0;
  for (let index = 0; index < values.length; index += 1) {
    const bytes = encoder.encode(values[index] ?? "").byteLength;
    total += bytes;
    if (total > ENGINE_LIMITS.inputBytes) return "INPUT_TOO_LARGE";
    if (request.operation === "logs" && index === 1) regexBytes = bytes;
  }
  return regexBytes > ENGINE_LIMITS.regexBytes ? "REGEX_TOO_LARGE" : null;
}
