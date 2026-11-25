import { describe, expect, it } from "vite-plus/test";
import { HREFLANG_LIMITS, inspectHreflangPair, type HreflangPairInput } from "./hreflang";
import { HREFLANG_SAMPLE } from "./hreflang-sample";

const { a, b } = HREFLANG_SAMPLE;
const third = "https://example.test/ko/";
const link = (language: string, href: string) => `<link rel="alternate" hreflang="${language}" href="${href.replaceAll("&", "&amp;")}">`;
const pair = (aHead: string, bHead = b.head): HreflangPairInput => ({ a: { ...a, head: aHead }, b: { ...b, head: bHead } });
const issue = (code: string) => expect.objectContaining({ code });

describe("HTML hreflang pair", () => {
  it("matches two absolute page URLs across domains, permits a shared fallback, and leaves third pages unchecked", () => {
    const report = inspectHreflangPair(HREFLANG_SAMPLE);
    expect(report.hasIssues).toBe(false);
    expect(report.hasUncheckedTargets).toBe(true);
    expect(report.pages.a.selfLanguages).toEqual(["ja"]);
    expect(report.pages.a.peerLanguages).toEqual(["en"]);
    expect(report.pages.b.selfLanguages).toEqual(["en"]);
    expect(report.pages.b.peerLanguages).toEqual(["ja"]);
    expect(report.pages.a.links).toEqual([
      { line: 2, language: "ja", href: a.url, destination: "self", issues: [] },
      { line: 3, language: "en", href: b.url, destination: "peer", issues: [] },
      { line: 4, language: "x-default", href: b.url, destination: "peer", issues: [] },
      { line: 5, language: "ko", href: third, destination: "unchecked", issues: [] },
    ]);
  });

  it("only reads actual direct head link elements and decodes attributes", () => {
    const head = [
      "<!doctype html><html><head>",
      `<!-- ${link("es", a.url)} -->`,
      `<title>${link("pt", a.url)}</title>`,
      `<script type="text/plain">${link("ru", a.url)}</script>`,
      `<style>/* ${link("fr", a.url)} */</style>`,
      `<template>${link("ko", a.url)}</template>`,
      `<noscript>${link("it", a.url)}</noscript>`,
      `<meta content='${link("de", a.url)}'>`,
      '<LINK rel="alternate stylesheetish" hreflang="J&#65;" href=https://example.test/ja/>',
      link("en", b.url),
      '<link rel="alternate" type="application/rss+xml" href="https://example.test/feed">',
      '<link rel="alternateish" hreflang="ko" href="https://example.test/ko">',
      `</head><body>${link("sv", a.url)}</body></html>`,
    ].join("\r\n");
    const report = inspectHreflangPair(pair(head));
    expect(report.hasIssues).toBe(false);
    expect(report.pages.a.links.map(row => [row.line, row.language, row.href])).toEqual([
      [9, "JA", a.url], [10, "en", b.url],
    ]);
  });

  it.each([
    "<head>SELF</head>",
    "SELF</head>",
  ])("discards links that HTML recovery would relocate into the head: %s", (head) => {
    const report = inspectHreflangPair(pair(head.replace("SELF", link("ja", a.url)) + link("en", b.url)));
    expect(report.hasIssues).toBe(true);
    expect(report.pages.a.parseErrors).toBeGreaterThan(0);
    expect(report.pages.a.links.map(row => row.language)).toEqual(["ja"]);
    expect(report.pages.a.peerLanguages).toEqual([]);
  });


  it.each([
    ["<head>", "</head><body class=a class=b>"],
    ["<head>", "<body class=a class=b>"],
    ["", "<main class=a class=b>"],
    ["", "</head><main class=a class=b>"],
    ["", '</head><link rel="stylesheet" href="https://example.test/style.css"><main class=a class=b>'],
  ])("ignores unrelated errors outside explicit or implied head boundaries (%s %s)", (start, end) => {
    const report = inspectHreflangPair(pair(`<!doctype html><html>${start}${b.head}${end}Synthetic text</html>`));
    expect(report.hasIssues).toBe(false);
    expect(report.pages.a).toMatchObject({ parseErrors: 0, firstParseErrorLine: null, selfLanguages: ["ja"], peerLanguages: ["en"] });
  });

  it("distinguishes relocated alternate declarations from relocated styles", () => {
    const report = inspectHreflangPair(pair([
      "<!doctype html><head>", b.head, "</head>",
      '<style>body { margin: 0; }</style>',
      link("fr", "https://example.test/fr/"),
      "<body class=a class=b>Synthetic text</body>",
    ].join("\n")));
    expect(report.hasIssues).toBe(true);
    expect(report.pages.a).toMatchObject({ parseErrors: 1, firstParseErrorLine: 8, selfLanguages: ["ja"], peerLanguages: ["en"] });
    expect(report.pages.a.links.map(row => row.language)).toEqual(["ja", "en", "x-default", "ko"]);
  });

  it("strips one leading paste BOM for parsing and still charges its UTF-8 bytes", () => {
    const report = inspectHreflangPair(pair("\uFEFF" + b.head));
    expect(report.hasIssues).toBe(false);
    expect(report.pages.a.links[0].line).toBe(1);
    const head = "<!--" + "a".repeat(HREFLANG_LIMITS.headBytes - 7) + "-->";
    expect(inspectHreflangPair(pair(head)).pages.a.parseErrors).toBe(0);
    expect(() => inspectHreflangPair(pair("\uFEFF" + head))).toThrow(issue("INPUT_TOO_LARGE"));
  });

  it("excludes stylesheet and feed alternates from evidence while allowing typed HTML alternatives", () => {
    const report = inspectHreflangPair(pair([
      link("ja", a.url).replace('rel="alternate"', 'rel="alternate StyleSheet"'),
      link("ja", a.url).replace('<link ', '<link type=" Application/Rss+Xml; charset=UTF-8 " '),
      link("en", b.url).replace('<link ', '<link type="application/atom+xml" '),
    ].join("\n")));
    expect(report.hasIssues).toBe(true);
    expect(report.pages.a.selfLanguages).toEqual([]);
    expect(report.pages.a.peerLanguages).toEqual([]);
    expect(report.pages.a.links.map(row => row.issues)).toEqual([["representation"], ["representation"], ["representation"]]);

    const typed = [link("ja", a.url).replace('<link ', '<link type="text/html; charset=utf-8" '),
      link("en", b.url).replace('<link ', '<link type="application/xhtml+xml" ')].join("\n");
    expect(inspectHreflangPair(pair(typed)).hasIssues).toBe(false);
  });

  it("keeps an HTML recovery warning even when the recorded pair behaves reciprocally", () => {
    const report = inspectHreflangPair(pair(b.head + '\n<link href="unfinished'));
    expect(report.hasIssues).toBe(true);
    expect(report.pages.a).toMatchObject({ parseErrors: 1, firstParseErrorLine: 5, selfLanguages: ["ja"], peerLanguages: ["en"] });
  });

  it("requires real self links and a language-specific return link", () => {
    const report = inspectHreflangPair(pair(
      [link("x-default", a.url), link("en", b.url)].join("\n"),
      [link("en", b.url), link("x-default", a.url)].join("\n"),
    ));
    expect(report.hasIssues).toBe(true);
    expect(report.pages.a).toMatchObject({ selfLanguages: [], peerLanguages: ["en"], languageMismatch: false });
    expect(report.pages.b).toMatchObject({ selfLanguages: ["en"], peerLanguages: [], languageMismatch: false });
  });

  it("checks both directions against the other page’s self labels, including script and region", () => {
    const report = inspectHreflangPair(pair(
      [link("ja", a.url), link("zh-Hant-TW", b.url), link("zh-GB", b.url)].join("\n"),
      [link("ja", a.url), link("zh-hant-tw", b.url), link("zh-TW", b.url)].join("\n"),
    ));
    expect(report.hasIssues).toBe(true);
    expect(report.pages.a).toMatchObject({ languageMismatch: true, peerLanguages: ["zh-hant-tw", "zh-gb"] });
    expect(report.pages.b).toMatchObject({ languageMismatch: false, selfLanguages: ["zh-hant-tw", "zh-tw"] });
  });

  it("shows duplicates, same-head conflicts, and differing destinations between heads", () => {
    const report = inspectHreflangPair(pair(
      [link("ja", a.url), link("JA", "https://EXAMPLE.TEST:443/ja/"), link("ja", third), link("en", third)].join("\n"),
    ));
    expect(report.hasIssues).toBe(true);
    expect(report.pages.a.selfLanguages).toEqual([]);
    expect(report.pages.a.links.map(row => row.issues)).toEqual([
      ["duplicate", "conflict"], ["duplicate", "conflict"], ["conflict"], ["disagreement"],
    ]);
    expect(report.pages.b.links[1].issues).toEqual(["disagreement"]);
  });

  it("recognizes relative, missing and unsupported URLs, malformed language hints, and alternate media", () => {
    const report = inspectHreflangPair(pair([
      link("ja", "/ja/"), link("en", "//en.example.test/"), link("ko", "ftp://example.test/ko"),
      link("fr", "https:///example.test/fr"), link("de", "https://example.test/%bad%"),
      '<link rel="alternate" hreflang="zh_TW">',
      link("es-419", "https://example.test/es"), link("", a.url),
      '<link rel="alternate" hreflang="ja" href="https://example.test/ja/" media="screen">',
    ].join("\n")));
    expect(report.pages.a.links.map(row => row.issues)).toEqual([
      ["relative"], ["relative"], ["url"], ["url"], ["url"], ["language", "url"], ["language"], ["language"], ["media"],
    ]);
    expect(report.pages.a.selfLanguages).toEqual([]);
  });

  it("preserves path case, non-root trailing slashes, ordered query and fragment differences", () => {
    const report = inspectHreflangPair(pair([
      link("ja", a.url.slice(0, -1)), link("ja-JP", a.url.replace("/ja/", "/JA/")),
      link("ja-Latn", a.url + "#example"), link("en", b.url.replace("edition=2&view=full", "view=full&edition=2")),
      link("en-GB", b.url + "&mode=example"), link("en-US", b.url.replace("edition=2", "edition=3")),
    ].join("\n")));
    expect(report.hasIssues).toBe(true);
    expect(report.pages.a.links.every(row => row.destination === "unchecked")).toBe(true);
  });

  it("rejects invalid, missing, and identical canonicalized page URLs without a report", () => {
    expect(() => inspectHreflangPair({ a: { ...a, url: "/ja/" }, b })).toThrow(issue("HREFLANG_PAGE_A_URL"));
    expect(() => inspectHreflangPair({ a, b: { ...b, url: "https://name@example.test/" } })).toThrow(issue("HREFLANG_PAGE_B_URL"));
    expect(() => inspectHreflangPair({ a, b: { ...b, url: "https://EXAMPLE.TEST:443/ja/" } })).toThrow(issue("HREFLANG_SAME_PAGE"));
    expect(() => inspectHreflangPair(pair("\r\n"))).toThrow(issue("HREFLANG_REQUIRED"));
  });

  it("accepts exact UTF-8 limits, rejecting raw CRLF and decoded attribute overflow atomically", () => {
    const head = "<!--" + "é".repeat((HREFLANG_LIMITS.headBytes - 8) / 2) + " -->";
    expect(inspectHreflangPair(pair(head)).pages.a.parseErrors).toBe(0);
    expect(() => inspectHreflangPair(pair(head + "\r\n"))).toThrow(issue("INPUT_TOO_LARGE"));
    const prefix = "https://example.test/";
    const target = prefix + "é".repeat((HREFLANG_LIMITS.urlBytes - prefix.length - 1) / 2) + "a";
    expect(inspectHreflangPair({ a: { ...a, url: target }, b }).pages.a.url).toContain("%C3%A9");
    expect(() => inspectHreflangPair({ a: { ...a, url: target + "x" }, b })).toThrow(issue("INPUT_TOO_LARGE"));
    expect(inspectHreflangPair(pair(link("a".repeat(HREFLANG_LIMITS.languageBytes), target))).pages.a.links).toHaveLength(1);
    expect(() => inspectHreflangPair(pair(link("é".repeat(33), a.url)))).toThrow(issue("HREFLANG_ATTRIBUTE_LIMIT"));
    expect(() => inspectHreflangPair(pair(link("ja", target + "x")))).toThrow(issue("HREFLANG_ATTRIBUTE_LIMIT"));
  });

  it("reports all declarations up to the cap and rejects one additional declaration instead of truncating", () => {
    const head = link("ja", a.url).repeat(HREFLANG_LIMITS.linksPerHead);
    expect(inspectHreflangPair(pair(head)).pages.a.links).toHaveLength(HREFLANG_LIMITS.linksPerHead);
    expect(() => inspectHreflangPair(pair(head + link("en", b.url)))).toThrow(issue("HREFLANG_LINK_LIMIT"));
  });
});
