import { assertInputSize, ToolError } from "./errors.ts";

export const PG_LSN_LIMITS = { inputBytes: 64 } as const;
export const PG_WAL_SEGMENT_MIB = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024] as const;

export interface PgLsnPosition {
  lsn: string;
  bytePosition: string;
  /** Mathematical zero-based segment, not pg_walfile_name boundary semantics. */
  segmentNumber: string;
  segmentOffsetBytes: string;
  zero: boolean;
}
export interface PgLsnReport {
  first: PgLsnPosition;
  second: PgLsnPosition;
  segmentMiB: number;
  segmentBytes: string;
  deltaBytes: string;
  distanceBytes: string;
  direction: "forward" | "backward" | "equal";
  distanceMiB: { whole: string; remainderBytes: string };
}

const MIB = 1048576n;
function parsePosition(input: string): bigint {
  assertInputSize(input, PG_LSN_LIMITS.inputBytes);
  const value = input.replace(/^[ \t]+|[ \t]+$/g, "");
  // Avoid `$` accepting a trailing newline; consume the complete raw value.
  const match = /^([0-9a-fA-F]{1,8})\/([0-9a-fA-F]{1,8})$/.exec(value);
  if (!match || match[0] !== value) throw new ToolError("PG_LSN_SYNTAX");
  return (BigInt("0x" + match[1]) << 32n) + BigInt("0x" + match[2]);
}
function position(value: bigint, segmentBytes: bigint): PgLsnPosition {
  return {
    lsn: (value >> 32n).toString(16).toUpperCase() + "/" + (value & 0xffffffffn).toString(16).toUpperCase(),
    bytePosition: value.toString(), segmentNumber: (value / segmentBytes).toString(),
    segmentOffsetBytes: (value % segmentBytes).toString(), zero: value === 0n,
  };
}

/** Exact arithmetic only; callers must establish a shared cluster/WAL history. */
export function comparePgLsn(first: string, second: string, segmentMiB = 16): PgLsnReport {
  if (!PG_WAL_SEGMENT_MIB.some(size => size === segmentMiB)) throw new ToolError("PG_LSN_SEGMENT_SIZE");
  const a = parsePosition(first), b = parsePosition(second);
  const segmentBytes = BigInt(segmentMiB) * MIB;
  const delta = b - a, distance = delta < 0n ? -delta : delta;
  return {
    first: position(a, segmentBytes), second: position(b, segmentBytes),
    segmentMiB, segmentBytes: segmentBytes.toString(), deltaBytes: delta.toString(),
    distanceBytes: distance.toString(), direction: delta > 0n ? "forward" : delta < 0n ? "backward" : "equal",
    distanceMiB: { whole: (distance / MIB).toString(), remainderBytes: (distance % MIB).toString() },
  };
}
