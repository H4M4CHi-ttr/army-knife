import { formatAddress, parseCidr } from "./cidr";
import { assertInputSize, ToolError } from "./errors";

export const CIDR_AGGREGATE_LIMITS = {
  inputBytes: 8192, entries: 128, entryCharacters: 64, prefixes: 128,
  outputBytes: 131072, textBytes: 8192, deferredCharacters: 2048,
} as const;
export interface AggregatedPrefix {
  cidr: string;
  prefix: number;
  first: string;
  last: string;
  addressCount: string;
}
export interface CidrAggregateReport {
  version: 4 | 6;
  inputCount: number;
  prefixes: AggregatedPrefix[];
  addressCount: string;
}
/** Identifies a bad list position without exposing its recorded address. */
export class CidrAggregateEntryError extends ToolError {
  readonly position: number;
  constructor(code: string, position: number) {
    super(code);
    this.name = "CidrAggregateEntryError";
    this.position = position;
  }
}

/** Exact address-set union, never a routing or access-policy decision. */
export function aggregateCidrs(input: string): CidrAggregateReport {
  assertInputSize(input, CIDR_AGGREGATE_LIMITS.inputBytes);
  let values: unknown;
  try { values = JSON.parse(input); }
  catch { throw new ToolError("CIDR_AGGREGATE_JSON"); }
  if (!Array.isArray(values) || values.some(v => typeof v !== "string")) throw new ToolError("CIDR_AGGREGATE_SHAPE");
  if (values.length < 1 || values.length > CIDR_AGGREGATE_LIMITS.entries) throw new ToolError("CIDR_AGGREGATE_COUNT");
  let version: 4 | 6 | undefined;
  const intervals = (values as string[]).map((value, index) => {
    const position = index + 1;
    if (!value || value.length > CIDR_AGGREGATE_LIMITS.entryCharacters ||
        Array.from(value).some(c => c.charCodeAt(0) < 0x21 || c.charCodeAt(0) > 0x7e)) {
      throw new CidrAggregateEntryError("CIDR_AGGREGATE_CIDR", position);
    }
    let parsed: ReturnType<typeof parseCidr>;
    try { parsed = parseCidr(value); }
    catch { throw new CidrAggregateEntryError("CIDR_AGGREGATE_CIDR", position); }
    const count = 1n << BigInt((parsed.version === 4 ? 32 : 128) - parsed.prefix);
    if ((parsed.value & (count - 1n)) !== 0n) throw new CidrAggregateEntryError("CIDR_AGGREGATE_HOST_BITS", position);
    if (version !== undefined && parsed.version !== version) throw new CidrAggregateEntryError("CIDR_AGGREGATE_MIXED", position);
    version = parsed.version;
    return { start: parsed.value, end: parsed.value + count - 1n };
  }).sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : a.end > b.end ? -1 : a.end < b.end ? 1 : 0);

  const union: { start: bigint; end: bigint }[] = [];
  for (const interval of intervals) {
    const previous = union.at(-1);
    if (!previous || interval.start > previous.end + 1n) union.push({ ...interval });
    else if (interval.end > previous.end) previous.end = interval.end;
  }
  // A nonempty validated list sets the family above; widths never exceed 128.
  const family = version!, bits = family === 4 ? 32 : 128;
  const prefixes: AggregatedPrefix[] = [];
  let total = 0n;
  for (const interval of union) {
    let first = interval.start;
    while (first <= interval.end) {
      const remaining = interval.end - first + 1n;
      const alignment = first === 0n ? bits : (first & -first).toString(2).length - 1;
      const hostBits = Math.min(alignment, remaining.toString(2).length - 1);
      const count = 1n << BigInt(hostBits), prefix = bits - hostBits;
      const address = formatAddress(first, family);
      prefixes.push({ cidr: address + "/" + prefix, prefix, first: address,
        last: formatAddress(first + count - 1n, family), addressCount: count.toString() });
      if (prefixes.length > CIDR_AGGREGATE_LIMITS.prefixes) throw new ToolError("CIDR_AGGREGATE_OUTPUT_LIMIT");
      total += count;
      first += count;
    }
  }
  const report = { version: family, inputCount: values.length, prefixes, addressCount: total.toString() };
  const encoder = new TextEncoder();
  if (encoder.encode(JSON.stringify(report, null, 2)).length > CIDR_AGGREGATE_LIMITS.outputBytes ||
      encoder.encode(prefixes.map(p => p.cidr).join("\n") + "\n").length > CIDR_AGGREGATE_LIMITS.textBytes) {
    throw new ToolError("CIDR_AGGREGATE_OUTPUT_LIMIT");
  }
  return report;
}
