import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeStaticPages, pages, BASE_PATH } from "./static-pages.ts";
import { verifyStaticPages } from "./verify-static-pages.mjs";

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), "army-knife-pages-"));
  try {
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, "index.html"),
      '<!doctype html><html lang="ja"><head><meta name="description" content="original" /><title>original</title></head><body><div id="app"></div></body></html>',
    );
    writeStaticPages(root);
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
const pageFile = (root) => join(root, pages[1].path.slice(BASE_PATH.length), "index.html");
test("all catalog/language documents and their reciprocal links verify", () =>
  fixture((root) => {
    const result = verifyStaticPages(root);
    assert.equal(result.ok, true, result.errors.join("\n"));
    assert.equal(result.pages, pages.length);
  }));
test("missing document cannot pass via sitemap or a hash route", () =>
  fixture((root) => {
    rmSync(pageFile(root));
    const result = verifyStaticPages(root);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /real file|ENOENT/);
  }));
test("wrong canonical and nonreciprocal language URL are rejected", () =>
  fixture((root) => {
    const file = pageFile(root);
    writeFileSync(
      file,
      readFileSync(file, "utf8")
        .replace('rel="canonical"', 'rel="missing-canonical"')
        .replace('hreflang="ko"', 'hreflang="unknown"'),
    );
    assert.match(verifyStaticPages(root).errors.join("\n"), /canonical.*real document URL/);
    assert.match(verifyStaticPages(root).errors.join("\n"), /hreflang ko/);
  }));
test("missing sitemap URL and mount-only explanation are rejected", () =>
  fixture((root) => {
    const sitemap = join(root, "sitemap.xml");
    writeFileSync(sitemap, readFileSync(sitemap, "utf8").replace(/<url>[\s\S]*?<\/url>/, ""));
    const file = pageFile(root);
    writeFileSync(
      file,
      readFileSync(file, "utf8")
        .replace('<div id="app"></div>', '<div id="app">')
        .replace("</article>", "</article></div>"),
    );
    const result = verifyStaticPages(root);
    assert.match(result.errors.join("\n"), /Sitemap/);
    assert.match(result.errors.join("\n"), /survive Vue mounting/);
  }));
