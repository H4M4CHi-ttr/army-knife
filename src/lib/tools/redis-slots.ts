import { assertInputSize, ToolError } from "./errors";

export const REDIS_SLOTS_LIMITS = {
  inputBytes: 8192, keys: 128, keyBytes: 1024, outputBytes: 65536,
  previewKeys: 32, deferredCharacters: 2048,
} as const;
export interface RedisSlotKey {
  key: string;
  keyBytes: number;
  hashTag: string | null;
  hashedBytes: number;
  crc16: string;
  slot: number;
}
export interface RedisSlotsReport {
  keys: RedisSlotKey[];
  distinctSlots: number;
  sameSlot: boolean;
}

function scalarText(text: string): void {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new ToolError("REDIS_SLOTS_UNICODE");
    } else if (c >= 0xdc00 && c <= 0xdfff) throw new ToolError("REDIS_SLOTS_UNICODE");
  }
}

/** UTF-8 keys only; no connection, topology lookup or command execution. */
export function inspectRedisSlots(input: string): RedisSlotsReport {
  assertInputSize(input, REDIS_SLOTS_LIMITS.inputBytes);
  scalarText(input);
  let values: unknown;
  try { values = JSON.parse(input); }
  catch { throw new ToolError("REDIS_SLOTS_JSON"); }
  if (!Array.isArray(values) || values.some(v => typeof v !== "string")) throw new ToolError("REDIS_SLOTS_SHAPE");
  if (values.length === 0 || values.length > REDIS_SLOTS_LIMITS.keys) throw new ToolError("REDIS_SLOTS_COUNT");
  const encoder = new TextEncoder();
  const keys = (values as string[]).map(key => {
    scalarText(key);
    const keyBytes = encoder.encode(key).length;
    if (keyBytes > REDIS_SLOTS_LIMITS.keyBytes) throw new ToolError("REDIS_SLOTS_KEY_LIMIT");
    const open = key.indexOf("{"), close = open < 0 ? -1 : key.indexOf("}", open + 1);
    const hashTag = open >= 0 && close > open + 1 ? key.slice(open + 1, close) : null;
    const bytes = encoder.encode(hashTag ?? key);
    let crc = 0;
    // CRC16/XMODEM: width 16, init/xor 0, poly 0x1021, no reflection.
    for (const byte of bytes) {
      crc ^= byte << 8;
      for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
    }
    return { key, keyBytes, hashTag, hashedBytes: bytes.length,
      crc16: crc.toString(16).padStart(4, "0"), slot: crc % 16384 };
  });
  const distinctSlots = new Set(keys.map(k => k.slot)).size;
  const report = { keys, distinctSlots, sameSlot: distinctSlots === 1 };
  if (encoder.encode(JSON.stringify(report, null, 2)).length > REDIS_SLOTS_LIMITS.outputBytes) throw new ToolError("REDIS_SLOTS_OUTPUT_LIMIT");
  return report;
}
