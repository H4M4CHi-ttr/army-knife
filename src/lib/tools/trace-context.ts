import { assertInputSize, ToolError } from "./errors.ts";

export const TRACE_CONTEXT_LIMITS = { parentBytes: 128, stateBytes: 512, members: 32 } as const;
export interface TraceContextReport {
  traceparent: string;
  version: "00";
  traceId: string;
  parentId: string;
  flags: string;
  sampled: boolean;
  otherFlags: string;
  entries: { position: number; key: string; value: string }[];
  emptyMembers: number;
}
const ows = (value: string) => value.replace(/^[ \t]+|[ \t]+$/g, "");
const fail = (code: string): never => { throw new ToolError(code); };

/** Recorded Level 1 values only. No telemetry, propagation or vendor decoding. */
export function inspectTraceContext(parent: string, state = ""): TraceContextReport {
  assertInputSize(parent, TRACE_CONTEXT_LIMITS.parentBytes);
  assertInputSize(state, TRACE_CONTEXT_LIMITS.stateBytes);
  const traceparent = ows(parent);
  const prefix = /^([0-9a-f]{2})-/.exec(traceparent)?.[1];
  if (!prefix || prefix === "ff") fail("TRACE_PARENT_SYNTAX");
  if (prefix !== "00") fail("TRACE_CONTEXT_VERSION");
  const parts = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/.exec(traceparent);
  if (!parts || /^0+$/.test(parts[1]!) || /^0+$/.test(parts[2]!)) fail("TRACE_PARENT_SYNTAX");

  const entries: TraceContextReport["entries"] = [];
  const seen = new Set<string>();
  let emptyMembers = 0;
  const members = state === "" ? [] : state.split(",");
  if (members.length > TRACE_CONTEXT_LIMITS.members) fail("TRACE_STATE_MEMBERS");
  for (const raw of members) {
    const member = ows(raw);
    if (!member) { emptyMembers++; continue; }
    const separator = member.indexOf("=");
    if (separator < 1) fail("TRACE_STATE_SYNTAX");
    const key = member.slice(0, separator), value = member.slice(separator + 1);
    const validKey = /^[a-z][a-z0-9_*/-]{0,255}$/.test(key) || /^[a-z0-9][a-z0-9_*/-]{0,240}@[a-z][a-z0-9_*/-]{0,13}$/.test(key);
    if (!validKey || seen.has(key) || !/^[\x20-\x2b\x2d-\x3c\x3e-\x7e]{0,255}[\x21-\x2b\x2d-\x3c\x3e-\x7e]$/.test(value)) fail("TRACE_STATE_SYNTAX");
    seen.add(key);
    entries.push({ position: entries.length + 1, key, value });
  }
  const flags = parts![3]!;
  const bits = Number.parseInt(flags, 16);
  return {
    traceparent, version: "00", traceId: parts![1]!, parentId: parts![2]!, flags,
    sampled: Boolean(bits & 1), otherFlags: (bits & 254).toString(16).padStart(2, "0"),
    entries, emptyMembers,
  };
}
