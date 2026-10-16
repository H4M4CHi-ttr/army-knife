import { describe, expect, it } from "vite-plus/test";
import { ToolError } from "./errors";
import {
  aggregateJsonlLogs, convertJsonPointer, csvToInsert, inspectNdjson, inspectSqlitePlan,
} from "./backlog-core";
import { groupStackTraces, inspectDuration, inspectPgDsn, inspectRobots, inspectSitemap } from "./backlog-web";

describe("#35 NDJSON line inspector", () => {
  it("keeps valid records after a malformed row and ignores blank lines", () => {
    const r = inspectNdjson('{"a":1}\r\n\nnot-json\r\n{"a":2,"b":true}');
    expect(r.metrics.find(x => x.key === "records")?.value).toBe("3");
    expect(r.metrics.find(x => x.key === "valid")?.value).toBe("2");
    expect(r.rows.map(x => x.label)).toEqual(["L1","L3","L4"]);
    expect(r.warnings).toContain("invalidRows");
  });
  it("rejects imprecise numbers without silently rounding", () => {
    const r = inspectNdjson('{"id":9007199254740993}\n{"id":1}');
    expect(r.metrics.find(x => x.key === "invalid")?.value).toBe("1");
  });
  it("limits oversized input", () => {
    expect(() => inspectNdjson("x".repeat(70_000))).toThrowError(ToolError);
  });
});
describe("#36 reversible RFC 6901 paths", () => {
  const value = '{"a/b":[true,{},[]],"~":{"":null},"0":{"001":"x"}}';
  it("round trips escaped pointers, arrays, empty containers, and numeric object keys", () => {
    const flat = convertJsonPointer(value, "flatten");
    expect(flat.exportText).toContain('"/a~1b/1"');
    expect(flat.exportText).toContain('"/~0/"');
    const rebuilt = convertJsonPointer(flat.exportText, "restore");
    expect(JSON.parse(rebuilt.exportText)).toEqual(JSON.parse(value));
  });
  it("rejects ambiguous, missing-parent and prototype pollution structures", () => {
    expect(() => convertJsonPointer('[{"pointer":"","kind":"object"},{"pointer":"/a","kind":"value","value":1},{"pointer":"/a","kind":"value","value":2}]', "restore")).toThrow();
    expect(() => convertJsonPointer('[{"pointer":"","kind":"object"},{"pointer":"/a/b","kind":"value","value":1}]', "restore")).toThrow();
    const restored = convertJsonPointer('[{"pointer":"","kind":"object"},{"pointer":"/__proto__","kind":"value","value":1}]', "restore");
    expect(JSON.parse(restored.exportText)).toEqual({ "__proto__": 1 });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
describe("#38 CSV SQL generator", () => {
  it("escapes SQL literals, embedded CSV newline, and explicit NULL independently of blank", () => {
    const r = csvToInsert('id,note\n1,"O''Reilly"\n2,<NULL>\n3,"line\nbreak"\n4,', { table: "public.events", nullToken: "<NULL>", groupSize: 2 });
    expect(r.exportText).toContain('"public"."events"');
    expect(r.exportText).toContain("'O''Reilly'");
    expect(r.exportText).toContain("( '").toBe(false);
    expect(r.exportText).toContain("NULL");
    expect(r.exportText).toContain("''");
    expect(r.metrics.find(x => x.key === "statements")?.value).toBe("2");
  });
  it("rejects column count mismatch, bad identifiers and malformed quotes", () => {
    expect(() => csvToInsert("a,b\n1", {})).toThrow();
    expect(() => csvToInsert("a\n1", { table: "users;DROP" })).toThrow();
    expect(() => csvToInsert('a\n"unfinished')).toThrow();
  });
});
describe("#41 SQLite plan", () => {
  it("shows SCAN SEARCH and temporary B-TREE from valid TSV", () => {
    const r = inspectSqlitePlan("2|0|0|SCAN users\n7|2|0|SEARCH users USING INDEX ix_users\n9|0|0|USE TEMP B-TREE FOR ORDER BY");
    expect(r.metrics.find(x => x.key === "scan")?.value).toBe("1");
    expect(r.metrics.find(x => x.key === "search")?.value).toBe("1");
    expect(r.metrics.find(x => x.key === "temporary")?.value).toBe("1");
  });
  it("allows JSON records and warns about reference cycles", () => {
    const r = inspectSqlitePlan('[{"id":1,"parent":2,"detail":"SCAN a"},{"id":2,"parent":1,"detail":"SEARCH a"}]');
    expect(r.warnings).toContain("cycles");
  });
});
describe("#49 structured log aggregation", () => {
  it("filters request IDs exactly, counts levels, sorts timestamps, and keeps errors", () => {
    const r = aggregateJsonlLogs(
      '{"timestamp":"2024-01-01T00:00:02Z","requestId":"A","service":"api","level":"error"}\n'
      + '{bad}\n'
      + '{"timestamp":"2024-01-01T00:00:01Z","requestId":"A","service":"api","level":"info"}\n'
      + '{"requestId":"B","service":"db","level":"warn"}', { field: "A" });
    expect(r.metrics.find(x => x.key === "counted")?.value).toBe("2");
    expect(r.metrics.find(x => x.key === "invalid")?.value).toBe("1");
    expect(r.rows[0]?.label).toContain("00:00:01");
  });
});
describe("#51 stack trace grouping", () => {
  it("groups same frame sequences across line numbers and omits private source paths", () => {
    const r = groupStackTraces("TypeError: private message\n at foo (/home/alice/app.js:12:3)\n\nTypeError: other\n at foo (/home/bob/app.js:45:1)");
    expect(r.metrics.find(x => x.key === "traces")?.value).toBe("2");
    expect(r.metrics.find(x => x.key === "groups")?.value).toBe("1");
    expect(r.exportText).not.toContain("/home/");
    expect(r.exportText).not.toContain("private message");
  });
});
describe("#63 robots rule matching", () => {
  const text = "User-agent: *\nDisallow: /private/\nAllow: /private/public/\nUser-agent: DemoBot\nDisallow: /secret*\nAllow: /secret/public$";
  it("uses the most specific agent and wildcard and terminal markers", () => {
    expect(inspectRobots(text, { path: "/secret/a", agent: "DemoBot" }).metrics.find(x => x.key === "allowed")?.value).toBe("NO");
    expect(inspectRobots(text, { path: "/secret/public", agent: "DemoBot" }).metrics.find(x => x.key === "allowed")?.value).toBe("YES");
    expect(inspectRobots(text, { path: "/private/abc", agent: "Googlebot" }).metrics.find(x => x.key === "allowed")?.value).toBe("NO");
  });
  it("retains an empty Disallow as no restriction", () => {
    expect(inspectRobots("User-agent: *\nDisallow:", { path: "/x" }).metrics.find(x => x.key === "allowed")?.value).toBe("YES");
  });
});
describe("#64 sitemap.xml inspector", () => {
  const urlset = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    + "<url><loc>https://example.com/a</loc></url><url><loc>https://example.com/a</loc></url></urlset>";
  it("counts duplicate URLs and handles sitemap index", () => {
    expect(inspectSitemap(urlset).metrics.find(x => x.key === "duplicated")?.value).toBe("1");
    expect(inspectSitemap('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://example.com/a.xml</loc></sitemap></sitemapindex>')
      .metrics.find(x => x.key === "type")?.value).toBe("index");
  });
  it("rejects entities and malformed XML", () => {
    expect(() => inspectSitemap("<!DOCTYPE a><urlset/>")).toThrow();
    expect(() => inspectSitemap("<urlset><url></urlset>")).toThrow();
  });
});
describe("#68 ISO duration with calendar months", () => {
  it("clamps month ends and handles leap years and negative months", () => {
    const reference = "2024-01-31T12:00:00Z";
    expect(inspectDuration("P1M", { reference }).metrics.find(x => x.key === "result")?.value).toBe("2024-02-29T12:00:00.000Z");
    expect(inspectDuration("-P1M", { reference }).metrics.find(x => x.key === "result")?.value).toBe("2023-12-31T12:00:00.000Z");
  });
  it("preserves fractional seconds, rejects malformed and unsupported week mixtures", () => {
    expect(inspectDuration("PT0.125S", { reference: "2024-01-01T00:00:00Z" }).exportText).toContain("125");
    expect(() => inspectDuration("P1W2D")).toThrow();
    expect(() => inspectDuration("P")).toThrow();
  });
});
describe("#112 PostgreSQL DSN inspector", () => {
  it("redacts password from URL and keyword DSN outputs", () => {
    for(const value of ["postgresql://user:TOPSECRET@localhost/db?sslmode=require",
                        "user=demo password='TOPSECRET' host=localhost sslmode=disable"]) {
      const r = inspectPgDsn(value);
      expect(JSON.stringify(r)).not.toContain("TOPSECRET");
      expect(r.exportText).toContain("<redacted>");
    }
  });
  it("accepts escaped keyword values and flags insecure connections", () => {
    const r = inspectPgDsn("user='a b' host=localhost password='a\\'b' sslmode=disable");
    expect(r.warnings).toContain("unencryptedConnection");
    expect(r.exportText).not.toContain("a'b");
  });
  it("rejects malformed and repeated keyword arguments", () => {
    expect(() => inspectPgDsn("password='unfinished")).toThrow();
    expect(() => inspectPgDsn("user=one user=two")).toThrow();
  });
});