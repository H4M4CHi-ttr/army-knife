import { describe, expect, it } from "vite-plus/test";
import { ToolError } from "./errors";
import {
  aggregateJsonlLogs, convertJsonPointer, csvToInsert, inspectNdjson, inspectSqlitePlan,
} from "./backlog-core";
import { groupStackTraces, inspectDuration, inspectPgDsn, inspectRobots, inspectSitemap } from "./backlog-web";

describe("#35 NDJSON line inspector", () => {
  it("exports every key frequency instead of silently omitting keys after 30", () => {
    const value = Object.fromEntries(Array.from({ length: 31 }, (_, i) => ["key" + i, true]));
    expect(JSON.parse(inspectNdjson(JSON.stringify(value)).exportText).keys).toHaveLength(31);
  });
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
  it("restores its own bounded output above the ordinary input limit", () => {
    const original = Array.from({ length: 1000 }, (_, i) => i);
    const flat = convertJsonPointer(JSON.stringify(original));
    expect(new TextEncoder().encode(flat.exportText).length).toBeGreaterThan(65_536);
    expect(JSON.parse(convertJsonPointer(flat.exportText, "restore").exportText)).toEqual(original);
  });
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
    expect(JSON.parse(restored.exportText)).toEqual(JSON.parse('{"__proto__":1}'));
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it("rejects non-scalar value nodes and paths beyond the supported JSON depth", () => {
    expect(() => convertJsonPointer('[{"pointer":"","kind":"value","value":{"a":1}}]', "restore")).toThrow(ToolError);
    const nodes = [{ pointer: "", kind: "object" }];
    for (let n = 1; n <= 65; n++) nodes.push({ pointer: "/a".repeat(n), kind: "object" });
    expect(() => convertJsonPointer(JSON.stringify(nodes), "restore")).toThrow(ToolError);
  });
});
describe("#38 CSV SQL generator", () => {
  it("escapes SQL literals, embedded CSV newline, and explicit NULL independently of blank", () => {
    const r = csvToInsert('id,note\n1,"O\'Reilly"\n2,<NULL>\n3,"line\nbreak"\n4,', { table: "public.events", nullToken: "<NULL>", groupSize: 2 });
    expect(r.exportText).toContain('"public"."events"');
    expect(r.exportText).toContain("'O''Reilly'");
    expect(r.exportText).not.toContain("( '");
    expect(r.exportText).toContain("NULL");
    expect(r.exportText).toContain("''");
    expect(r.metrics.find(x => x.key === "statements")?.value).toBe("2");
  });
  it("uses mode-independent MySQL UTF-8 expressions and Postgres E strings for backslash and quotes", () => {
    const mysql = csvToInsert("value\n\"\\\\' OR 1=1 --\"", { dialect: "mysql" });
    expect(mysql.exportText).toMatch(/CONVERT\(0x[0-9a-f]+ USING utf8mb4\)/);
    expect(mysql.exportText).not.toContain(" OR 1=1 --");
    expect(mysql.exportText).toContain("INSERT INTO " + "\u0060" + "records" + "\u0060");
    const pg = csvToInsert("value\n\"\\\\' OR 1=1 --\"", { dialect: "postgres" });
    expect(pg.exportText).toContain("E'");
    expect(pg.exportText).toContain("\\\\\\\\");
    expect(pg.exportText).toContain("'' OR 1=1");
  });
  it("rejects column count mismatch, bad identifiers and malformed quotes", () => {
    expect(() => csvToInsert("a,b\n1", {})).toThrow();
    expect(() => csvToInsert("a\n1", { table: "users;DROP" })).toThrow();
    expect(() => csvToInsert('a\n"unfinished')).toThrow();
  });
});
describe("#41 SQLite plan", () => {
  it("rejects rounded, duplicate and coerced JSON identifiers", () => {
    for (const input of [
      '[{"id":1.00000000000000001,"parent":0,"detail":"SCAN t"}]',
      '[{"id":true,"parent":null,"detail":"SCAN t"}]',
      '[{"id":1,"id":2,"parent":0,"detail":"SCAN t"}]',
      '[{"id":1,"parent":0,"detail":true}]',
    ]) expect(() => inspectSqlitePlan(input)).toThrow(ToolError);
  });
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
  it("reports non-scalar request IDs without losing later valid rows", () => {
    const r = aggregateJsonlLogs('{"requestId":{}}\n{"requestId":[]}\n{"requestId":true}\n{"requestId":"ok","timestamp":0}');
    expect(r.metrics.find(x => x.key === "invalid")?.value).toBe("3");
    expect(r.metrics.find(x => x.key === "counted")?.value).toBe("1");
    expect(r.rows[0]?.detail).toContain("ok");
    expect(r.warnings).toContain("invalidRows");
  });
  it("keeps out-of-range timestamps diagnostic and exports every frequency", () => {
    const input = Array.from({ length: 31 }, (_, i) => JSON.stringify({
      timestamp: i === 0 ? 8640000000000001 : "2024-01-01T00:00:00Z", service: "svc" + i, level: "lvl" + i,
    })).join("\n");
    const r = aggregateJsonlLogs(input);
    expect(r.metrics.find(x => x.key === "missingTimestamp")?.value).toBe("1");
    const output = JSON.parse(r.exportText);
    expect(output.timeline).toHaveLength(31);
    expect(output.services).toHaveLength(31);
    expect(output.levels).toHaveLength(31);
    expect(output.timeline.at(-1).time).toBe("");
  });
  it("keeps invalid times last and sorts extended-year instants by time", () => {
    const input = ["n/a", 8640000000000000, "2024-01-01T00:00:00Z", "unknown"].map(timestamp => JSON.stringify({ timestamp })).join("\n");
    const output = JSON.parse(aggregateJsonlLogs(input).exportText);
    expect(output.timeline.map((row: { line: number }) => row.line)).toEqual([3, 2, 1, 4]);
  });
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
  it("does not extract exception types from a private message", () => {
    const r = groupStackTraces("Error: PRIVATE_SENTINEL_982734Error\n at foo (/app/a.js:1:2)");
    expect(JSON.stringify(r)).not.toContain("PRIVATE_SENTINEL");
    expect(r.rows[0]?.label).toMatch(/^Error #/);
  });
  it("keeps consecutive Python tracebacks separate without blank lines", () => {
    const r = groupStackTraces('Traceback (most recent call last):\n  File "a.py", line 1, in one\nValueError: first\nTraceback (most recent call last):\n  File "b.py", line 2, in two\nValueError: second');
    const groups = JSON.parse(r.exportText);
    expect(groups).toHaveLength(2);
    expect(groups.map((g: { frames: number }) => g.frames)).toEqual([1, 1]);
  });
  it("groups same frame sequences across line numbers and omits private source paths", () => {
    const r = groupStackTraces("TypeError: private message\n at foo (/home/alice/app.js:12:3)\n\nTypeError: other\n at foo (/home/bob/app.js:45:1)");
    expect(r.metrics.find(x => x.key === "traces")?.value).toBe("2");
    expect(r.metrics.find(x => x.key === "groups")?.value).toBe("1");
    expect(r.exportText).not.toContain("/home/");
    expect(r.exportText).not.toContain("private message");
  });
});
describe("#63 robots rule matching", () => {
  it("counts nonterminal dollar signs as literal rule characters", () => {
    const r = inspectRobots("User-agent: *\nDisallow: /a$b\nAllow: /a*b", { path: "/a$b" });
    expect(r.metrics.find(x => x.key === "allowed")?.value).toBe("NO");
  });
  it("separates agents after an empty Disallow", () => {
    const r = inspectRobots("User-agent: Foo\nDisallow:\nUser-agent: Bar\nDisallow: /", { agent: "Foo", path: "/hello" });
    expect(r.metrics.find(x => x.key === "allowed")?.value).toBe("YES");
  });
  it("bounds wildcard work for a short adversarial pattern", () => {
    const r = inspectRobots("User-agent: *\nDisallow: /" + "a*".repeat(24) + "b", { path: "/" + "a".repeat(80) });
    expect(r.metrics.find(x => x.key === "allowed")?.value).toBe("YES");
  });
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
  it("flags present but empty optional values", () => {
    for (const field of ["lastmod", "priority", "changefreq"]) {
      const input = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc><${field}/></url></urlset>`;
      const r = inspectSitemap(input);
      expect(r.metrics.find(x => x.key === "invalid")?.value).toBe("1");
      expect(r.warnings).toContain("invalidRows");
    }
  });
  it("counts invalid dates, duplicate fields, nested loc markup and unknown entries", () => {
    const ns = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    for (const content of [
      '<url><loc>https://example.com/</loc><lastmod>2024-02-31</lastmod></url>',
      '<url><loc>https://example.com/</loc><loc>https://example.com/other</loc></url>',
      '<url><loc>https://example.com/<b>path</b></loc></url>',
      '<url xmlns=""><loc>https://example.com/</loc></url>',
    ]) {
      const r = inspectSitemap(`<urlset ${ns}>${content}</urlset>`);
      expect(r.warnings).toContain("invalidRows");
      expect(Number(r.metrics.find(x => x.key === "invalid")?.value)).toBeGreaterThan(0);
    }
  });
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
  it("preserves decimal milliseconds exactly and rejects impossible reference dates", () => {
    expect(inspectDuration("PT1.001S", { reference: "2024-01-01T00:00:00Z" }).metrics.find(x => x.key === "result")?.value)
      .toBe("2024-01-01T00:00:01.001Z");
    for (const reference of ["2024-02-31T12:00:00Z", "2024-01-01T24:00:00Z", "2024-01-01T00:00:00-00:00"])
      expect(() => inspectDuration("P1D", { reference })).toThrow(ToolError);
  });
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
  it("distinguishes an absent URI password from an explicitly empty one", () => {
    for (const input of ["postgresql://localhost/db", "postgresql://demo@localhost/db"])
      expect(inspectPgDsn(input).metrics.find(x => x.key === "hasPassword")?.value).toBe("NO");
    expect(inspectPgDsn("postgresql://demo:@localhost/db").metrics.find(x => x.key === "hasPassword")?.value).toBe("YES");
  });
  it("masks arbitrary server options that can contain credentials", () => {
    for (const source of ["host=localhost options='-c app.api_key=PRIVATE_SENTINEL'", "postgresql://localhost/db?options=-c%20app.api_key%3DPRIVATE_SENTINEL"])
      expect(JSON.stringify(inspectPgDsn(source))).not.toContain("PRIVATE_SENTINEL");
  });
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
