import { describe, expect, it } from "vite-plus/test";
import { inspectEtags, type EtagInput } from "./etag";

const base: EtagInput = { current: '"v2"', exists: true, method: "GET", ifMatch: null, ifNoneMatch: null };
const run = (change: Partial<EtagInput> = {}) => inspectEtags({ ...base, ...change });
function code(change: Partial<EtagInput>) {
  try { run(change); return "NO_ERROR"; }
  catch (error) { return (error as { code: string }).code; }
}

describe("recorded entity-tag preconditions", () => {
  it.each([
    ['"v2"', '"v2"', "passed", "proceed"],
    ['W/"v2"', '"v2"', "failed", "precondition-failed"],
    ['"v2"', 'W/"v2"', "failed", "precondition-failed"],
    ['W/"v2"', 'W/"v2"', "failed", "precondition-failed"],
    ['"v2"', '"V2"', "failed", "precondition-failed"],
  ] as const)("compares If-Match strongly: %s / %s", (current, ifMatch, state, decision) => {
    const result = run({ current, ifMatch });
    expect(result).toMatchObject({ decision, basis: "ifMatch", complete: true });
    expect(result.ifMatch).toMatchObject({ comparison: "strong", state, match: state === "passed" });
  });
  it.each([
    ['"v2"', '"v2"', true], ['W/"v2"', '"v2"', true],
    ['"v2"', 'W/"v2"', true], ['W/"v2"', 'W/"v2"', true],
    ['"v2"', '"V2"', false], ['""', 'W/""', true],
  ] as const)("compares If-None-Match weakly: %s / %s", (current, ifNoneMatch, match) => {
    const result = run({ current, ifNoneMatch });
    expect(result.decision).toBe(match ? "not-modified" : "proceed");
    expect(result.ifNoneMatch).toMatchObject({ comparison: "weak", match, state: match ? "failed" : "passed" });
  });
  it.each(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] as const)("models the status and If-Match exception for %s", method => {
    expect(run({ method, ifNoneMatch: '"v2"' })).toMatchObject({ usualStatus: method === "GET" || method === "HEAD" ? 304 : 412, alreadyAppliedException: false });
    expect(run({ method, ifMatch: '"old"' })).toMatchObject({ usualStatus: 412, alreadyAppliedException: method !== "GET" && method !== "HEAD" });
  });
  it("distinguishes absent conditions and enabled empty lists", () => {
    expect(run()).toMatchObject({ decision: "proceed", usualStatus: null, basis: "none", ifMatch: { kind: "absent", state: "absent" } });
    expect(run({ ifMatch: "" })).toMatchObject({ decision: "precondition-failed", ifMatch: { kind: "list", tags: [], state: "failed" } });
    expect(run({ current: "", ifNoneMatch: "\t " })).toMatchObject({ decision: "proceed", complete: true, ifNoneMatch: { kind: "list", tags: [], state: "passed" } });
    expect(run({ ifMatch: ", ," }).ifMatch).toMatchObject({ tags: [], ignoredEmptyMembers: 3, state: "failed" });
  });
  it.each([true, false])("uses representation existence for a bare wildcard: %s", exists => {
    expect(run({ exists, ifMatch: " *\t" })).toMatchObject({ decision: exists ? "proceed" : "precondition-failed", ifMatch: { kind: "wildcard", match: exists } });
    expect(run({ exists, ifNoneMatch: "*" })).toMatchObject({ decision: exists ? "not-modified" : "proceed", ifNoneMatch: { match: exists } });
  });
  it("treats a quoted star as an ordinary tag", () => {
    expect(run({ ifNoneMatch: '"*"' }).decision).toBe("proceed");
    expect(run({ current: '"*"', ifNoneMatch: 'W/"*"' }).decision).toBe("not-modified");
    expect(run({ exists: false, ifMatch: '"*"' }).decision).toBe("precondition-failed");
  });
  it("does not invent an ETag when the representation exists", () => {
    expect(run({ current: "", ifMatch: '"v2"', ifNoneMatch: "*" })).toMatchObject({ decision: "unassessed", usualStatus: null, complete: false, basis: "ifMatch", ifMatch: { state: "unassessed", match: null }, ifNoneMatch: { state: "skipped" } });
    expect(run({ current: "", ifNoneMatch: '"v2"' })).toMatchObject({ decision: "unassessed", complete: false, ifNoneMatch: { tags: [{ matches: null }] } });
    expect(run({ current: "", ifNoneMatch: "*" }).decision).toBe("not-modified");
  });
  it("can reject weak If-Match candidates even without the current tag", () => {
    expect(run({ current: "", ifMatch: 'W/"v2", W/"other"' })).toMatchObject({ decision: "precondition-failed", complete: true, ifMatch: { match: false, tags: [{ matches: false }, { matches: false }] } });
    expect(run({ current: "", ifMatch: 'W/"v2", "other"' })).toMatchObject({ decision: "unassessed", ifMatch: { tags: [{ matches: false }, { matches: null }] } });
  });
  it("omits a retained current value when the representation is absent", () => {
    const result = run({ exists: false, current: "PRIVATE_UNUSED\n".repeat(2000), ifNoneMatch: '"v2"' });
    expect(result).toMatchObject({ current: null, currentIgnored: true, decision: "proceed", ifNoneMatch: { match: false } });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_UNUSED");
  });
  it("evaluates If-Match before If-None-Match and labels skipped rows", () => {
    const failed = run({ ifMatch: '"old"', ifNoneMatch: '"v2"' });
    expect(failed).toMatchObject({ decision: "precondition-failed", basis: "ifMatch", ifNoneMatch: { state: "skipped", match: null, tags: [{ matches: null }] } });
    expect(run({ ifMatch: '"v2"', ifNoneMatch: 'W/"v2"' })).toMatchObject({ decision: "not-modified", basis: "ifNoneMatch", ifMatch: { state: "passed" }, ifNoneMatch: { state: "failed" } });
    expect(code({ ifMatch: '"old"', ifNoneMatch: "malformed" })).toBe("ETAG_SYNTAX");
  });
  it("preserves quoted commas, duplicate tags and optional whitespace", () => {
    const result = run({ current: '"a,b"', ifNoneMatch: '\t, W/"a,b", , "a,b",\t' });
    expect(result.ifNoneMatch).toMatchObject({ ignoredEmptyMembers: 3, tags: [{ raw: 'W/"a,b"', opaque: "a,b", weak: true, matches: true }, { raw: '"a,b"', matches: true }] });
    expect(result.decision).toBe("not-modified");
  });
  it("does not unescape backslashes, including a backslash before the closing quote", () => {
    const tag = '"a' + String.fromCharCode(92) + '"';
    expect(run({ current: tag, ifNoneMatch: tag })).toMatchObject({ current: { opaque: "a\\" }, decision: "not-modified" });
    expect(run({ current: '"a\\b"', ifNoneMatch: '"ab"' }).decision).toBe("proceed");
  });
  it.each([0x21, 0x23, 0x2c, 0x5c, 0x7e, 0x80, 0x9f, 0xff])("preserves a legal opaque field octet %i", byte => {
    const opaque = String.fromCharCode(byte), tag = `"${opaque}"`;
    expect(run({ current: tag, ifNoneMatch: tag })).toMatchObject({ current: { opaque }, decision: "not-modified" });
  });
  it.each([0, 9, 10, 13, 31, 32, 127, 256, 0xd800, 0xdfff])("rejects an unsupported opaque character %i", byte => {
    expect(code({ ifMatch: `"${String.fromCharCode(byte)}"` })).toBe("ETAG_SYNTAX");
  });
  it.each(['v2', 'w/"v2"', 'W/ "v2"', '"unterminated', '"x"junk', '"a\\"b"', '*, "v2"', '"v2",*', '*,*', ',*', '*,', 'W/*', 'If-Match: "v2"', '"v2"\r\n', '"v2"\u00a0', '<img src=x>', '"v2"\u202e'])("rejects a malformed active field without a partial report: %s", ifMatch => {
    expect(code({ ifMatch })).toBe("ETAG_SYNTAX");
  });
  it("accepts one current tag only and never echoes invalid field data in errors", () => {
    expect(code({ current: '"x","y"' })).toBe("ETAG_SYNTAX");
    try { run({ ifMatch: "PRIVATE_ETAG_MARKER" }); throw new Error("accepted invalid data"); }
    catch (error) { expect(String(error)).toContain("ETAG_SYNTAX"); expect(JSON.stringify(error)).not.toContain("PRIVATE_ETAG_MARKER"); }
    expect(code({ method: "OPTIONS" as EtagInput["method"] })).toBe("ETAG_METHOD");
  });
  it("enforces per-tag UTF-8 limits including the weak prefix", () => {
    expect(run({ current: `"${"a".repeat(510)}"` }).current?.opaque).toHaveLength(510);
    expect(code({ current: `"${"a".repeat(511)}"` })).toBe("ETAG_LIMIT");
    expect(run({ current: `W/"${"a".repeat(508)}"` }).current?.weak).toBe(true);
    expect(code({ current: `W/"${"a".repeat(509)}"` })).toBe("ETAG_LIMIT");
    expect(run({ current: `"${"é".repeat(255)}"` }).current?.opaque).toHaveLength(255);
    expect(code({ current: `"${"é".repeat(256)}"` })).toBe("ETAG_LIMIT");
  });
  it("bounds tags and ignored empty members independently", () => {
    expect(run({ ifMatch: Array(64).fill('"v2"').join(",") }).ifMatch.tags).toHaveLength(64);
    expect(code({ ifMatch: Array(65).fill('"v2"').join(",") })).toBe("ETAG_LIMIT");
    expect(run({ ifMatch: ",".repeat(63) }).ifMatch.ignoredEmptyMembers).toBe(64);
    expect(code({ ifMatch: ",".repeat(64) })).toBe("ETAG_LIMIT");
  });
  it("bounds total raw active bytes before trimming, across fields", () => {
    const fields = { current: `"${"a".repeat(64)}"`, ifMatch: Array(63).fill(`"${"b".repeat(126)}"`).join(",") };
    expect(new TextEncoder().encode(fields.current + fields.ifMatch)).toHaveLength(8192);
    expect(run(fields).decision).toBe("precondition-failed");
    expect(code({ ...fields, ifMatch: fields.ifMatch + " " })).toBe("INPUT_TOO_LARGE");
    expect(code({ ifNoneMatch: " ".repeat(8193) })).toBe("INPUT_TOO_LARGE");
  });
});
