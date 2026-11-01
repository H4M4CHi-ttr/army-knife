import { ToolError } from "./errors.ts";

export type EtagMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
export const ETAG_METHODS: readonly EtagMethod[] = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];
export const ETAG_LIMITS = { bytes: 8192, tags: 64, emptyMembers: 64, tagBytes: 512, deferredCharacters: 2048 } as const;
export interface EtagInput {
  current: string;
  exists: boolean;
  method: EtagMethod;
  ifMatch: string | null;
  ifNoneMatch: string | null;
}
export interface EntityTag { raw: string; opaque: string; weak: boolean }
export type EtagConditionState = "absent" | "passed" | "failed" | "unassessed" | "skipped";
export interface EtagCondition {
  kind: "absent" | "wildcard" | "list";
  comparison: "strong" | "weak";
  state: EtagConditionState;
  match: boolean | null;
  ignoredEmptyMembers: number;
  tags: (EntityTag & { matches: boolean | null })[];
}
export interface EtagReport {
  scope: "entity-tag-preconditions";
  method: EtagMethod;
  exists: boolean;
  current: EntityTag | null;
  currentIgnored: boolean;
  decision: "proceed" | "not-modified" | "precondition-failed" | "unassessed";
  basis: "none" | "ifMatch" | "ifNoneMatch";
  usualStatus: 304 | 412 | null;
  complete: boolean;
  alreadyAppliedException: boolean;
  ifMatch: EtagCondition;
  ifNoneMatch: EtagCondition;
}

const encoder = new TextEncoder();
const trimOWS = (text: string) => text.replace(/^[ \t]+|[ \t]+$/g, "");
function fail(code = "ETAG_SYNTAX"): never { throw new ToolError(code); }
function skipOWS(text: string, start: number) {
  let index = start;
  while (text[index] === " " || text[index] === "\t") index++;
  return index;
}

function readTag(text: string, start: number): { tag: EntityTag; end: number } {
  const weak = text.startsWith("W/", start);
  let index = start + (weak ? 2 : 0);
  if (text[index] !== '"') fail();
  const opaqueStart = ++index;
  while (index < text.length && text[index] !== '"') {
    const byte = text.charCodeAt(index);
    if (!(byte === 0x21 || (byte >= 0x23 && byte <= 0x7e) || (byte >= 0x80 && byte <= 0xff))) fail();
    index++;
  }
  if (index === text.length) fail();
  const opaque = text.slice(opaqueStart, index);
  const raw = text.slice(start, ++index);
  if (encoder.encode(raw).byteLength > ETAG_LIMITS.tagBytes) fail("ETAG_LIMIT");
  return { tag: { raw, opaque, weak }, end: index };
}

function parseCurrent(value: string): EntityTag | null {
  const text = trimOWS(value);
  if (!text) return null;
  const parsed = readTag(text, 0);
  if (parsed.end !== text.length) fail();
  return parsed.tag;
}

function parseCondition(value: string | null, comparison: "strong" | "weak"): EtagCondition {
  const report: EtagCondition = { kind: value === null ? "absent" : "list", comparison, state: value === null ? "absent" : "skipped", match: null, ignoredEmptyMembers: 0, tags: [] };
  if (value === null) return report;
  const text = trimOWS(value);
  if (text === "*") return { ...report, kind: "wildcard" };
  if (!text) return report;
  let index = 0;
  const empty = () => { if (++report.ignoredEmptyMembers > ETAG_LIMITS.emptyMembers) fail("ETAG_LIMIT"); };
  while (true) {
    index = skipOWS(text, index);
    // Reaching the end here means a trailing empty element. A wholly empty
    // field was handled above and is the valid zero-element #entity-tag list.
    if (index === text.length) { empty(); break; }
    if (text[index] === ",") { empty(); index++; continue; }
    const parsed = readTag(text, index);
    report.tags.push({ ...parsed.tag, matches: null });
    if (report.tags.length > ETAG_LIMITS.tags) fail("ETAG_LIMIT");
    index = skipOWS(text, parsed.end);
    if (index === text.length) break;
    if (text[index] !== ",") fail();
    index++;
  }
  return report;
}

function evaluate(condition: EtagCondition, current: EntityTag | null, exists: boolean, inverted: boolean) {
  if (condition.kind === "absent") return;
  if (condition.kind === "wildcard") condition.match = exists;
  else {
    for (const tag of condition.tags) {
      if (!exists || (condition.comparison === "strong" && (tag.weak || current?.weak))) tag.matches = false;
      else tag.matches = current ? tag.opaque === current.opaque : null;
    }
    condition.match = condition.tags.some(tag => tag.matches === true) ? true
      : condition.tags.some(tag => tag.matches === null) ? null : false;
  }
  condition.state = condition.match === null ? "unassessed"
    : condition.match !== inverted ? "passed" : "failed";
}

/** A bounded, origin-server entity-tag model; never contacts or predicts a server. */
export function inspectEtags(input: EtagInput): EtagReport {
  if (!ETAG_METHODS.includes(input.method)) fail("ETAG_METHOD");
  const active = [input.exists ? input.current : "", input.ifMatch ?? "", input.ifNoneMatch ?? ""];
  if (active.reduce((sum, text) => sum + text.length, 0) > ETAG_LIMITS.bytes
    || active.reduce((sum, text) => sum + encoder.encode(text).byteLength, 0) > ETAG_LIMITS.bytes) {
    throw new ToolError("INPUT_TOO_LARGE", String(ETAG_LIMITS.bytes));
  }
  // Parse every active field before producing any comparison or partial output.
  const current = input.exists ? parseCurrent(input.current) : null;
  const ifMatch = parseCondition(input.ifMatch, "strong");
  const ifNoneMatch = parseCondition(input.ifNoneMatch, "weak");
  const report: EtagReport = {
    scope: "entity-tag-preconditions", method: input.method, exists: input.exists, current,
    currentIgnored: !input.exists && input.current.length > 0,
    decision: "proceed", basis: "none", usualStatus: null, complete: true,
    alreadyAppliedException: false, ifMatch, ifNoneMatch,
  };
  if (ifMatch.kind !== "absent") {
    report.basis = "ifMatch";
    evaluate(ifMatch, current, input.exists, false);
    if (ifMatch.state === "failed") {
      report.decision = "precondition-failed";
      report.usualStatus = 412;
      report.alreadyAppliedException = input.method !== "GET" && input.method !== "HEAD";
      return report;
    }
    if (ifMatch.state === "unassessed") return { ...report, decision: "unassessed", complete: false };
  }
  if (ifNoneMatch.kind !== "absent") {
    report.basis = "ifNoneMatch";
    evaluate(ifNoneMatch, current, input.exists, true);
    if (ifNoneMatch.state === "failed") {
      const readMethod = input.method === "GET" || input.method === "HEAD";
      report.decision = readMethod ? "not-modified" : "precondition-failed";
      report.usualStatus = readMethod ? 304 : 412;
    } else if (ifNoneMatch.state === "unassessed") return { ...report, decision: "unassessed", complete: false };
  }
  return report;
}
