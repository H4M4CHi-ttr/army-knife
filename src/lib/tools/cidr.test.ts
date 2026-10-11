import { describe, expect, it } from "vite-plus/test";
import { analyzeCidr, cidrContains } from "./cidr";

describe("CIDR analysis", () => {
  it("calculates a subnet with host bits set without 32-bit signed overflow", () => {
    expect(analyzeCidr("192.168.1.130/26")).toMatchObject({
      version: 4,
      address: "192.168.1.130",
      cidr: "192.168.1.128/26",
      subnetMask: "255.255.255.192",
      wildcardMask: "0.0.0.63",
      broadcast: "192.168.1.191",
      addressCount: "64",
      usableHostCount: "62",
      firstHost: "192.168.1.129",
      lastHost: "192.168.1.190",
      hostBitsSet: true,
    });
  });

  it("handles /0, point-to-point /31, and a single /32", () => {
    expect(analyzeCidr("255.255.255.255/0")).toMatchObject({
      network: "0.0.0.0",
      addressCount: "4294967296",
      subnetMask: "0.0.0.0",
    });
    expect(analyzeCidr("203.0.113.11/31")).toMatchObject({
      firstHost: "203.0.113.10",
      lastHost: "203.0.113.11",
      usableHostCount: "2",
      broadcast: null,
    });
    expect(analyzeCidr("203.0.113.11/32")).toMatchObject({
      firstHost: "203.0.113.11",
      lastHost: "203.0.113.11",
      usableHostCount: "1",
      broadcast: null,
    });
  });

  it("keeps IPv6 counts exact and does not invent a broadcast or usable-host rule", () => {
    expect(analyzeCidr("2001:db8:1234:5678::1234/64")).toMatchObject({
      version: 6,
      cidr: "2001:db8:1234:5678::/64",
      lastAddress: "2001:db8:1234:5678:ffff:ffff:ffff:ffff",
      addressCount: "18446744073709551616",
      broadcast: null,
      usableHostCount: null,
      firstHost: null,
    });
    expect(analyzeCidr("::/0").addressCount).toBe("340282366920938463463374607431768211456");
  });

  it("canonicalizes IPv6 using the leftmost longest zero run and leaves one zero uncompressed", () => {
    expect(analyzeCidr("2001:0DB8:0:0:1:0:0:1/128").address).toBe("2001:db8::1:0:0:1");
    expect(analyzeCidr("2001:db8:1:0:2:3:4:5/128").address).toBe("2001:db8:1:0:2:3:4:5");
    expect(analyzeCidr("1:2:3:4:5:6:7::/128").address).toBe("1:2:3:4:5:6:7:0");
    expect(analyzeCidr("0:0:0:0:0:0:0:0/128").address).toBe("::");
  });

  it("accepts IPv4 embedded at the end of IPv6 and recognizes mapped addresses", () => {
    expect(analyzeCidr("::FFFF:192.0.2.129/120")).toMatchObject({
      address: "::ffff:192.0.2.129",
      cidr: "::ffff:192.0.2.0/120",
      lastAddress: "::ffff:192.0.2.255",
    });
    expect(analyzeCidr("2001:db8::192.0.2.1/128").address).toBe("2001:db8::c000:201");
    expect(cidrContains("::ffff:192.0.2.0/120", "::ffff:c000:201")).toBe(true);
  });

  it("checks membership by bit prefix and never conflates IP families", () => {
    expect(cidrContains("10.0.0.42/24", "10.0.0.255")).toBe(true);
    expect(cidrContains("10.0.0.0/24", "10.0.1.0")).toBe(false);
    expect(cidrContains("2001:db8::/32", "2001:db8:abcd::1")).toBe(true);
    expect(cidrContains("2001:db8::/32", "2001:db9::1")).toBe(false);
    expect(cidrContains("0.0.0.0/0", "::ffff:192.0.2.1")).toBe(false);
  });

  it.each([
    "127.1/8",
    "010.0.0.1/8",
    "256.0.0.1/8",
    "1.2.3.4/33",
    "1.2.3.4/-1",
    "1.2.3.4/024",
    "1.2.3.4",
    "1.2.3.4/24/2",
    "1.2.3.4 /24",
    "1.2.3.4/24junk",
    ":::/64",
    "1::2::3/64",
    ":1:2:3:4:5:6:7/64",
    "1:2:3:4:5:6:7:/64",
    "1:2:3:4:5:6:7:8::/64",
    "1:2:3:4:5:6:7/64",
    "10000::/64",
    "::g/64",
    "fe80::1%eth0/64",
    "[::1]/128",
    "::1/129",
    "::ffff:192.0.2.256/128",
  ])("rejects ambiguous or invalid input: %s", (input) => {
    expect(() => analyzeCidr(input)).toThrow();
  });
});
