import { ToolError, assertInputSize } from "./errors";

export const HTML_ACCESSIBILITY_LIMITS = {
  inputBytes: 64 * 1024,
  elements: 10_000,
  findings: 500,
  chunkSize: 400,
  deferredCharacters: 2_048,
} as const;

const LABELABLE_ELEMENTS = new Set([
  "button", "input", "meter", "output", "progress", "select", "textarea",
]);

export type HtmlAccessibilityRule =
  | "missing-document-language"
  | "missing-image-alt"
  | "image-button-alt"
  | "missing-control-name"
  | "missing-interactive-name"
  | "missing-iframe-title"
  | "duplicate-id"
  | "heading-level-skip";

export interface HtmlAccessibilityFinding {
  rule: HtmlAccessibilityRule;
  location: string;
  detail: string;
}

export const HTML_ACCESSIBILITY_REPAIRS = {
  "missing-document-language": '<html lang="en">…</html>',
  "missing-image-alt": '<img src="image.png" alt="Describe the image">',
  "image-button-alt": '<input type="image" alt="Submit form">',
  "missing-control-name": '<label for="email">Email</label><input id="email">',
  "missing-interactive-name": '<button>Save</button>',
  "missing-iframe-title": '<iframe title="Map of the area"></iframe>',
  "duplicate-id": '<div id="unique-section">…</div>',
  "heading-level-skip": "<h2>Section</h2>",
} satisfies Record<HtmlAccessibilityRule, string>;

export interface HtmlAccessibilityResult {
  findings: HtmlAccessibilityFinding[];
  scannedElements: number;
  totalElements: number;
  omittedFindings: number;
  incomplete: boolean;
}

function isHidden(element: Element): boolean {
  for (let current: Element | null = element; current; current = current.parentElement) {
    if (current.hasAttribute("hidden") || current.getAttribute("aria-hidden")?.trim().toLowerCase() === "true")
      return true;
    const style = current.getAttribute("style") ?? "";
    if (/(?:^|;)\s*display\s*:\s*none\s*(?:!important\s*)?(?:;|$)/i.test(style) ||
        /(?:^|;)\s*visibility\s*:\s*(?:hidden|collapse)\s*(?:!important\s*)?(?:;|$)/i.test(style)) return true;
  }
  return false;
}

function compact(value: string, max = 80): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > max ? normalized.slice(0, max - 1) + "…" : normalized;
}

function locationOf(element: Element): string {
  const id = element.getAttribute("id");
  return `<${element.localName}>${id ? ` #${compact(id)}` : ""}`;
}

function textAlternative(node: Node, includeHiddenRoot = false): string {
  const rootIsHidden = node instanceof Element && isHidden(node);
  const pending: Array<{ node: Node; allowHidden: boolean }> = [{
    node,
    allowHidden: includeHiddenRoot && rootIsHidden,
  }];
  const parts: string[] = [];
  let visited = 0;
  let length = 0;
  while (pending.length && visited < 2_000 && length < 4_096) {
    const current = pending.pop()!;
    visited++;
    if (current.node.nodeType === Node.TEXT_NODE) {
      const value = current.node.nodeValue ?? "";
      parts.push(value.slice(0, 4_096 - length));
      length += value.length;
      continue;
    }
    if (!(current.node instanceof Element)) continue;
    const element = current.node;
    if (!current.allowHidden && isHidden(element)) continue;

    const ariaLabel = element.getAttribute("aria-label")?.trim();
    if (ariaLabel) {
      parts.push(ariaLabel.slice(0, 4_096 - length));
      length += ariaLabel.length;
      continue;
    }
    if (element.localName === "img") {
      const alt = element.getAttribute("alt") ?? "";
      parts.push(alt.slice(0, 4_096 - length));
      length += alt.length;
      continue;
    }
    if (element.localName === "input") {
      const type = (element.getAttribute("type") ?? "text").toLowerCase();
      if (["button", "submit", "reset"].includes(type)) {
        const value = element.getAttribute("value") ?? "";
        parts.push(value.slice(0, 4_096 - length));
        length += value.length;
        continue;
      }
    }
    if (element.localName === "svg") {
      const title = Array.from(element.children).find((child) => child.localName === "title");
      if (title) {
        pending.push({ node: title, allowHidden: false });
        continue;
      }
    }
    const children = Array.from(element.childNodes);
    for (let index = children.length - 1; index >= 0; index--)
      pending.push({ node: children[index]!, allowHidden: rootIsHidden && includeHiddenRoot });
  }
  return parts.join("").trim();
}

function referencedName(element: Element, byId: ReadonlyMap<string, Element>): string {
  const ids = element.getAttribute("aria-labelledby")?.trim().split(/\s+/).filter(Boolean);
  if (!ids?.length) return "";
  return ids.map((id) => {
    const target = byId.get(id);
    return target ? textAlternative(target, true).trim() : "";
  }).filter(Boolean).join(" ").trim();
}

function hasAccessibleName(
  element: Element,
  byId: ReadonlyMap<string, Element>,
  labelsById: ReadonlyMap<string, Element[]>,
): boolean {
  if (referencedName(element, byId)) return true;
  if (element.getAttribute("aria-label")?.trim()) return true;
  if (element.getAttribute("title")?.trim()) return true;

  if (element.localName === "input") {
    const type = (element.getAttribute("type") ?? "text").toLowerCase();
    if (["button", "submit", "reset"].includes(type) && element.getAttribute("value")?.trim()) return true;
  }

  if (LABELABLE_ELEMENTS.has(element.localName)) {
    const id = element.getAttribute("id");
    if (id && labelsById.get(id)?.some((label) => textAlternative(label).trim()))
      return true;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (parent.localName === "label" && textAlternative(parent).trim()) return true;
    }
  }
  return Boolean(textAlternative(element).trim());
}

function documentLanguageFinding(source: string): HtmlAccessibilityFinding | null {
  let start = source.charCodeAt(0) === 0xfeff ? 1 : 0;
  const skipWhitespace = () => {
    while (/\s/.test(source[start] ?? "")) start++;
  };
  const tagEnd = (from: number) => {
    let quote = "";
    for (let index = from; index < source.length; index++) {
      const char = source[index]!;
      if (quote) {
        if (char === quote) quote = "";
      } else if (char === "'" || char === '"') quote = char;
      else if (char === ">") return index;
    }
    return -1;
  };

  // Allow comments and a doctype before the explicit document root.
  for (;;) {
    skipWhitespace();
    if (source.startsWith("<!--", start)) {
      const commentEnd = source.indexOf("-->", start + 4);
      if (commentEnd < 0) return null;
      start = commentEnd + 3;
    } else if (/^<!doctype\b/i.test(source.slice(start))) {
      const end = tagEnd(start + 2);
      if (end < 0) return null;
      start = end + 1;
    } else break;
  }
  if (!/^<html(?:\s|\/?>)/i.test(source.slice(start))) return null;
  const nameEnd = start + 5;
  const end = tagEnd(nameEnd);
  if (end < 0) return null;
  const attributes = source.slice(nameEnd, end);
  const lang = /(?:^|\s)lang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes);
  return lang && (lang[1] ?? lang[2] ?? lang[3] ?? "").trim()
    ? null
    : { rule: "missing-document-language", location: "<html>", detail: "" };
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}

/**
 * A bounded static heuristic audit. Markup lives only in a detached template,
 * whose contents are never inserted into the page or executed.
 */
export async function analyzeHtmlAccessibility(
  source: string,
  signal?: AbortSignal,
): Promise<HtmlAccessibilityResult> {
  assertInputSize(source, HTML_ACCESSIBILITY_LIMITS.inputBytes);
  if (signal?.aborted) throw new ToolError("CANCELLED");

  const template = document.createElement("template");
  template.innerHTML = source;
  const all = Array.from(template.content.querySelectorAll("*"));
  const scan = all.slice(0, HTML_ACCESSIBILITY_LIMITS.elements);
  const byId = new Map<string, Element>();
  const duplicates = new Map<string, number>();
  const labelsById = new Map<string, Element[]>();
  for (const element of all) {
    const id = element.getAttribute("id");
    if (id) {
      if (byId.has(id)) duplicates.set(id, (duplicates.get(id) ?? 1) + 1);
      else byId.set(id, element);
    }
    if (element.localName === "label") {
      const target = element.getAttribute("for");
      if (target) labelsById.set(target, [...(labelsById.get(target) ?? []), element]);
    }
  }

  const findings: HtmlAccessibilityFinding[] = [];
  let omittedFindings = 0;
  const add = (finding: HtmlAccessibilityFinding) => {
    if (findings.length < HTML_ACCESSIBILITY_LIMITS.findings) findings.push(finding);
    else omittedFindings++;
  };
  const languageFinding = documentLanguageFinding(source);
  if (languageFinding) add(languageFinding);
  const headingSequence: Array<{ level: number; element: Element }> = [];

  for (let index = 0; index < scan.length; index++) {
    if (signal?.aborted) throw new ToolError("CANCELLED");
    const element = scan[index]!;
    const tag = element.localName;
    const location = locationOf(element);

    if (tag === "img" && !isHidden(element)) {
      const alt = element.getAttribute("alt");
      if (alt === null || (alt.length > 0 && !alt.trim()))
        add({ rule: "missing-image-alt", location, detail: "" });
    }
    if (tag === "input" && (element.getAttribute("type") ?? "").toLowerCase() === "image" &&
        !isHidden(element) && !element.getAttribute("alt")?.trim() &&
        !hasAccessibleName(element, byId, labelsById))
      add({ rule: "image-button-alt", location, detail: "" });
    if ((tag === "input" || tag === "select" || tag === "textarea") &&
        !["hidden", "button", "submit", "reset", "image"].includes((element.getAttribute("type") ?? "").toLowerCase()) &&
        !isHidden(element)) {
      const labels = labelsById.get(element.getAttribute("id") ?? "") ?? [];
      const explicitLabel = labels.some((label) => textAlternative(label).trim());
      let wrappedLabel = false;
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (parent.localName === "label" && textAlternative(parent).trim()) wrappedLabel = true;
      }
      if (!explicitLabel && !wrappedLabel && !referencedName(element, byId) &&
          !element.getAttribute("aria-label")?.trim() && !element.getAttribute("title")?.trim())
        add({ rule: "missing-control-name", location, detail: "" });
    }
    if (tag === "button" || (tag === "a" && element.hasAttribute("href"))) {
      if (!isHidden(element) && !hasAccessibleName(element, byId, labelsById))
        add({ rule: "missing-interactive-name", location, detail: "" });
    }
    if (tag === "iframe" && !isHidden(element) && !element.getAttribute("title")?.trim())
      add({ rule: "missing-iframe-title", location, detail: "" });

    const heading = /^h([1-6])$/.exec(tag);
    if (heading && !isHidden(element)) headingSequence.push({ level: Number(heading[1]), element });

    if ((index + 1) % HTML_ACCESSIBILITY_LIMITS.chunkSize === 0 && index + 1 < scan.length)
      await yieldToBrowser();
  }

  for (const [id, count] of duplicates)
    add({ rule: "duplicate-id", location: `#${compact(id)}`, detail: String(count) });
  for (let index = 1; index < headingSequence.length; index++) {
    const previous = headingSequence[index - 1]!;
    const current = headingSequence[index]!;
    if (current.level > previous.level + 1)
      add({ rule: "heading-level-skip", location: locationOf(current.element), detail: `h${previous.level} → h${current.level}` });
  }

  const scannedElements = scan.length;
  return {
    findings,
    scannedElements,
    totalElements: all.length,
    omittedFindings,
    incomplete: all.length > scannedElements || omittedFindings > 0,
  };
}
