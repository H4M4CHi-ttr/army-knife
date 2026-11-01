import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { test, expect, type Page, type Request } from "@playwright/test";
import { tools, type ToolId } from "../../src/lib/catalog";
import { LOCALES, type Locale } from "../../src/lib/locales";
import { localeHomePath, SITE_BASE, toolPath } from "../../src/lib/routes";
import { toolGuides } from "../../src/lib/tool-guides";

const SITE_ORIGIN = "https://h4m4chi-ttr.github.io";
const PREFERENCE_KEY = "army-knife:preferences:v1";
const PRIVATE_MARKER = "PRIVATE_STATIC_PATH_INPUT_7261";

function attribute(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function metaTag(html: string, name: string): string {
  return html.match(/<meta\b[^>]*>/g)?.find((tag) => attribute(tag, "name") === name) ?? "";
}

function canonical(html: string): string | undefined {
  const tag = html.match(/<link\b[^>]*>/g)?.find((tag) => attribute(tag, "rel") === "canonical");
  return tag ? attribute(tag, "href") : undefined;
}

async function preferences(page: Page, enabledTools: readonly ToolId[], locale: Locale = "en") {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: PREFERENCE_KEY,
    value: {
      version: 1,
      locale,
      theme: "dark",
      enabledTools,
      favorites: ["cidr"],
      knownTools: tools.map((tool) => tool.id),
      autoApply: false,
    },
  });
}

function inputSelector(id: ToolId): string {
  if (id === "etag") return "#etag-current";
  if (id === "pkce") return "#pkce-mode";
  if (id === "cors") return "#cors-origin";
  if (id === "chmod") return "#chmod-mode";
  if (id === "json-pointer") return "#json-pointer-input";
  if (id.startsWith("json-")) return "#json-left";
  if (id === "sets") return "#sets-left";
  if (id === "env") return "#env-left";
  if (id === "contrast") return ".color-controls";
  if (id === "shortcuts") return '[data-testid="shortcut-capture"]';
  if (id === "timestamp") return '[data-testid="date-input"]';
  if (id === "jwt") return '[data-testid="jwt-input"]';
  if (id === "ids") return '[data-testid="id-format"]';
  if (id === "password") return '[data-testid="secret-mode"]';
  if (id === "og-tags") return '[data-testid="og-title"]';
  if (id === "cubic-bezier") return "#bezier-duration";
  if (id === "css-gradient") return "#gradient-kind";
  if (id === "svg-placeholder") return "#placeholder-width";
  if (id === "color-palette") return "#palette-base";
  if (id === "data-units" || id === "css-units") return "#quick-input";
  if (id === "radix") return "#quick-input";
  if (id === "unicode-normalize" || id === "slug" || id === "unicode-escape") return "#quick-text";
  if (id === "sri") return "#sri-hex";
  if (id === "encoding" || id === "magic") return '[data-testid="selected-file"]';
  return `#${id}-input`;
}

async function allowedStaticPaths(directory: string, prefix = SITE_BASE): Promise<Set<string>> {
  const paths = new Set<string>();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      for (const nested of await allowedStaticPaths(resolve(directory, entry.name), `${path}/`))
        paths.add(nested);
    } else if (entry.isFile()) {
      paths.add(path);
      if (entry.name === "index.html") paths.add(prefix);
    }
  }
  return paths;
}

test("every language and tool URL serves its own generated initial HTML with HTTP 200", async ({
  request,
}) => {
  for (const locale of LOCALES) {
    const titles = new Set<string>();
    const paths = [localeHomePath(locale), ...tools.map((tool) => toolPath(locale, tool.id))];
    for (const path of paths) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()["content-type"], path).toContain("text/html");
      const html = await response.text();
      const file = resolve("dist", path.slice(SITE_BASE.length), "index.html");
      expect(html, `HTTP response must be the actual static file: ${path}`).toBe(
        await readFile(file, "utf8"),
      );
      expect(html, path).toContain(`<html lang="${locale}"`);
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
      expect(title, path).toBeTruthy();
      expect(titles.has(title as string), `Title must identify the page: ${path}`).toBe(false);
      titles.add(title as string);
      expect(attribute(metaTag(html, "description"), "content")?.length, path).toBeGreaterThan(10);
      expect(canonical(html), path).toBe(`${SITE_ORIGIN}${path}`);
      expect(html, path).toContain('id="page-guide"');
      expect(html, path).toMatch(/<h1\b[^>]*>[^<]+<\/h1>/);
      const id = tools.find((tool) => path === toolPath(locale, tool.id))?.id;
      if (id) {
        expect(html, path).toContain(`data-tool="${id}"`);
        expect(html, path).toContain(`data-locale="${locale}"`);
        for (const section of ["guide-usage", "guide-example", "guide-limits"])
          expect(html, path).toContain(`id="${section}"`);
        for (const alternative of LOCALES) {
          const alternate = html
            .match(/<link\b[^>]*>/g)
            ?.find((tag) => attribute(tag, "hreflang") === alternative);
          expect(alternate, `${path} alternate ${alternative}`).toBeTruthy();
          expect(attribute(alternate as string, "href")).toBe(
            `${SITE_ORIGIN}${toolPath(alternative, id)}`,
          );
        }
      }
    }
  }
});

test("root is a real Japanese document and unknown paths return 404 without an app fallback", async ({
  request,
  page,
}) => {
  const root = await request.get(SITE_BASE);
  expect(root.status()).toBe(200);
  expect(await root.text()).toContain('<html lang="ja"');
  await page.goto(SITE_BASE);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.getByTestId("tool-card-cidr")).toHaveAttribute("href", toolPath("ja", "cidr"));
  for (const path of [
    `${SITE_BASE}unknown/`,
    `${SITE_BASE}en/tools/unknown/`,
    `${SITE_BASE}unknown/tools/cidr/`,
    `${SITE_BASE}en/tools/cidr/missing.js`,
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(await response.text(), path).not.toContain('id="app"');
  }
  const noSlash = await request.get(toolPath("en", "cidr").slice(0, -1), { maxRedirects: 0 });
  expect(noSlash.status()).toBe(308);
  expect(noSlash.headers().location).toBe(toolPath("en", "cidr"));
  const index = await page.goto(`${toolPath("en", "cidr")}index.html`);
  expect(index?.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`${toolPath("en", "cidr")}$`));
  await expect(page.locator("#cidr-input")).toBeVisible();
});

test.describe("JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("localized descriptions, usage, examples and normal language links remain readable", async ({
    page,
  }) => {
    for (const locale of LOCALES) {
      await page.goto(toolPath(locale, "cidr"));
      const guide = page.locator("#page-guide");
      await expect(guide).toBeVisible();
      await expect(guide).toHaveAttribute("data-tool", "cidr");
      await expect(guide).toHaveAttribute("data-locale", locale);
      await expect(guide.locator("h1")).toBeVisible();
      await expect(page.locator("#guide-usage")).toBeVisible();
      await expect(page.locator("#guide-example")).toBeVisible();
      await expect(page.locator("#guide-example")).toContainText(
        toolGuides.cidr[locale].exampleInput,
      );
      await expect(page.locator("#app")).toBeEmpty();
      for (const alternative of LOCALES)
        await expect(guide.locator(`a[href="${toolPath(alternative, "cidr")}"]`)).toBeVisible();
    }
    await page.goto(toolPath("en", "sets"));
    await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", "sets");
    await expect(page.locator("#guide-usage")).toBeVisible();
    await expect(page.locator("#guide-example")).toBeVisible();
    await expect(page.locator("#app")).toBeEmpty();
  });
});

// Bound each test's work as the inventory grows; every registered tool is visited.
for (let start = 0; start < tools.length; start += 10) {
  const batch = tools.slice(start, start + 10);
  test(`all registered tools mount when explicitly enabled on their normal paths (${start + 1}–${start + batch.length})`, async ({ page }) => {
    await preferences(page, tools.map((tool) => tool.id));
    for (const tool of batch) {
      const response = await page.goto(toolPath("en", tool.id));
      expect(response?.status(), tool.id).toBe(200);
      await expect(page.locator(inputSelector(tool.id))).toBeVisible();
      await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", tool.id);
      await expect(page).toHaveURL(new RegExp(`${toolPath("en", tool.id)}$`));
    }
  });
}

test("disabled preferences keep the static explanation and prevent tool launch even on reload", async ({
  page,
}) => {
  // Seed once. Settings changes after startup must survive later navigations.
  await page.goto(localeHomePath("en"));
  await page.evaluate(
    ({ key, knownTools }) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          locale: "en",
          theme: "dark",
          enabledTools: [],
          favorites: [],
          knownTools,
          autoApply: false,
        }),
      ),
    { key: PREFERENCE_KEY, knownTools: tools.map((tool) => tool.id) },
  );
  await page.goto(toolPath("en", "cidr"));
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await expect(page.locator("#page-guide")).toBeVisible();
  await expect(page.locator("#cidr-input")).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`${toolPath("en", "cidr")}$`));
  await page.reload();
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await expect(page.locator("#cidr-input")).toHaveCount(0);
  await page.getByTestId("disabled-settings").click();
  await expect(page.getByTestId("toggle-cidr")).toHaveAttribute("aria-checked", "false");
  await page.getByTestId("toggle-cidr").click();
  await page.getByTestId("settings-close").click();
  await expect(page.locator("#cidr-input")).toBeVisible();
  await page.reload();
  await expect(page.locator("#cidr-input")).toBeVisible();
  await page.getByTestId("settings-button").click();
  await page.getByTestId("toggle-cidr").click();
  await page.getByTestId("settings-close").click();
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await expect(page.locator("#cidr-input")).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`${toolPath("en", "cidr")}$`));
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) as string).enabledTools,
      PREFERENCE_KEY,
    ),
  ).toEqual([]);
});

test("normal-path SPA navigation keeps one document across repeat, history, category, and refresh", async ({
  page,
  baseURL,
}) => {
  const credentialProbe = "spa-navigation-credential-probe";
  const fetchRequests: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | null;
  }[] = [];
  page.on("request", (request: Request) => {
    if (request.resourceType() !== "fetch") return;
    fetchRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      body: request.postData(),
    });
  });
  await page.context().addCookies([
    { name: credentialProbe, value: "must-not-be-sent", url: new URL(baseURL as string).origin },
  ]);
  let documentLoads = 0;
  page.on("load", () => documentLoads++);
  await page.goto(localeHomePath("en"));
  const documentToken = await page.evaluate(() => {
    const token = crypto.randomUUID();
    Object.defineProperty(window, "__spaNavigationDocumentToken", {
      value: token,
      configurable: true,
    });
    return token;
  });
  const currentDocumentToken = () =>
    page.evaluate(
      () =>
        (window as typeof window & { __spaNavigationDocumentToken?: string })
          .__spaNavigationDocumentToken,
    );

  const category = page.locator('a.category-item[href$="#category-network"]');
  if (!(await category.isVisible())) await page.locator(".mobile-menu").click();
  await category.click();
  await expect(page).toHaveURL(new RegExp(localeHomePath("en") + "#category-network$"));
  await expect(category).toHaveClass(/active/);
  expect(await currentDocumentToken()).toBe(documentToken);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(localeHomePath("en") + "$"));
  expect(await currentDocumentToken()).toBe(documentToken);

  await page.evaluate(() => window.scrollTo({ top: 800, left: 0, behavior: "instant" }));
  await page.getByTestId("tool-card-cidr").click();
  await expect(page).toHaveURL(new RegExp(toolPath("en", "cidr") + "$"));
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", "cidr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    SITE_ORIGIN + toolPath("en", "cidr"),
  );
  await expect(page.locator('link[rel="alternate"][hreflang="ja"]')).toHaveAttribute(
    "href",
    SITE_ORIGIN + toolPath("ja", "cidr"),
  );
  const guideDescription =
    (await page.locator("#page-guide .guide-description").textContent())?.trim() ?? "";
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    guideDescription,
  );
  const guideTitle = (await page.locator("#page-guide h1").textContent())?.trim() ?? "";
  expect(await page.title()).toBe(guideTitle + " — Army Knife");
  await expect(page.locator(".workbench-title h2")).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await currentDocumentToken()).toBe(documentToken);

  await page.locator("#cidr-input").fill("192.0.2.0/24");
  await page.locator("#cidr-input").fill(PRIVATE_MARKER);
  await page.locator(".back-link").click();
  await expect(page).toHaveURL(new RegExp(localeHomePath("en") + "$"));
  await expect(page.locator("#page-guide")).toHaveAttribute("data-page", "home");
  expect(await currentDocumentToken()).toBe(documentToken);

  await page.getByTestId("tool-card-url").click();
  await expect(page).toHaveURL(new RegExp(toolPath("en", "url") + "$"));
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", "url");
  expect(await currentDocumentToken()).toBe(documentToken);

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(localeHomePath("en") + "$"));
  await expect(page.locator("#page-guide")).toHaveAttribute("data-page", "home");
  expect(await currentDocumentToken()).toBe(documentToken);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(toolPath("en", "cidr") + "$"));
  await expect(page.locator("#cidr-input")).toHaveValue("");
  expect(await currentDocumentToken()).toBe(documentToken);
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(localeHomePath("en") + "$"));
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(toolPath("en", "url") + "$"));
  await expect(page.locator("#url-input")).toHaveValue("");
  expect(await currentDocumentToken()).toBe(documentToken);
  expect(documentLoads).toBe(1);
  expect(fetchRequests.length).toBeGreaterThan(0);
  const origin = new URL(baseURL as string).origin;
  const staticRoutePaths = new Set([
    localeHomePath("en"),
    toolPath("en", "cidr"),
    toolPath("en", "url"),
  ]);
  for (const request of fetchRequests) {
    const url = new URL(request.url);
    expect(url.origin, request.url).toBe(origin);
    expect(staticRoutePaths.has(url.pathname), request.url).toBe(true);
    expect(request.method, request.url).toBe("GET");
    expect(url.search, request.url).toBe("");
    expect(request.body, request.url).toBeNull();
    expect(request.headers.cookie ?? "", request.url).toBe("");
    expect(request.headers.cookie ?? "", request.url).not.toContain(credentialProbe);
    expect(JSON.stringify(request)).not.toContain(PRIVATE_MARKER);
  }

  await page.reload();
  await expect(page.locator("#url-input")).toHaveValue("");
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", "url");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    SITE_ORIGIN + toolPath("en", "url"),
  );
  expect(await currentDocumentToken()).toBeUndefined();
  expect(documentLoads).toBe(2);
});

test("normal links support keyboard navigation, new tabs, reload, history and legacy hashes", async ({
  page,
  context,
}) => {
  await page.goto(localeHomePath("en"));
  await page.getByTestId("settings-button").click();
  await page.getByTestId("theme-light").click();
  await page.getByTestId("settings-close").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("settings-button")).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  const link = page.getByTestId("tool-card-cidr");
  await expect(link).toHaveAttribute("href", toolPath("en", "cidr"));
  const newTabEvent = context.waitForEvent("page");
  await link.click({ button: "middle" });
  const newTab = await newTabEvent;
  await expect(newTab.locator("#cidr-input")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${localeHomePath("en")}$`));
  await newTab.close();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${toolPath("en", "cidr")}$`));
  await page.locator("#cidr-input").fill("192.0.2.0/24");
  await expect(page.locator(".cidr-network code")).toHaveText("192.0.2.0/24");
  await page.reload();
  await expect(page.locator("#cidr-input")).toHaveValue("");
  await page.locator("#cidr-input").fill(PRIVATE_MARKER);
  await expect(page.locator(".back-link")).toHaveAttribute("href", localeHomePath("en"));
  await page.locator(".back-link").click();
  await page.getByTestId("tool-card-url").click();
  await expect(page.locator("#url-input")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${localeHomePath("en")}$`));
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${toolPath("en", "cidr")}$`));
  await expect(page.locator("#cidr-input")).toBeVisible();
  await expect(page.locator("#cidr-input")).toHaveValue("");
  await page.goForward();
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`${toolPath("en", "url")}$`));
  await page.goto(SITE_BASE);
  await expect(page).toHaveURL(new RegExp(`${localeHomePath("en")}$`));
  await expect(page.getByTestId("tool-card-cidr")).toBeVisible();
  await page.goto(`${SITE_BASE}#/tool/cidr`);
  await expect(page).toHaveURL(new RegExp(`${toolPath("en", "cidr")}$`));
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", "cidr");
  await page.reload();
  await expect(page.locator("#cidr-input")).toBeVisible();
});

test("changing language navigates the same tool page and preserves only preferences", async ({
  page,
}) => {
  await page.goto(toolPath("en", "unicode"));
  const documentToken = await page.evaluate(() => {
    const token = crypto.randomUUID();
    Object.defineProperty(window, "__localeNavigationDocumentToken", {
      value: token,
      configurable: true,
    });
    return token;
  });
  await page.locator("#unicode-input").fill(`${PRIVATE_MARKER}\u200b`);
  await page.getByTestId("settings-button").click();
  await page.getByTestId("theme-dark").click();
  await page.getByTestId("locale-select").selectOption("ja");
  await expect(page).toHaveURL(new RegExp(`${toolPath("ja", "unicode")}$`));
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", "ja");
  await expect(page.locator('link[data-font-locale="ja"]')).toHaveAttribute("media", "all");
  await expect(page.locator(".workbench-title h2")).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __localeNavigationDocumentToken?: string })
          .__localeNavigationDocumentToken,
    ),
  ).toBe(documentToken);
  await expect(page.locator("#unicode-input")).toHaveValue("");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    SITE_ORIGIN + toolPath("ja", "unicode"),
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    SITE_ORIGIN + toolPath("en", "unicode"),
  );
  const stored = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  expect(Object.keys(stored.local)).toEqual([PREFERENCE_KEY]);
  expect(stored.session).toEqual({});
  expect(JSON.parse(stored.local[PREFERENCE_KEY] as string)).toMatchObject({
    locale: "ja",
    theme: "dark",
  });
  expect(JSON.stringify(stored)).not.toContain(PRIVATE_MARKER);
  expect(page.url()).not.toContain(PRIVATE_MARKER);
});

test("simulated retained-page lifecycle clears inputs and honors refreshed disabled preferences", async ({
  page,
}) => {
  await page.goto(toolPath("en", "cidr"));
  await page.getByTestId("settings-button").click();
  await page.getByTestId("theme-light").click();
  await page.getByTestId("settings-close").click();
  await page.locator("#cidr-input").fill(PRIVATE_MARKER);
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
  });
  await expect(page.locator("#cidr-input")).toHaveCount(0);
  await expect(page.locator("#page-guide")).toBeVisible();
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await expect(page.locator("#cidr-input")).toHaveValue("");
  await page.locator("#cidr-input").fill(PRIVATE_MARKER);
  await page.evaluate((key) => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    const saved = JSON.parse(localStorage.getItem(key) as string);
    saved.enabledTools = saved.enabledTools.filter((id: string) => id !== "cidr");
    saved.theme = "dark";
    localStorage.setItem(key, JSON.stringify(saved));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  }, PREFERENCE_KEY);
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await expect(page.locator("#cidr-input")).toHaveCount(0);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("#page-guide")).toBeVisible();
  await page.getByTestId("disabled-settings").click();
  await page.getByTestId("toggle-cidr").click();
  await page.getByTestId("settings-close").click();
  await expect(page.locator("#cidr-input")).toHaveValue("");
  await expect(page).toHaveURL(new RegExp(`${toolPath("en", "cidr")}$`));
  const stored = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    href: location.href,
  }));
  expect(JSON.stringify(stored)).not.toContain(PRIVATE_MARKER);
});

test("deep paths load only fixed same-origin JS, CSS, WASM and fonts while input stays local", async ({
  page,
  context,
  baseURL,
}) => {
  const requests: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | null;
  }[] = [];
  const errors: string[] = [];
  const sockets: string[] = [];
  const listener = (request: Request) =>
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      body: request.postData(),
    });
  context.on("request", listener);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("websocket", (socket) => sockets.push(socket.url()));
  const response = await page.goto(toolPath("en", "csv"));
  expect(response?.status()).toBe(200);
  await page.locator("#csv-input").fill(`id,name\n1,${PRIVATE_MARKER}`);
  await page.getByTestId("apply-now").click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeEnabled();
  await page.evaluate(async () => {
    await document.fonts.load('16px "Noto Sans Variable"', "CSV profiler");
    await document.fonts.load('16px "Army Knife Mono J"', "const value = 42;");
    await document.fonts.ready;
  });
  context.off("request", listener);
  const allowed = await allowedStaticPaths(resolve("dist"));
  const origin = new URL(baseURL as string).origin;
  for (const request of requests) {
    const url = new URL(request.url);
    if (url.protocol === "blob:" || url.protocol === "data:") continue;
    expect(url.origin, request.url).toBe(origin);
    expect(request.method, request.url).toBe("GET");
    expect(url.search, request.url).toBe("");
    expect(allowed.has(url.pathname), request.url).toBe(true);
    expect(request.body, request.url).toBeNull();
    expect(JSON.stringify(request)).not.toContain(PRIVATE_MARKER);
  }
  for (const extension of [".js", ".css", ".wasm", ".woff2"])
    expect(
      requests.some((request) => new URL(request.url).pathname.endsWith(extension)),
      extension,
    ).toBe(true);
  expect(errors).toEqual([]);
  expect(sockets).toEqual([]);
  const stored = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    href: location.href,
  }));
  expect(JSON.stringify(stored)).not.toContain(PRIVATE_MARKER);
});

test("static explanations fit desktop and mobile viewports in both themes", async ({
  page,
}, testInfo) => {
  await page.goto(toolPath("en", "cidr"));
  for (const theme of ["light", "dark"] as const) {
    await page.getByTestId("settings-button").click();
    await page.getByTestId(`theme-${theme}`).click();
    await page.getByTestId("settings-close").click();
    await page.locator("#page-guide").scrollIntoViewIfNeeded();
    await expect(page.locator("#page-guide")).toBeVisible();
    const geometry = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.width + 1);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      // Give both the scroll and the subsequent compositor paint a frame.
      await new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      );
    });
    const path = testInfo.outputPath(`static-guide-${theme}.png`);
    await page.screenshot({ path, fullPage: true, animations: "disabled" });
    await testInfo.attach(`static-guide-${theme}`, { path, contentType: "image/png" });
  }
});
