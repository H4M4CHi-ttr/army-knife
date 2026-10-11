import { ToolError } from "./errors";

export interface CidrResult {
  version: 4 | 6;
  address: string;
  prefix: number;
  cidr: string;
  network: string;
  lastAddress: string;
  subnetMask: string;
  /** IPv6 has no broadcast address; /31 and /32 have no directed broadcast. */
  broadcast: string | null;
  wildcardMask: string | null;
  /** Decimal strings preserve the full 128-bit IPv6 address count. */
  addressCount: string;
  /** Only IPv4 has a generic host-count rule. /31 assumes point-to-point. */
  usableHostCount: string | null;
  firstHost: string | null;
  lastHost: string | null;
  hostBitsSet: boolean;
}

interface ParsedAddress {
  version: 4 | 6;
  value: bigint;
}

function parseIpv4(input: string): bigint {
  const parts = input.split(".");
  if (parts.length !== 4) throw new ToolError("IP_INVALID");
  let value = 0n;
  for (const part of parts) {
    // Reject octal-looking forms and permissive URL-style abbreviated addresses.
    if (!/^(0|[1-9][0-9]{0,2})$/.test(part) || Number(part) > 255) {
      throw new ToolError("IP_INVALID");
    }
    value = (value << 8n) | BigInt(part);
  }
  return value;
}

function parseIpv6(input: string): bigint {
  if (!input || input.includes("%") || input.includes("[") || input.includes("]")) {
    throw new ToolError("IP_INVALID");
  }
  let address = input;
  if (address.includes(".")) {
    const split = address.lastIndexOf(":");
    if (split === -1) throw new ToolError("IP_INVALID");
    const ipv4 = parseIpv4(address.slice(split + 1));
    address = `${address.slice(0, split + 1)}${(ipv4 >> 16n).toString(16)}:${(ipv4 & 0xffffn).toString(16)}`;
  }
  const halves = address.split("::");
  if (halves.length > 2) throw new ToolError("IP_INVALID");
  const parseHalf = (part: string): string[] => (part === "" ? [] : part.split(":"));
  const left = parseHalf(halves[0] ?? "");
  const right = halves.length === 2 ? parseHalf(halves[1] ?? "") : [];
  if ([...left, ...right].some((part) => !/^[0-9a-fA-F]{1,4}$/.test(part))) {
    throw new ToolError("IP_INVALID");
  }
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) {
    throw new ToolError("IP_INVALID");
  }
  const parts = [...left, ...Array<string>(missing).fill("0"), ...right];
  return parts.reduce((value, part) => (value << 16n) | BigInt(`0x${part}`), 0n);
}

function parseAddress(input: string): ParsedAddress {
  if (input.length > 80) throw new ToolError("IP_INVALID");
  return input.includes(":")
    ? { version: 6, value: parseIpv6(input) }
    : { version: 4, value: parseIpv4(input) };
}

function formatIpv4(value: bigint): string {
  return [24n, 16n, 8n, 0n].map((shift) => ((value >> shift) & 255n).toString()).join(".");
}

/** RFC 5952: lowercase; compress the longest run of at least two zero groups. */
function formatIpv6(value: bigint): string {
  // Preserve the familiar mixed notation for the IPv4-mapped range.
  if (value >> 32n === 0xffffn) return `::ffff:${formatIpv4(value & 0xffff_ffffn)}`;
  const parts = Array.from({ length: 8 }, (_, index) =>
    ((value >> BigInt((7 - index) * 16)) & 0xffffn).toString(16),
  );
  let bestStart = -1;
  let bestLength = 1;
  for (let index = 0; index < parts.length;) {
    if (parts[index] !== "0") {
      index += 1;
      continue;
    }
    const start = index;
    while (parts[index] === "0") index += 1;
    const length = index - start;
    if (length > bestLength) {
      bestStart = start;
      bestLength = length;
    }
  }
  if (bestStart < 0) return parts.join(":");
  return `${parts.slice(0, bestStart).join(":")}::${parts.slice(bestStart + bestLength).join(":")}`;
}

function formatAddress(value: bigint, version: 4 | 6): string {
  return version === 4 ? formatIpv4(value) : formatIpv6(value);
}

function parseCidr(input: string): ParsedAddress & { prefix: number } {
  const parts = input.trim().split("/");
  if (parts.length !== 2 || !/^(0|[1-9][0-9]{0,2})$/.test(parts[1] ?? "")) {
    throw new ToolError("CIDR_INVALID");
  }
  const parsed = parseAddress(parts[0] ?? "");
  const prefix = Number(parts[1]);
  if (prefix > (parsed.version === 4 ? 32 : 128)) throw new ToolError("CIDR_PREFIX_INVALID");
  return { ...parsed, prefix };
}

export function analyzeCidr(input: string): CidrResult {
  const { version, value, prefix } = parseCidr(input);
  const bits = version === 4 ? 32 : 128;
  const hostBits = BigInt(bits - prefix);
  const addressCount = 1n << hostBits;
  const wildcard = addressCount - 1n;
  const mask = ((1n << BigInt(bits)) - 1n) ^ wildcard;
  const network = value & mask;
  const last = network | wildcard;
  const hasBroadcast = version === 4 && prefix < 31;
  const usableCount = version === 4 ? addressCount - (hasBroadcast ? 2n : 0n) : null;
  return {
    version,
    address: formatAddress(value, version),
    prefix,
    cidr: `${formatAddress(network, version)}/${prefix}`,
    network: formatAddress(network, version),
    lastAddress: formatAddress(last, version),
    subnetMask: formatAddress(mask, version),
    broadcast: hasBroadcast ? formatIpv4(last) : null,
    wildcardMask: version === 4 ? formatIpv4(wildcard) : null,
    addressCount: addressCount.toString(),
    usableHostCount: usableCount?.toString() ?? null,
    firstHost: version === 4 ? formatIpv4(network + (hasBroadcast ? 1n : 0n)) : null,
    lastHost: version === 4 ? formatIpv4(last - (hasBroadcast ? 1n : 0n)) : null,
    hostBitsSet: network !== value,
  };
}

export function cidrContains(cidr: string, address: string): boolean {
  const subnet = parseCidr(cidr);
  const candidate = parseAddress(address.trim());
  if (subnet.version !== candidate.version) return false;
  const shift = BigInt((subnet.version === 4 ? 32 : 128) - subnet.prefix);
  return subnet.value >> shift === candidate.value >> shift;
}
