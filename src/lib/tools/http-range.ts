import { assertInputSize, ToolError } from "./errors.ts";

export const HTTP_RANGE_LIMITS = { bytes: 8192, members: 32, digits: 40, deferredCharacters: 2048 } as const;
export const HTTP_RANGE_SAMPLE = { input: "Range: bytes=0-99, 900-, -50, 2000-", length: "1000" } as const;
export interface HttpRangeMember {
  source: string;
  kind: "closed" | "open" | "suffix";
  status: "resolved" | "unsatisfiable" | "empty";
  first: string | null;
  last: string | null;
  bytes: string;
  contentRange: string | null;
}
export interface HttpRangeReport {
  length: string;
  satisfiable: boolean;
  members: HttpRangeMember[];
  memberBytes: string;
  coveredBytes: string;
  overlaps: boolean;
}
const trimOWS = (text: string) => text.replace(/^[ \t]+|[ \t]+$/g, "");
function fail(code = "HTTP_RANGE_SYNTAX"): never { throw new ToolError(code); }

/** Bounded request arithmetic only. No request, response status or server policy is inferred. */
export function inspectHttpRanges(input: string, length: string): HttpRangeReport {
  assertInputSize(input, HTTP_RANGE_LIMITS.bytes);
  // Bound before trimming to avoid scanning an unbounded second argument.
  if (length.length > HTTP_RANGE_LIMITS.digits + 16) fail("HTTP_RANGE_LENGTH");
  const sizeText = trimOWS(length);
  if (!/^[0-9]{1,40}$/.test(sizeText)) fail("HTTP_RANGE_LENGTH");
  const size = BigInt(sizeText);
  // Do not let trim/\s hide folded fields, non-ASCII whitespace or controls.
  if (/[^\x20-\x7e\t]/.test(input)) fail();
  let field = trimOWS(input);
  if (/^range:/i.test(field)) field = trimOWS(field.slice(6));
  if (!/^bytes=/i.test(field)) fail();
  const parts = field.slice(6).split(",");
  if (parts.length > HTTP_RANGE_LIMITS.members) fail("HTTP_RANGE_LIMIT");
  const intervals: { first: bigint; last: bigint }[] = [];
  let sum = 0n;
  const members = parts.map((part): HttpRangeMember => {
    const source = trimOWS(part);
    const match = /^([0-9]*)-([0-9]*)$/.exec(source);
    if (!match || !(match[1] || match[2])) fail();
    const a = match[1]!;
    const b = match[2]!;
    if (a.length > HTTP_RANGE_LIMITS.digits || b.length > HTTP_RANGE_LIMITS.digits) fail("HTTP_RANGE_LIMIT");
    const kind = !a ? "suffix" : b ? "closed" : "open";
    const start = a ? BigInt(a) : null;
    const end = b ? BigInt(b) : null;
    if (start !== null && end !== null && end < start) fail();
    const member: HttpRangeMember = { source, kind, status: "unsatisfiable", first: null, last: null, bytes: "0", contentRange: null };
    if (start !== null ? start >= size : end === 0n) return member;
    // RFC 9110 explicitly makes a positive suffix satisfiable even at size zero.
    if (size === 0n) { member.status = "empty"; return member; }
    const first = start ?? (end! < size ? size - end! : 0n);
    const last = start === null || end === null || end >= size ? size - 1n : end;
    const bytes = last - first + 1n;
    intervals.push({ first, last });
    sum += bytes;
    return { ...member, status: "resolved", first: String(first), last: String(last), bytes: String(bytes), contentRange: `bytes ${first}-${last}/${size}` };
  });
  intervals.sort((a, b) => a.first < b.first ? -1 : a.first > b.first ? 1 : 0);
  let covered = 0n;
  let current: { first: bigint; last: bigint } | undefined;
  for (const interval of intervals) {
    if (!current) current = { ...interval };
    else if (interval.first <= current.last + 1n) {
      if (interval.last > current.last) current.last = interval.last;
    } else {
      covered += current.last - current.first + 1n;
      current = { ...interval };
    }
  }
  if (current) covered += current.last - current.first + 1n;
  return {
    length: String(size), members, satisfiable: members.some(m => m.status !== "unsatisfiable"),
    memberBytes: String(sum), coveredBytes: String(covered), overlaps: sum > covered,
  };
}
