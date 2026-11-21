import { describe, expect, it } from "vite-plus/test";
import { inspectCacheStatus } from "./cache-status";
import { CACHE_STATUS_EXAMPLE } from "./cache-status-sample";

describe("Cache-Status recorded field inspection", () => {
  it("keeps origin-to-client order across repeated header lines and commas", () => {
    expect(inspectCacheStatus(CACHE_STATUS_EXAMPLE.replace("\n", "\r\n") + ", browser").caches).toMatchObject([
      { name: "shield", outcome: "hit", ttl: "-12", forwarded: null, forwardedStatus: null },
      { name: "Edge cache", outcome: "forwarded", ttl: "60", forwarded: "stale", forwardedStatus: "304" },
      { name: "browser", outcome: "unspecified", ttl: null, forwarded: null, forwardedStatus: null },
    ]);
  });

  it("distinguishes false from absent and preserves opaque extensions in wire order", () => {
    const input = String.raw`"A, B;\"\\"; fwd=vendor-reason; ttl=-999999999999999; collapsed=?0; __invalid=?1`;
    expect(() => inspectCacheStatus(input)).toThrow("CACHE_STATUS_SYNTAX");
    const { caches } = inspectCacheStatus(input.replace("__invalid=?1", 'x=012.340; y=:AQI=:; z'));
    expect(caches).toEqual([{
      name: 'A, B;"\\', outcome: "forwarded", forwarded: "vendor-reason", forwardedStatus: null, ttl: "-999999999999999",
      parameters: [
        { name: "fwd", kind: "token", value: "vendor-reason" },
        { name: "ttl", kind: "integer", value: "-999999999999999" },
        { name: "collapsed", kind: "boolean", value: false },
        { name: "x", kind: "decimal", value: "012.340" },
        { name: "y", kind: "bytes", value: "AQI=" },
        { name: "z", kind: "boolean", value: true },
      ],
    }]);
    expect(inspectCacheStatus('""; hit=?0; ttl=0, edge').caches).toMatchObject([
      { name: "", outcome: "unspecified", ttl: "0", parameters: [{ value: false }, { value: "0" }] },
      { name: "edge", outcome: "unspecified", ttl: null, parameters: [] },
    ]);
  });

  it.each([
    "edge;hit;hit", "edge; ttl=2.0", "edge; fwd=\"stale\"", "edge;hit=1",
    "edge; hit=?0; fwd=miss", "edge; stored", "edge; collapsed=?0",
    "edge; fwd-status=200", "edge; fwd=miss; fwd-status=99", "edge; fwd=miss; fwd-status=600",
    "edge; key=token", "edge; detail=?1",
  ])("rejects an incompatible known parameter in %j", (input) => {
    expect(() => inspectCacheStatus("valid;hit, " + input)).toThrow("CACHE_STATUS_PARAMETER");
  });

  it.each([
    "", "edge,", "edge,,edge", "edge;TTL=1", "edge ;ttl=1", "edge;\tttl=1", "edge;ttl =1",
    "edge;ttl=1000000000000000", "edge;d=1.2345", "edge;b=:A=:",
    "edge;detail=\"incomplete", 'edge;detail="x\\n"', 'edge;detail="café"', "(edge)", "edge\r",
  ])("rejects malformed structured fields in %j", (input) => {
    expect(() => inspectCacheStatus(input)).toThrow("CACHE_STATUS_SYNTAX");
  });

  it.each(["edge\nedge", "Cache-Status: edge\n Cache-Status: edge", "Cache-Status: edge\nETag: test"])(
    "rejects unrelated or folded lines in %j",
    (input) => expect(() => inspectCacheStatus(input)).toThrow("CACHE_STATUS_HEADERS"),
  );

  it("enforces exact physical line, cache, parameter and raw byte bounds", () => {
    const lines = Array.from({ length: 32 }, () => "Cache-Status: edge");
    const caches = Array.from({ length: 64 }, () => "edge");
    const parameters = Array.from({ length: 16 }, (_, index) => ";p" + index).join("");
    const bytes = 'edge; detail="' + "a".repeat(8177) + '"';
    expect(inspectCacheStatus(lines.join("\r\n")).caches).toHaveLength(32);
    expect(inspectCacheStatus(caches.join(",\t")).caches).toHaveLength(64);
    expect(inspectCacheStatus("edge" + parameters).caches[0]?.parameters).toHaveLength(16);
    expect(bytes.length).toBe(8192);
    expect(inspectCacheStatus(bytes).caches).toHaveLength(1);
    expect(inspectCacheStatus(lines.join("\n") + "\n").caches).toHaveLength(32);
    expect(() => inspectCacheStatus([...lines, lines[0]].join("\n"))).toThrow("CACHE_STATUS_LIMIT");
    expect(() => inspectCacheStatus(caches.join(",") + ",edge")).toThrow("CACHE_STATUS_LIMIT");
    expect(() => inspectCacheStatus("edge" + parameters + ";extra")).toThrow("CACHE_STATUS_LIMIT");
    expect(() => inspectCacheStatus(bytes + " ")).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
  });
});
