/** Stable codes let the UI translate errors without exposing input contents. */
export class ToolError extends Error {
  readonly code: string;
  readonly detail: string;

  constructor(code: string, detail = "") {
    super(detail || code);
    this.name = "ToolError";
    this.code = code;
    this.detail = detail;
  }
}

export function assertInputSize(input: string, maxBytes: number): void {
  // The cheap check avoids allocating an encoded copy for obviously large input.
  if (input.length > maxBytes || new TextEncoder().encode(input).byteLength > maxBytes) {
    throw new ToolError("INPUT_TOO_LARGE", String(maxBytes));
  }
}
