import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vite-plus/test";
import { formatAddress, parseCidr } from "./cidr";
import { aggregateCidrs, CIDR_AGGREGATE_LIMITS, CidrAggregateEntryError } from "./cidr-aggregate";

const aggregate = (values: string[]) => aggregateCidrs(JSON.stringify(values));
const cidrs = (values: string[]) => aggregate(values).prefixes.map(p => p.cidr);
describe("exact CIDR aggregation", () => {
  it("removes duplicates/containment, merges siblings and keeps exact all-address totals", () => {
    expect(aggregate(["192.0.2.0/25", "192.0.2.128/25", "192.0.2.64/26", "192.0.2.0/25", "198.51.100.0/24"])).toEqual({
      version: 4, inputCount: 5, addressCount: "512", prefixes: [
        { cidr: "192.0.2.0/24", prefix: 24, first: "192.0.2.0", last: "192.0.2.255", addressCount: "256" },
        { cidr: "198.51.100.0/24", prefix: 24, first: "198.51.100.0", last: "198.51.100.255", addressCount: "256" },
      ],
    });
    expect(cidrs(["10.0.0.0/23", "10.0.1.0/24", "10.0.0.0/24"])).toEqual(["10.0.0.0/23"]);
  });
  it("never fills gaps or merges unaligned adjacent blocks into a larger network", () => {
    expect(cidrs(["192.0.2.0/24", "192.0.4.0/24"])).toEqual(["192.0.2.0/24", "192.0.4.0/24"]);
    expect(cidrs(["192.0.1.0/24", "192.0.2.0/24"])).toEqual(["192.0.1.0/24", "192.0.2.0/24"]);
  });
  it("sorts numerically and is independent of input order", () => {
    const values = ["10.0.10.0/24", "10.0.2.0/24", "10.0.1.0/24", "10.0.2.128/25"];
    expect(aggregate(values)).toEqual(aggregate([...values].reverse()));
    expect(cidrs(values)).toEqual(["10.0.1.0/24", "10.0.2.0/24", "10.0.10.0/24"]);
  });
  it("keeps IPv6 counts beyond Number precision exact", () => {
    const r = aggregate(["2001:db8::/65", "2001:db8:0:0:8000::/65", "2001:db8::/128"]);
    expect(r).toMatchObject({ version: 6, inputCount: 3, addressCount: "18446744073709551616" });
    expect(r.prefixes).toEqual([{ cidr: "2001:db8::/64", prefix: 64, first: "2001:db8::", last: "2001:db8::ffff:ffff:ffff:ffff", addressCount: "18446744073709551616" }]);
  });
  it.each([
    ["0.0.0.0/0", 4, "4294967296", "0.0.0.0", "255.255.255.255"],
    ["::/0", 6, "340282366920938463463374607431768211456", "::", "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"],
  ] as const)("handles the full address space %s without enumerating it", (cidr, version, count, first, last) => {
    expect(aggregate([cidr, cidr])).toEqual({ version, inputCount: 2, addressCount: count,
      prefixes: [{ cidr, prefix: 0, first, last, addressCount: count }] });
  });
  it("handles final-address carry and counts /31 /32 /127 /128 as address sets", () => {
    expect(cidrs(["255.255.255.255/32", "255.255.255.254/32"])).toEqual(["255.255.255.254/31"]);
    const r = aggregate(["ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128", "ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffe/128"]);
    expect(r).toMatchObject({ addressCount: "2", prefixes: [{ cidr: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffe/127", last: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", addressCount: "2" }] });
    expect(aggregate(["192.0.2.0/31"]).addressCount).toBe("2");
    expect(aggregate(["192.0.2.0/32"]).addressCount).toBe("1");
    expect(aggregate(["::/127"]).addressCount).toBe("2");
    expect(aggregate(["::/128"]).addressCount).toBe("1");
  });
  it("retains the existing mapped-IPv6 notation and never merges it with IPv4", () => {
    expect(aggregate(["::ffff:192.0.2.0/121", "::ffff:192.0.2.128/121"])).toMatchObject({
      version: 6, addressCount: "256", prefixes: [{ cidr: "::ffff:192.0.2.0/120" }],
    });
    expect(() => aggregate(["192.0.2.0/24", "::ffff:192.0.2.0/120"])).toThrowError(expect.objectContaining({ code: "CIDR_AGGREGATE_MIXED", position: 2 }));
  });
  it.each(["", "[", "[\"::/0\",]", "\ufeff[\"::/0\"]", "[NaN]"])("rejects malformed JSON atomically", input => {
    expect(() => aggregateCidrs(input)).toThrowError("CIDR_AGGREGATE_JSON");
  });
  it.each(["null", "{}", "\"::/0\"", "[1]", "[null]", "[true]", "[[\"::/0\"]]"])("requires a JSON string array", input => {
    expect(() => aggregateCidrs(input)).toThrowError("CIDR_AGGREGATE_SHAPE");
  });
  it.each([
    ["192.0.2.1/24", "CIDR_AGGREGATE_HOST_BITS"], ["2001:db8::1/64", "CIDR_AGGREGATE_HOST_BITS"],
    ["192.0.2.0/024", "CIDR_AGGREGATE_CIDR"], ["192.000.2.0/24", "CIDR_AGGREGATE_CIDR"],
    ["192.0.2.0/33", "CIDR_AGGREGATE_CIDR"], ["::/129", "CIDR_AGGREGATE_CIDR"],
    ["192.0.2.0/255.255.255.0", "CIDR_AGGREGATE_CIDR"], ["192.0.2.0", "CIDR_AGGREGATE_CIDR"],
    ["192.0.2.0-192.0.2.255", "CIDR_AGGREGATE_CIDR"], ["[2001:db8::]/64", "CIDR_AGGREGATE_CIDR"],
    ["fe80::%eth0/64", "CIDR_AGGREGATE_CIDR"], ["192.0.2.0/24 ", "CIDR_AGGREGATE_CIDR"],
    ["\t192.0.2.0/24", "CIDR_AGGREGATE_CIDR"], ["\ufeff::/0", "CIDR_AGGREGATE_CIDR"],
    ["", "CIDR_AGGREGATE_CIDR"], ["x".repeat(65), "CIDR_AGGREGATE_CIDR"],
    ["é/24", "CIDR_AGGREGATE_CIDR"], ["\ud800", "CIDR_AGGREGATE_CIDR"], ["::\u0000/0", "CIDR_AGGREGATE_CIDR"],
  ])("identifies the first invalid item without partial output: %j", (bad, code) => {
    const first = bad!.includes(":") ? "::/128" : "192.0.2.0/32";
    expect(() => aggregate([first, bad!])).toThrowError(expect.objectContaining({ code, position: 2 }));
  });
  it("rejects family mixtures and sanitizes error text", () => {
    expect(() => aggregate(["::/0", "0.0.0.0/0"])).toThrowError(expect.objectContaining({ code: "CIDR_AGGREGATE_MIXED", position: 2 }));
    try { aggregate(["::/0", "PRIVATE_CIDR_177"]); throw new Error("Expected rejection"); }
    catch (error) {
      expect(error).toBeInstanceOf(CidrAggregateEntryError);
      expect(String(error)).not.toContain("PRIVATE_CIDR_177");
      expect(error).toMatchObject({ position: 2, code: "CIDR_AGGREGATE_CIDR" });
    }
  });
  it("enforces exact raw bytes/count and produces all 128 bounded output prefixes", () => {
    const base = '["::/0"]\r\n', exact = base + " ".repeat(8192 - new TextEncoder().encode(base).length);
    expect(aggregateCidrs(exact).prefixes).toHaveLength(1);
    expect(() => aggregateCidrs(exact + " ")).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => aggregate([])).toThrowError("CIDR_AGGREGATE_COUNT");
    expect(() => aggregate(Array(129).fill("::/0"))).toThrowError("CIDR_AGGREGATE_COUNT");
    const r = aggregate(Array.from({ length: 128 }, (_, i) => `10.0.${i}.0/32`));
    expect(r).toMatchObject({ inputCount: 128, addressCount: "128" }); expect(r.prefixes).toHaveLength(128);
    expect(new TextEncoder().encode(JSON.stringify(r, null, 2)).length).toBeLessThanOrEqual(CIDR_AGGREGATE_LIMITS.outputBytes);
    expect(new TextEncoder().encode(r.prefixes.map(p => p.cidr).join("\n") + "\n").length).toBeLessThanOrEqual(CIDR_AGGREGATE_LIMITS.textBytes);
    expect(aggregateCidrs('["\\u003a\\u003a/0"]').prefixes[0]!.cidr).toBe("::/0");
  });
  it("agrees with native Python collapse for every prefix width and deterministic corpora", () => {
    const cases: string[][] = [];
    let state = 177;
    const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state; };
    for (const version of [4, 6] as const) {
      const bits = version === 4 ? 32 : 128;
      for (let prefix = 1; prefix <= bits; prefix++) {
        cases.push([formatAddress(0n, version) + "/" + prefix, formatAddress(1n << BigInt(bits - prefix), version) + "/" + prefix]);
      }
      for (let sample = 0; sample < 80; sample++) {
        const values: string[] = [];
        for (let i = 0; i < 1 + sample % 12; i++) {
          const prefix = version === 4 ? 20 + random() % 13 : 64 + random() % 65;
          const host = BigInt(bits - prefix);
          const base = version === 4 ? 0xc0000000n + BigInt(random() & 0xffff) : 0x20010db8000000000000000000000000n + (BigInt(random()) << 48n);
          const network = (base >> host) << host;
          const value = formatAddress(network, version) + "/" + prefix;
          values.push(value); if (i % 3 === 0) values.push(value);
        }
        cases.push(values);
      }
    }
    cases.push(["0.0.0.0/0"], ["::/0"], ["::ffff:192.0.2.0/121", "::ffff:192.0.2.128/121"]);
    const script = "import ipaddress,json,sys\nprint(json.dumps([[[str(n.network_address.__int__()),str(n.broadcast_address.__int__()),n.prefixlen,str(n.num_addresses)] for n in ipaddress.collapse_addresses(ipaddress.ip_network(x,strict=True) for x in case)] for case in json.load(sys.stdin)]))";
    const expected = JSON.parse(execFileSync("python3", ["-c", script], { input: JSON.stringify(cases), encoding: "utf8", maxBuffer: 4 * 1024 * 1024 })) as [string, string, number, string][][];
    expect(cases).toHaveLength(323); expect(expected).toHaveLength(cases.length);
    cases.forEach((values, i) => {
      const r = aggregate(values), bits = r.version === 4 ? 32 : 128;
      const actual = r.prefixes.map(p => [parseCidr(p.cidr).value.toString(), parseCidr(p.last + "/" + bits).value.toString(), p.prefix, p.addressCount]);
      expect(actual, JSON.stringify(values)).toEqual(expected[i]);
      expect(r.addressCount).toBe(expected[i]!.reduce((sum, p) => sum + BigInt(p[3]), 0n).toString());
      expect(r.prefixes.length).toBeLessThanOrEqual(values.length);
    });
  });
});
