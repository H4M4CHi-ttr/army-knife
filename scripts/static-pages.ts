import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tools, type ToolId } from "../src/lib/catalog.ts";
import { LOCALES, type Locale } from "../src/lib/locales.ts";
import { localeHomePath, toolPath } from "../src/lib/routes.ts";
import { guideLabels, languageNames, toolGuides } from "../src/lib/tool-guides.ts";
import { messages } from "../src/i18n/messages.ts";

export const SITE_ORIGIN = "https://h4m4chi-ttr.github.io";
export const BASE_PATH = "/army-knife/";
export interface StaticPage {
  locale: Locale;
  tool?: ToolId;
  path: string;
}
export const pages: readonly StaticPage[] = LOCALES.flatMap((locale) => [
  { locale, path: localeHomePath(locale) },
  ...tools.map(({ id }) => ({ locale, tool: id, path: toolPath(locale, id) })),
]);

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}
function text(locale: Locale, key: string): string {
  const value = (messages[locale] as Record<string, string>)[key];
  if (!value) throw new Error(`Missing static page translation: ${locale}/${key}`);
  return value;
}
export function pageTitle(page: StaticPage): string {
  return page.tool
    ? `${text(page.locale, `tool.${page.tool}.name`)} — Army Knife`
    : `Army Knife — ${text(page.locale, "app.tagline")}`;
}
export function pageDescription(page: StaticPage): string {
  return text(page.locale, page.tool ? `tool.${page.tool}.description` : "app.lead");
}
function pathFor(locale: Locale, tool?: ToolId): string {
  return tool ? toolPath(locale, tool) : localeHomePath(locale);
}
export function alternateLinks(page: StaticPage): string {
  return [
    ...LOCALES.map(
      (locale) =>
        `<link rel="alternate" hreflang="${locale}" href="${SITE_ORIGIN}${pathFor(locale, page.tool)}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${pathFor("en", page.tool)}" />`,
  ].join("\n    ");
}
export function pageGuide(page: StaticPage): string {
  const { locale, tool } = page;
  const labels = guideLabels[locale];
  const e = escapeHtml;
  const links = `<nav aria-label="${e(labels.languages)}" class="guide-languages">${LOCALES.map(
    (language) =>
      `<a lang="${language}" hreflang="${language}" href="${pathFor(language, tool)}"${language === locale ? ' aria-current="page"' : ""}>${languageNames[language]}</a>`,
  ).join(" ")}</nav>`;
  const title = tool ? text(locale, `tool.${tool}.name`) : "Army Knife";
  let content: string;
  if (tool) {
    const guide = toolGuides[tool]?.[locale];
    if (!guide || !guide.steps.length || !guide.limitations.length)
      throw new Error(`Missing tool guide: ${locale}/${tool}`);
    content = `<p>${e(guide.introduction)}</p>
      <section id="guide-usage"><h2>${e(labels.usage)}</h2><ol>${guide.steps.map((step) => `<li>${e(step)}</li>`).join("")}</ol></section>
      <section id="guide-example"><h2>${e(labels.example)}</h2><h3>${e(labels.exampleInput)}</h3><pre><code>${e(guide.exampleInput)}</code></pre><h3>${e(labels.exampleResult)}</h3><p>${e(guide.exampleResult)}</p></section>
      <section id="guide-limits"><h2>${e(labels.limitations)}</h2><ul>${guide.limitations.map((limit) => `<li>${e(limit)}</li>`).join("")}</ul></section>
      <p class="guide-settings">${e(labels.availability)}</p>
      <p><a href="#app">${e(labels.useTool)}</a> · <a href="${localeHomePath(locale)}">${e(labels.allTools)}</a></p>`;
  } else {
    content = `<p>${e(text(locale, "app.lead"))}</p><ul class="guide-tool-list">${tools
      .map(
        ({ id }) =>
          `<li><a href="${toolPath(locale, id)}">${e(text(locale, `tool.${id}.name`))}</a><p>${e(text(locale, `tool.${id}.description`))}</p></li>`,
      )
      .join("")}</ul>
      <p class="guide-settings">${e(labels.availability)}</p>`;
  }
  return `<article id="page-guide" class="page-guide" data-locale="${locale}"${tool ? ` data-tool="${tool}"` : ' data-page="home"'}>
    ${links}<h1>${e(title)}</h1><p class="guide-description">${e(pageDescription(page))}</p>${content}
    <p class="guide-privacy">${e(labels.privacy)}</p><noscript><p class="notice">${e(labels.javascript)}</p></noscript>
  </article>`;
}
/** The transformed Vite shell retains the exact CSP and same-origin asset URLs. */
export function renderPage(shell: string, page: StaticPage): string {
  if (!/<div id="app"><\/div>/.test(shell))
    throw new Error("Static page build needs an empty #app mount point.");
  return shell
    .replace(/<html lang="[^"]*"/, `<html lang="${page.locale}"`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle(page))}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeHtml(pageDescription(page))}" />`,
    )
    .replace(
      "</head>",
      `    <link rel="canonical" href="${SITE_ORIGIN}${page.path}" />\n    ${alternateLinks(page)}\n  </head>`,
    )
    .replace('<div id="app"></div>', `<div id="app"></div>\n    ${pageGuide(page)}`);
}
export function sitemap(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages
    .map(
      (page) =>
        `  <url><loc>${SITE_ORIGIN}${page.path}</loc>${[...LOCALES, "x-default"].map((tag) => `<xhtml:link rel="alternate" hreflang="${tag}" href="${SITE_ORIGIN}${pathFor(tag === "x-default" ? "en" : (tag as Locale), page.tool)}" />`).join("")}</url>`,
    )
    .join("\n")}\n</urlset>\n`;
}
export function writeStaticPages(outDir: string): void {
  const shell = readFileSync(join(outDir, "index.html"), "utf8");
  for (const page of pages) {
    const destination = join(outDir, page.path.slice(BASE_PATH.length), "index.html");
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, renderPage(shell, page));
  }
  // The historic project root remains a real Japanese directory page. Its
  // canonical is the Japanese home; only canonical URLs enter the sitemap.
  writeFileSync(
    join(outDir, "index.html"),
    renderPage(shell, { locale: "ja", path: localeHomePath("ja") }),
  );
  writeFileSync(join(outDir, "sitemap.xml"), sitemap());
}
