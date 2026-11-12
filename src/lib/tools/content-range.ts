import { assertInputSize, ToolError } from "./errors";

export const CONTENT_RANGE_LIMITS = { inputBytes: 256, digits: 40 } as const;
export interface ContentRangeReport {
  unit: "bytes";
  kind: "range" | "unsatisfied";
  canonical: string;
  first: string | null;
  last: string | null;
  rangeBytes: string | null;
  completeLength: string | null;
  bytesBefore: string | null;
  bytesAfter: string | null;
  coversWholeRepresentation: boolean | null;
}
const trimOWS = (text: string) => text.replace(/^[ \t]+|[ \t]+$/g, "");
function integer(text: string): bigint {
  if (text.length > CONTENT_RANGE_LIMITS.digits) throw new ToolError("CONTENT_RANGE_DIGITS");
  return BigInt(text);
}

/** Recorded field syntax and representation-byte arithmetic, never transfer validation. */
export function inspectContentRange(input: string): ContentRangeReport {
  assertInputSize(input, CONTENT_RANGE_LIMITS.inputBytes);
  if (/[^\x20-\x7e\t]/.test(input)) throw new ToolError("CONTENT_RANGE_SYNTAX");
  let value = trimOWS(input);
  if (/^content-range:/i.test(value)) value = trimOWS(value.slice(14));
  const unsatisfied = /^bytes \*\/([0-9]+)$/i.exec(value);
  if (unsatisfied) {
    const length = String(integer(unsatisfied[1]!));
    return {
      unit: "bytes", kind: "unsatisfied", canonical: "bytes */" + length,
      first: null, last: null, rangeBytes: null, completeLength: length,
      bytesBefore: null, bytesAfter: null, coversWholeRepresentation: null,
    };
  }
  const range = /^bytes ([0-9]+)-([0-9]+)\/([0-9]+|\*)$/i.exec(value);
  if (!range) throw new ToolError("CONTENT_RANGE_SYNTAX");
  const first = integer(range[1]!), last = integer(range[2]!);
  const length = range[3] === "*" ? null : integer(range[3]!);
  if (last < first || (length !== null && length <= last)) throw new ToolError("CONTENT_RANGE_BOUNDS");
  return {
    unit: "bytes", kind: "range", canonical: "bytes " + first + "-" + last + "/" + (length ?? "*"),
    first: String(first), last: String(last), rangeBytes: String(last - first + 1n),
    completeLength: length === null ? null : String(length), bytesBefore: String(first),
    bytesAfter: length === null ? null : String(length - last - 1n),
    coversWholeRepresentation: length === null ? null : first === 0n && last + 1n === length,
  };
}
