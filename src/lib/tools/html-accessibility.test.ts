import { describe, expect, it } from "vite-plus/test";
import { analyzeHtmlAccessibility, HTML_ACCESSIBILITY_LIMITS } from "./html-accessibility";

const rules = async (source: string) =>
  (await analyzeHtmlAccessibility(source)).findings.map((finding) => finding.rule);

describe("bounded static HTML accessibility checks", () => {
  it("reports missing alternatives, names, titles, duplicate IDs, skipped headings, and explicit document language", async () => {
    const result = await analyzeHtmlAccessibility(`<!doctype html><html><body>
      <h1>Page</h1><h3>Skipped</h3><img src="/photo.png"><img alt="" src="/decorative.png">
      <input id="email"><input type="image" src="/submit.png">
      <button></button><a href="/next"></a><iframe></iframe>
      <div id="same"></div><div id="same"></div>
    </body></html>`);

    expect(result.findings.map((finding) => finding.rule)).toEqual([
      "missing-document-language",
      "missing-image-alt",
      "missing-control-name",
      "image-button-alt",
      "missing-interactive-name",
      "missing-interactive-name",
      "missing-iframe-title",
      "duplicate-id",
      "heading-level-skip",
    ]);
    expect(result.findings.find((finding) => finding.rule === "duplicate-id")?.detail).toBe("2");
    expect(result.incomplete).toBe(false);
  });

  it("accepts empty decorative alt, visible text, labels, ARIA names, and hidden labelled-by text", async () => {
    expect(await rules(`<h1>Page</h1><img alt=""><button>Save</button>
      <button><img alt="Archive"></button><a href="/next">Next</a>
      <label for="email">Email</label><input id="email">
      <label><input type="checkbox">Accept</label>
      <input aria-label="Search"><button aria-labelledby="hidden-name"></button>
      <input type="image" aria-label="Send">
      <span id="hidden-name" hidden>Close</span><span id="empty-name"></span>
      <iframe title="Preview"></iframe>
      <button aria-labelledby="missing-name" aria-label="Close"></button>
      <button aria-labelledby="missing-name">Save</button>
      <label for="labelled-button">Save</label><button id="labelled-button"></button>
      <button aria-labelledby="empty-name" aria-label="Close"></button>`)).toEqual([]);
    expect(await rules(`<span id="empty-name"></span><button aria-labelledby="empty-name"></button>`))
      .toContain("missing-interactive-name");
  });

  it("flags whitespace-only image alternatives and accepts title-based names", async () => {
    const result = await analyzeHtmlAccessibility(`<img alt="   "><img alt="">
      <button title="Close"></button><a href="/" title="Home"></a><input title="Email">`);
    expect(result.findings.map((finding) => finding.rule)).toEqual(["missing-image-alt"]);
  });

  it("does not treat label associations as names for links", async () => {
    expect(await rules(`<label for="link">Link text</label><a id="link" href="/next"></a>`))
      .toContain("missing-interactive-name");
  });

  it("checks document language only when the source explicitly contains an html root", async () => {
    expect(await rules(`<main><h1>Fragment</h1></main>`)).toEqual([]);
    expect(await rules(`<html lang="ja"><body><h1>Page</h1></body></html>`)).toEqual([]);
    expect(await rules(`<html lang=""><body><h1>Page</h1></body></html>`)).toContain("missing-document-language");
    expect(await rules(`<!doctype html><!-- preamble --><html data-note="a > b" lang="en"><h1>Page</h1></html>`)).toEqual([]);
    expect(await rules(`<!-- preamble --><html data-note="a > b"><h1>Page</h1></html>`))
      .toContain("missing-document-language");
  });

  it("keeps markup inert and rejects oversized input without truncating", async () => {
    (globalThis as typeof globalThis & { __htmlA11yExecuted?: number }).__htmlA11yExecuted = 0;
    await analyzeHtmlAccessibility(`<img src="https://example.invalid/pixel.png" onerror="globalThis.__htmlA11yExecuted++"><script>globalThis.__htmlA11yExecuted++</script>`);
    expect((globalThis as typeof globalThis & { __htmlA11yExecuted?: number }).__htmlA11yExecuted).toBe(0);
    await expect(analyzeHtmlAccessibility("日".repeat(HTML_ACCESSIBILITY_LIMITS.inputBytes)))
      .rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
  });

  it("labels both node and finding caps as incomplete", async () => {
    const result = await analyzeHtmlAccessibility("<img>".repeat(HTML_ACCESSIBILITY_LIMITS.elements + 1));
    expect(result.scannedElements).toBe(HTML_ACCESSIBILITY_LIMITS.elements);
    expect(result.totalElements).toBe(HTML_ACCESSIBILITY_LIMITS.elements + 1);
    expect(result.findings).toHaveLength(HTML_ACCESSIBILITY_LIMITS.findings);
    expect(result.omittedFindings).toBe(HTML_ACCESSIBILITY_LIMITS.elements - HTML_ACCESSIBILITY_LIMITS.findings);
    expect(result.incomplete).toBe(true);
  });

  it("checks cancellation between bounded scan chunks", async () => {
    const controller = new AbortController();
    const pending = analyzeHtmlAccessibility("<div></div>".repeat(HTML_ACCESSIBILITY_LIMITS.chunkSize + 1), controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrowError("CANCELLED");
  });
});
