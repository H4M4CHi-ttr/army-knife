import { describe, expect, it } from "vite-plus/test";
import { inspectHttpLink } from "./http-link";

describe("recorded Link field structure", () => {
  it("keeps pagination targets unresolved, exact and ordered", () => {
    expect(inspectHttpLink('<https://api.example.invalid/items?page=2&n=9007199254740993>; rel="next", <?page=9>; rel=last')).toEqual({
      links: [
        { position: 1, target: "https://api.example.invalid/items?page=2&n=9007199254740993", relations: ["next"], parameters: [{ name: "rel", value: "next" }], duplicateParameters: [], missingRel: false },
        { position: 2, target: "?page=9", relations: ["last"], parameters: [{ name: "rel", value: "last" }], duplicateParameters: [], missingRel: false },
      ], emptyMembers: 0,
    });
  });
  it("does not split delimiters in targets or quoted strings and unquotes pairs once", () => {
    const report = inspectHttpLink(String.raw`</a,b;c?x=%2f>; REL="Next alternate"; title="a, b; \"q\" \\ end"; type="text/html"`);
    expect(report.links[0]).toMatchObject({ target: "/a,b;c?x=%2f", relations: ["Next", "alternate"], parameters: [
      { name: "REL", value: "Next alternate" }, { name: "title", value: 'a, b; "q" \\ end' }, { name: "type", value: "text/html" },
    ] });
  });
  it("retains duplicate rel without applying it, repeated hints and opaque extensions", () => {
    const link = inspectHttpLink(`</x>; rel=next; ReL=""; hreflang=en; hreflang=ja; title*=UTF-8'ja'%E7%8C%AB; x; empty=""; __proto__=safe`).links[0]!;
    expect(link.relations).toEqual(["next"]);
    expect(link.duplicateParameters).toEqual(["rel", "hreflang"]);
    expect(link.parameters.slice(4)).toEqual([{ name: "title*", value: "UTF-8'ja'%E7%8C%AB" }, { name: "x", value: null }, { name: "empty", value: "" }, { name: "__proto__", value: "safe" }]);
  });
  it("marks missing rel and counts empty list slots including an empty field", () => {
    expect(inspectHttpLink(" \t")).toEqual({ links: [], emptyMembers: 1 });
    expect(inspectHttpLink(", <>, ,")).toMatchObject({ emptyMembers: 3, links: [{ target: "", missingRel: true, relations: [] }] });
    expect(inspectHttpLink('</x>; rel="https://example.invalid/relation;a,b"').links[0]!.relations).toEqual(["https://example.invalid/relation;a,b"]);
  });
  it.each([
    'Link: </x>; rel=next', '</x>\n', '</x>\r\n </y>', '<a b>; rel=next', '<a%zz>', '<a%2>', '<a\\b>', '<a{b}>', '<a|b>',
    '<a', 'a>', '</a>garbage', '</a>;', '</a>;;x=y', '</a>; x=', '</a>; x="no', '</a>; x="bad\\', '</a>; x="bad\u0000"',
    '</a>; x="日本"', '</a>; x=one/two', '</a>; x="a" trailing', '</a>,bad', '</a><b>',
  ])("rejects malformed structure atomically: %j", value => {
    expect(() => inspectHttpLink(value)).toThrow(expect.objectContaining({ code: "LINK_SYNTAX" }));
  });
  it.each(['</x>; rel', '</x>; rel=""', '</x>; rel=" next"', '</x>; rel="next "', '</x>; rel="next\tprev"', '</x>; rel="123"', '</x>; rel="/next"'])('rejects invalid first relation syntax: %j', value => {
    expect(() => inspectHttpLink(value)).toThrow(expect.objectContaining({ code: "LINK_RELATION" }));
  });
  it("keeps anchor and active-looking values inert and unresolved", () => {
    const link = inspectHttpLink('</relative>; rel=next; anchor="https://else.invalid/base"; title="<script>alert(1)</script>"').links[0]!;
    expect(link.target).toBe("/relative");
    expect(link.parameters.at(-1)!.value).toBe("<script>alert(1)</script>");
    expect(inspectHttpLink('<javascript:alert(1)>; rel=next').links[0]!.target).toBe("javascript:alert(1)");
  });
  it("enforces raw byte bounds before trimming, including Latin-1 quoted text", () => {
    const prefix = '</x>; rel=next; title="';
    expect(inspectHttpLink(prefix + 'é'.repeat(4084) + '"').links).toHaveLength(1);
    expect(() => inspectHttpLink(prefix + 'é'.repeat(4085) + '"')).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(inspectHttpLink('</x>' + ' '.repeat(8188)).links).toHaveLength(1);
    expect(() => inspectHttpLink('</x>' + ' '.repeat(8189))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
  });
  it("enforces complete link, parameter and empty-slot bounds", () => {
    expect(inspectHttpLink(Array(32).fill('</x>; rel=next').join(',')).links).toHaveLength(32);
    expect(() => inspectHttpLink(Array(33).fill('</x>').join(','))).toThrow(expect.objectContaining({ code: "LINK_LIMIT" }));
    expect(inspectHttpLink('</x>' + ';x'.repeat(32)).links[0]!.parameters).toHaveLength(32);
    expect(() => inspectHttpLink('</x>' + ';x'.repeat(33))).toThrow(expect.objectContaining({ code: "LINK_LIMIT" }));
    expect(inspectHttpLink(','.repeat(63)).emptyMembers).toBe(64);
    expect(() => inspectHttpLink(','.repeat(64))).toThrow(expect.objectContaining({ code: "LINK_LIMIT" }));
  });
});
