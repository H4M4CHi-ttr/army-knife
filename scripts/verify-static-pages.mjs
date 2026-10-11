import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Window } from "happy-dom";
import { pages, pageTitle, pageDescription, BASE_PATH, SITE_ORIGIN } from "./static-pages.ts";
import { LOCALES } from "../src/lib/locales.ts";
import { toolPath, localeHomePath } from "../src/lib/routes.ts";

export function verifyStaticPages(directory = "dist") {
  const root = resolve(directory);
  const errors = [];
  const window = new Window({
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  });
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  const expectedHref = (page, tag) =>
    `${SITE_ORIGIN}${page.tool ? toolPath(tag, page.tool) : localeHomePath(tag)}`;
  const pathFile = (path) => join(root, path.slice(BASE_PATH.length), "index.html");
  try {
    const sitemap = new window.DOMParser().parseFromString(
      readFileSync(join(root, "sitemap.xml"), "utf8"),
      "application/xml",
    );
    check(
      sitemap.documentElement.getAttribute("xmlns:xhtml") === "http://www.w3.org/1999/xhtml",
      "Sitemap must declare the XHTML alternate-link namespace.",
    );
    const locations = [...sitemap.querySelectorAll("loc")].map((element) => element.textContent);
    check(
      locations.length === pages.length && new Set(locations).size === pages.length,
      "Sitemap must list each canonical URL exactly once.",
    );
    check(
      JSON.stringify([...locations].sort()) ===
        JSON.stringify(pages.map((page) => SITE_ORIGIN + page.path).sort()),
      "Sitemap differs from the registered tools and languages.",
    );
    const inspect = (page, file) => {
      const document = new window.DOMParser().parseFromString(
        readFileSync(file, "utf8"),
        "text/html",
      );
      check(
        document.documentElement.lang === page.locale,
        `${page.path}: incorrect HTML language.`,
      );
      check(document.title === pageTitle(page), `${page.path}: incorrect title.`);
      check(
        document.querySelector('meta[name="description"]')?.getAttribute("content") ===
          pageDescription(page),
        `${page.path}: incorrect description.`,
      );
      const canonical = [...document.querySelectorAll('link[rel="canonical"]')];
      check(
        canonical.length === 1 && canonical[0].getAttribute("href") === SITE_ORIGIN + page.path,
        `${page.path}: canonical differs from its real document URL.`,
      );
      const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')];
      check(
        alternates.length === LOCALES.length + 1,
        `${page.path}: missing or duplicate language alternatives.`,
      );
      for (const tag of [...LOCALES, "x-default"]) {
        const target = expectedHref(page, tag === "x-default" ? "en" : tag);
        check(
          alternates.filter(
            (link) => link.getAttribute("hreflang") === tag && link.getAttribute("href") === target,
          ).length === 1,
          `${page.path}: incorrect hreflang ${tag}.`,
        );
        check(
          existsSync(pathFile(new URL(target).pathname)),
          `${page.path}: language alternative is not a real file.`,
        );
        const entry = [...sitemap.querySelectorAll("url")].find(
          (element) => element.querySelector("loc")?.textContent === SITE_ORIGIN + page.path,
        );
        // Inspect namespace-resolved children directly: qualified XML tags are
        // not reliably returned by Happy DOM's getElementsByTagNameNS lookup.
        const links = entry
          ? [...entry.children].filter(
              (element) =>
                element.localName === "link" &&
                element.namespaceURI === "http://www.w3.org/1999/xhtml",
            )
          : [];
        check(
          links.filter(
            (link) => link.getAttribute("hreflang") === tag && link.getAttribute("href") === target,
          ).length === 1,
          `${page.path}: sitemap hreflang ${tag} differs from HTML.`,
        );
      }
      const guide = document.getElementById("page-guide");
      check(
        guide && !document.getElementById("app")?.contains(guide),
        `${page.path}: static explanation must survive Vue mounting.`,
      );
      check(
        document.querySelectorAll("h1").length === 1 &&
          Boolean(guide?.querySelector("h1")?.textContent.trim()),
        `${page.path}: missing unique initial heading.`,
      );
      if (page.tool) {
        check(guide?.dataset.tool === page.tool, `${page.path}: wrong static tool explanation.`);
        check(
          (guide?.querySelectorAll("#guide-usage li").length ?? 0) >= 2,
          `${page.path}: missing meaningful usage.`,
        );
        check(
          (guide?.querySelector("#guide-example pre")?.textContent.length ?? 0) > 0 &&
            (guide?.querySelectorAll("#guide-limits li").length ?? 0) > 0,
          `${page.path}: missing example or limits.`,
        );
      }
      for (const link of guide?.querySelectorAll("a[href]") ?? []) {
        const url = new URL(link.getAttribute("href"), SITE_ORIGIN + page.path);
        check(
          url.origin === SITE_ORIGIN && url.pathname.startsWith(BASE_PATH) && !url.search,
          `${page.path}: guide link is not a stable local URL.`,
        );
        check(
          existsSync(pathFile(url.pathname)),
          `${page.path}: guide link lacks a static document: ${url.pathname}.`,
        );
      }
    };
    for (const page of pages) {
      try {
        inspect(page, pathFile(page.path));
      } catch (error) {
        errors.push(`${page.path}: ${error.message}`);
      }
    }
    inspect(
      pages.find((page) => page.path === localeHomePath("ja")),
      join(root, "index.html"),
    );
    check(
      !existsSync(join(root, "404.html")),
      "Do not deploy a SPA fallback as the static page strategy.",
    );
  } catch (error) {
    errors.push(error.message);
  } finally {
    window.close();
  }
  return { ok: errors.length === 0, errors, pages: pages.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = verifyStaticPages(process.argv[2]);
  if (!result.ok) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Verified ${result.pages} real localized HTML pages, root, canonical, reciprocal hreflang, sitemap and guide links.`,
    );
}
