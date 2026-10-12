# Localized static tool pages

The existing project site remains <https://h4m4chi-ttr.github.io/army-knife/>.
Every registered tool has a real directory document in each supported language:

- `/army-knife/ja/tools/cidr/`
- `/army-knife/en/tools/cidr/`
- `/army-knife/zh-CN/tools/cidr/`
- `/army-knife/zh-TW/tools/cidr/`
- `/army-knife/ko/tools/cidr/`

Language homes use `/army-knife/{locale}/`. The historic root has a Japanese
directory document and canonical `/army-knife/ja/`; JavaScript honors an explicitly
saved language by loading its language home. Root visits without a saved language
use Japanese. Existing `#/tool/{id}` links load the real tool document in the saved
or browser-detected language using replacement navigation.

## Build and content

The Vite build first produces the existing Vue/Vapor application assets.
`scripts/static-pages.ts` then writes HTML from the transformed entry shell.
Each document retains the existing CSP and compiled same-origin asset URLs. Its
title and description come from the existing i18n messages; its heading, usage,
synthetic example, interpretation and limitations come from `src/lib/tool-guides.ts`.
The guide stays outside the Vue mount point, so it remains readable with JavaScript
disabled and after the interactive workbench mounts on the same page.

The generator iterates `tools` from the existing catalog and `LOCALES` from the
shared locale module. There is no second page registry. Add a tool to the catalog
and provide its typed guide and UI translations; add a language to the locale list
and provide its translations and guides. Type checking and output verification
require complete coverage. Public slugs are existing stable tool IDs and exact
language tags, independent of translated display names.

Canonical and reciprocal hreflang links identify the corresponding real documents.
`x-default` points to the English version of the same page. `sitemap.xml` includes
every canonical language home and tool URL, with the same alternatives. The root
alias does not add a duplicate sitemap entry. These changes make descriptive HTML
and tools directly addressable; they do not establish search ranking or Search
Console registration.

## Navigation and preferences

Tool, home, back and language links have ordinary readable `href` paths. An
unmodified primary click loads the matching static HTML in the current document,
then updates the Vue route, guide, title, description, canonical and hreflang links
with the History API. The static document remains the source of guide content and
metadata. Direct loads and refreshes still receive that complete HTML. Browser
history, keyboard activation, modified clicks and new tabs keep their normal
behavior. Favorites and category filters use harmless home fragments. Switching
tools or languages discards unsaved tool inputs, as a full document navigation did.

Static guides list all tools, including optional or disabled tools. This public
documentation does not enable a tool. The workbench checks existing preferences
and shows a disabled explanation with a Settings button instead of mounting its
component. Enabling or disabling a tool retains its stable document URL.

No input values or search queries are added to URLs, storage or requests. The
existing preference allowlist, same-origin assets, WASM workers and CSP remain in
effect. JavaScript is required for interactive tools, while explanations and normal
links remain available without it.

## Verification and hosting

`pnpm build` generates the complete directory tree. `pnpm verify:dist` checks the
existing asset graph/CSP and the actual page files, titles, descriptions, headings,
canonical, hreflang, sitemap and guide links. Script tests deliberately remove
documents or corrupt metadata to confirm failures are detected.

Playwright uses `scripts/serve-dist.mjs`, a directory/file-only test server under
`/army-knife/`. Unknown paths return HTTP 404; it never falls back to an SPA entry.
Browser tests cover direct documents, no-JavaScript reading, enabled/disabled
preferences, legacy links, reload/history/new tabs, language changes, deep-path
assets, privacy, themes and the existing desktop/small Chromium/Firefox projects.
This server is only for tests; the deployed site consists entirely of static files.

The existing `main` quality-and-Pages workflow builds and deploys the tested files.
No new domain, production server or 404 hash-redirect page is needed. Development
server fallback behavior is not evidence of successful static hosting.
