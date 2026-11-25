import { defaultTreeAdapter, html, parse, type DefaultTreeAdapterTypes } from "parse5";
import { assertInputSize, ToolError } from "./errors";

export const HREFLANG_LIMITS = {
  headBytes: 64 * 1024,
  urlBytes: 2048,
  languageBytes: 64,
  linksPerHead: 64,
  instantCharacters: 4096,
} as const;

export const HREFLANG_PAGES = ["a", "b"] as const;
type PageId = typeof HREFLANG_PAGES[number];
export type HreflangPairInput = Record<PageId, { url: string; head: string }>;

type LinkIssue = "language" | "relative" | "url" | "media" | "duplicate" | "conflict" | "disagreement";
interface HreflangLink {
  line: number;
  language: string;
  href: string;
  destination: "self" | "peer" | "unchecked" | null;
  issues: LinkIssue[];
}
interface HreflangPageReport {
  url: string;
  links: HreflangLink[];
  selfLanguages: string[];
  peerLanguages: string[];
  languageMismatch: boolean;
  parseErrors: number;
  firstParseErrorLine: number | null;
}
export interface HreflangPairReport {
  pages: Record<PageId, HreflangPageReport>;
  hasIssues: boolean;
  hasUncheckedTargets: boolean;
}

const trimHtmlSpace = (value: string) => value.replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, "");
const asciiSpace = /[\t\n\f\r ]+/;
const asciiLanguage = /^(?:[a-z]{2}(?:-[a-z]{4})?(?:-[a-z]{2})?|x-default)$/i;
const encoder = new TextEncoder();
const absoluteScheme = /^[a-z][a-z\d+.-]*:/i;

function parseUrl(raw: string): string | null {
  const value = trimHtmlSpace(raw);
  if (!/^https?:\/\/[^/\\?#]/i.test(value) || /[\\\s]/u.test(value) ||
    [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ||
    /%(?![a-f\d]{2})/i.test(value)) return null;
  // An absolute URL needs no base. Returning its serialized form preserves
  // distinct trailing slashes, query strings, and fragments on non-root paths.
  const authority = value.slice(value.indexOf("://") + 3).split(/[/?#]/, 1)[0];
  if (authority.includes("@")) return null;
  try {
    return new URL(value).href;
  } catch {
    return null;
  }
}

interface Mapping {
  href: string;
  link: HreflangLink;
}

function inspectHead(source: string, url: string, otherUrl: string) {
  let parseErrors = 0;
  let firstParseErrorLine: number | null = null;
  let firstAbandonedHeadOffset = Infinity;
  const document = parse(source, {
    scriptingEnabled: true,
    sourceCodeLocationInfo: true,
    onParseError(error) {
      if (error.code === "missing-doctype") return;
      parseErrors++;
      firstParseErrorLine ??= error.startLine;
      if (error.code === "abandoned-head-element-child")
        firstAbandonedHeadOffset = Math.min(firstAbandonedHeadOffset, error.startOffset);
    },
  });
  const documentElement = document.childNodes.find(
    (node): node is DefaultTreeAdapterTypes.Element => defaultTreeAdapter.isElementNode(node) && node.tagName === "html",
  );
  const head = documentElement?.childNodes.find(
    (node): node is DefaultTreeAdapterTypes.Element => defaultTreeAdapter.isElementNode(node) && node.tagName === "head",
  );
  const cutoff = Math.min(firstAbandonedHeadOffset, head?.sourceCodeLocation?.endTag?.startOffset ?? Infinity);
  const links: HreflangLink[] = [];
  const mappings = new Map<string, Mapping[]>();
  for (const node of head?.childNodes ?? []) {
    if (!defaultTreeAdapter.isElementNode(node) || node.namespaceURI !== html.NS.HTML ||
      node.tagName !== "link" || !node.sourceCodeLocation || node.sourceCodeLocation.startOffset >= cutoff) continue;
    const attributes = new Map(node.attrs.map(attribute => [attribute.name, attribute.value]));
    const rawLanguage = attributes.get("hreflang");
    if (rawLanguage === undefined || !attributes.get("rel")?.toLowerCase().split(asciiSpace).includes("alternate")) continue;
    if (links.length === HREFLANG_LIMITS.linksPerHead) throw new ToolError("HREFLANG_LINK_LIMIT");
    const href = attributes.get("href") ?? "";
    if (encoder.encode(rawLanguage).byteLength > HREFLANG_LIMITS.languageBytes ||
      encoder.encode(href).byteLength > HREFLANG_LIMITS.urlBytes) throw new ToolError("HREFLANG_ATTRIBUTE_LIMIT");
    const language = rawLanguage.toLowerCase();
    const target = parseUrl(href);
    const issues: LinkIssue[] = [];
    if (!asciiLanguage.test(rawLanguage)) issues.push("language");
    if (!target) issues.push(href.trim() && !absoluteScheme.test(trimHtmlSpace(href)) ? "relative" : "url");
    if (attributes.has("media")) issues.push("media");
    const destination = target === null ? null : target === url ? "self" : target === otherUrl ? "peer" : "unchecked";
    const link: HreflangLink = { line: node.sourceCodeLocation.startLine, language: rawLanguage, href, destination, issues };
    links.push(link);

    if (target && issues.length === 0) {
      const group = mappings.get(language) ?? [];
      group.push({ href: target, link });
      mappings.set(language, group);
    }
  }
  for (const group of mappings.values()) {
    const counts = new Map<string, number>();
    for (const mapping of group) counts.set(mapping.href, (counts.get(mapping.href) ?? 0) + 1);
    for (const { href, link } of group) {
      if ((counts.get(href) ?? 0) > 1) link.issues.push("duplicate");
      if (counts.size > 1) link.issues.push("conflict");
    }
  }
  const report: HreflangPageReport = {
    url, links, selfLanguages: [], peerLanguages: [], languageMismatch: false, parseErrors, firstParseErrorLine,
  };
  for (const [language, group] of mappings) {
    if (language === "x-default" || group[0].link.issues.includes("conflict")) continue;
    if (group[0].href === url) report.selfLanguages.push(language);
    if (group[0].href === otherUrl) report.peerLanguages.push(language);
  }
  return { report, mappings };
}

export function inspectHreflangPair(input: HreflangPairInput): HreflangPairReport {
  for (const page of HREFLANG_PAGES) {
    assertInputSize(input[page].url, HREFLANG_LIMITS.urlBytes);
    assertInputSize(input[page].head, HREFLANG_LIMITS.headBytes);
  }
  if (HREFLANG_PAGES.some(page => !input[page].head.trim())) throw new ToolError("HREFLANG_REQUIRED");
  const aUrl = parseUrl(input.a.url);
  const bUrl = parseUrl(input.b.url);
  if (!aUrl) throw new ToolError("HREFLANG_PAGE_A_URL");
  if (!bUrl) throw new ToolError("HREFLANG_PAGE_B_URL");
  if (aUrl === bUrl) throw new ToolError("HREFLANG_SAME_PAGE");
  const a = inspectHead(input.a.head, aUrl, bUrl);
  const b = inspectHead(input.b.head, bUrl, aUrl);

  for (const [language, aMappings] of a.mappings) {
    const bMappings = b.mappings.get(language);
    if (!bMappings || aMappings[0].href === bMappings[0].href ||
      aMappings[0].link.issues.includes("conflict") || bMappings[0].link.issues.includes("conflict")) continue;
    for (const { link } of [...aMappings, ...bMappings]) link.issues.push("disagreement");
  }
  const pages = { a: a.report, b: b.report };
  for (const [page, other] of [[pages.a, pages.b], [pages.b, pages.a]]) {
    const { peerLanguages } = page;
    const { selfLanguages } = other;
    page.languageMismatch = peerLanguages.length > 0 && selfLanguages.length > 0 &&
      (selfLanguages.length !== peerLanguages.length || selfLanguages.some(language => !peerLanguages.includes(language)));
  }
  return {
    pages,
    hasIssues: Object.values(pages).some(page => page.parseErrors > 0 || page.languageMismatch ||
      page.selfLanguages.length === 0 || page.peerLanguages.length === 0 || page.links.some(link => link.issues.length > 0)),
    hasUncheckedTargets: Object.values(pages).some(page => page.links.some(link => link.destination === "unchecked")),
  };
}
