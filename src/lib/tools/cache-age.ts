import { recordedInstant } from "./backlog-dates.ts";
import { assertInputSize, ToolError } from "./errors.ts";

export const CACHE_AGE_LIMITS = { headerBytes: 512, timeBytes: 24, ageDigits: 40 } as const;

export interface CacheAgeInput {
  headers: string;
  request: string;
  response: string;
  evaluation: string;
}

function readHeaders(input: string) {
  assertInputSize(input, CACHE_AGE_LIMITS.headerBytes);
  const fields = new Map<string, string>();
  const lines = input.replace(/\r?\n$/, "").split(/\r?\n/);
  for (const line of input ? lines : []) {
    const match = /^(date|age):([\t\x20-\x7e]*)$/i.exec(line);
    if (match?.[0] !== line) throw new ToolError("CACHE_AGE_FIELDS");
    const name = match[1]!.toLowerCase();
    if (fields.has(name)) throw new ToolError("CACHE_AGE_DUPLICATE");
    fields.set(name, match[2]!.trim());
  }
  return fields;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function readDate(value: string | undefined): bigint {
  if (value === undefined) throw new ToolError("CACHE_AGE_DATE_MISSING");
  const parts = /^[A-Z][a-z]{2}, (\d{2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2}:\d{2}:\d{2}) GMT$/.exec(value);
  if (!parts || Number(parts[3]) < 1900) throw new ToolError("CACHE_AGE_DATE");
  const month = String(months.indexOf(parts[2]!) + 1).padStart(2, "0");
  const timestamp = recordedInstant(`${parts[3]}-${month}-${parts[1]}T${parts[4]}Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toUTCString() !== value) {
    throw new ToolError("CACHE_AGE_DATE");
  }
  return BigInt(timestamp);
}

function readAge(value: string | undefined): bigint | null {
  if (value === undefined) return null;
  if (!/^[0-9]+$/.test(value)) throw new ToolError("CACHE_AGE_VALUE");
  if (value.length > CACHE_AGE_LIMITS.ageDigits) throw new ToolError("CACHE_AGE_DIGITS");
  return BigInt(value);
}

function readTime(value: string): bigint {
  if (!value) throw new ToolError("CACHE_AGE_TIME_MISSING");
  const time = value.length <= CACHE_AGE_LIMITS.timeBytes && value.endsWith("Z") ? recordedInstant(value) : NaN;
  if (!Number.isFinite(time)) throw new ToolError("CACHE_AGE_TIME");
  return BigInt(time);
}

function decimalSeconds(milliseconds: bigint): string {
  return `${milliseconds / 1000n}.${String(milliseconds % 1000n).padStart(3, "0")}`;
}

export function calculateCacheAge(input: CacheAgeInput) {
  const fields = readHeaders(input.headers);
  const date = readDate(fields.get("date"));
  const age = readAge(fields.get("age"));
  const request = readTime(input.request);
  const response = readTime(input.response);
  const evaluation = readTime(input.evaluation);
  if (request > response || response > evaluation) throw new ToolError("CACHE_AGE_TIME_ORDER");

  const dateDifference = response - date;
  const apparentAge = dateDifference < 0n ? 0n : dateDifference;
  const responseDelay = response - request;
  const correctedAgeValue = (age ?? 0n) * 1000n + responseDelay;
  const correctedInitialAge = apparentAge > correctedAgeValue ? apparentAge : correctedAgeValue;
  const residentTime = evaluation - response;
  return {
    ageHeaderSeconds: age?.toString() ?? null,
    apparentAge: decimalSeconds(apparentAge),
    responseDelay: decimalSeconds(responseDelay),
    correctedAgeValue: decimalSeconds(correctedAgeValue),
    correctedInitialAge: decimalSeconds(correctedInitialAge),
    residentTime: decimalSeconds(residentTime),
    currentAge: decimalSeconds(correctedInitialAge + residentTime),
    initialAgeSource: apparentAge === correctedAgeValue ? "tie" : apparentAge > correctedAgeValue ? "apparent" : "corrected",
    futureDate: dateDifference < 0n,
  };
}
