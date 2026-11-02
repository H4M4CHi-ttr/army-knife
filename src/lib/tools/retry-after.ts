import { assertInputSize, ToolError } from "./errors.ts";

export const RETRY_AFTER_LIMITS = { bytes: 8192, referenceBytes: 64, digits: 40, deferredCharacters: 2048 } as const;
export interface RetryAfterReport {
  kind: "delay" | "date";
  value: string;
  referenceUtc: string;
  targetUtc: string | null;
  declaredDelaySeconds: string | null;
  waitMilliseconds: string;
  minimumWholeSeconds: string;
  past: boolean;
}
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const trimOWS = (value: string) => value.replace(/^[ \t]+|[ \t]+$/g, "");
function fail(code = "RETRY_AFTER_SYNTAX"): never { throw new ToolError(code); }

/** Strict bounded UTC calendar construction; Date.parse's repair rules are not used. */
function utc(year: number, month: number, day: number, hour: number, minute: number, second: number, ms: number, code: string): Date {
  if (year < 1 || year > 9999 || month < 0 || month > 11 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) fail(code);
  const date = new Date(0);
  // Date.UTC interprets 00–99 as 1900–1999; setUTCFullYear preserves the given year.
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, minute, second, ms);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) fail(code);
  return date;
}

/** Recorded sender-format inspection only; does not request or schedule a retry. */
export function inspectRetryAfter(input: string, reference: string): RetryAfterReport {
  assertInputSize(input, RETRY_AFTER_LIMITS.bytes);
  if (reference.length > RETRY_AFTER_LIMITS.referenceBytes) fail("RETRY_AFTER_REFERENCE");
  const ref = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(reference);
  if (!ref) fail("RETRY_AFTER_REFERENCE");
  const received = utc(Number(ref[1]), Number(ref[2]) - 1, Number(ref[3]), Number(ref[4]), Number(ref[5]), Number(ref[6]), Number((ref[7] ?? "").padEnd(3, "0")), "RETRY_AFTER_REFERENCE");
  const receivedMs = BigInt(received.getTime());
  if (/[^\x20-\x7e\t]/.test(input)) fail();
  let value = trimOWS(input);
  if (/^retry-after:/i.test(value)) value = trimOWS(value.slice(12));
  let kind: RetryAfterReport["kind"], declaredDelaySeconds: string | null = null;
  let targetMs: bigint;
  if (/^[0-9]+$/.test(value)) {
    if (value.length > RETRY_AFTER_LIMITS.digits) fail("RETRY_AFTER_DIGITS");
    kind = "delay";
    value = BigInt(value).toString();
    declaredDelaySeconds = value;
    targetMs = receivedMs + BigInt(value) * 1000n;
  } else {
    // These HTTP recipient forms are outside this sender-format inspector.
    if (/^[A-Za-z]+, \d{2}-[A-Za-z]{3}-\d{2} /.test(value) || /^[A-Za-z]{3} [A-Za-z]{3} [ \d]\d /.test(value)) fail("RETRY_AFTER_DATE_UNSUPPORTED");
    const date = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT$/.exec(value);
    if (!date) fail();
    if (date[7] === "60") fail("RETRY_AFTER_DATE_UNSUPPORTED");
    const parsed = utc(Number(date[4]), months.indexOf(date[3]!), Number(date[2]), Number(date[5]), Number(date[6]), Number(date[7]), 0, "RETRY_AFTER_SYNTAX");
    if (weekdays[parsed.getUTCDay()] !== date[1]) fail();
    kind = "date";
    targetMs = BigInt(parsed.getTime());
  }
  const remaining = targetMs > receivedMs ? targetMs - receivedMs : 0n;
  // Restrict output to four-digit years. Preserve duration even beyond this range.
  const targetUtc = targetMs >= -62135596800000n && targetMs <= 253402300799999n
    ? new Date(Number(targetMs)).toISOString() : null;
  return {
    kind, value, referenceUtc: received.toISOString(), targetUtc, declaredDelaySeconds,
    waitMilliseconds: remaining.toString(), minimumWholeSeconds: ((remaining + 999n) / 1000n).toString(),
    past: targetMs < receivedMs,
  };
}
