import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base, expect, type Page, type Request, type TestInfo } from "@playwright/test";

const PRIVATE_MARKER = "PRIVATE_SHORTCUT_INPUT_4903";
const PREFERENCE_KEY = "army-knife:preferences:v1";

async function staticAssets(directory: string, prefix = "/army-knife/"): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const pathname = `${prefix}${entry.name}`;
      return entry.isDirectory()
        ? staticAssets(resolve(directory, entry.name), `${pathname}/`)
        : entry.isFile()
          ? [pathname]
          : [];
    }),
  );
  return paths.flat();
}

let allowedAssets: Promise<Set<string>> | undefined;
function assetAllowlist(): Promise<Set<string>> {
  allowedAssets ??= staticAssets(resolve(process.cwd(), "dist")).then(
    (paths) => new Set(["/army-knife/", ...paths]),
  );
  return allowedAssets;
}

interface Audit {
  requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[];
  sockets: string[];
  errors: string[];
}

const test = base.extend<{ shortcutAudit: Audit }>({
  shortcutAudit: [
    async ({ context, page, baseURL }, use, testInfo) => {
      const audit: Audit = { requests: [], sockets: [], errors: [] };
      const record = (request: Request): void => {
        audit.requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          body: request.postData(),
        });
      };
      context.on("request", record);
      page.on("websocket", (socket) => audit.sockets.push(socket.url()));
      page.on("pageerror", (error) => audit.errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") audit.errors.push(message.text());
      });
      await use(audit);
      context.off("request", record);
      const origin = new URL(baseURL as string).origin;
      const allowlist = await assetAllowlist();
      for (const request of audit.requests) {
        const url = new URL(request.url);
        expect(url.origin, `Unexpected origin: ${request.url}`).toBe(origin);
        expect(request.method, `Unexpected method: ${request.url}`).toBe("GET");
        expect(url.search, `Only fixed asset URLs may be requested: ${request.url}`).toBe("");
        expect(allowlist.has(url.pathname), `Not an exact dist asset: ${request.url}`).toBe(true);
        expect(request.body).toBeNull();
        expect(JSON.stringify(request), "Private search appeared in a request").not.toContain(
          PRIVATE_MARKER,
        );
      }
      expect(audit.sockets, "Shortcut investigation must not open WebSockets").toEqual([]);
      expect(audit.errors, "Unexpected browser errors").toEqual([]);
      await testInfo.attach("shortcut-privacy-audit", {
        body: JSON.stringify({
          requests: audit.requests.length,
          sockets: audit.sockets,
          errors: audit.errors,
        }),
        contentType: "application/json",
      });
    },
    { auto: true },
  ],
});

async function openTool(page: Page): Promise<void> {
  await page.goto("./#/tool/shortcuts");
  await expect(page.getByTestId("shortcut-capture")).toBeVisible();
}

async function assertNoOverflow(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(geometry.content, `Horizontal overflow at ${geometry.viewport}px`).toBeLessThanOrEqual(
    geometry.viewport + 1,
  );
}

async function reviewScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

test("focused key capture owns Ctrl+K and lets users leave with Tab or Escape", async ({
  page,
}) => {
  await openTool(page);
  const capture = page.getByTestId("shortcut-capture");
  await capture.focus();
  await page.keyboard.press("Control+k");
  await expect(capture).toHaveValue("Ctrl+K");
  await expect(capture).toBeFocused();
  await expect(page.locator(".global-search")).not.toBeFocused();
  await page.keyboard.press("Tab");
  await expect(capture).not.toBeFocused();
  await expect(capture).toHaveValue("Ctrl+K");
  await capture.focus();
  await page.keyboard.press("Escape");
  await expect(capture).not.toBeFocused();
  await page.getByTestId("shortcut-text").focus();
  await page.keyboard.type("k");
  await expect(capture).toHaveValue("Ctrl+K");
  await page.keyboard.press("Control+k");
  await expect(page.locator(".global-search")).toBeFocused();
  await expect(capture).toHaveValue("Ctrl+K");
});

test("ordered Gmail and VS Code chords expose setup, scope, and official evidence", async ({
  page,
}) => {
  await openTool(page);
  const capture = page.getByTestId("shortcut-capture");
  await page.getByTestId("shortcut-sequential").check();
  await page.getByTestId("shortcut-platform").selectOption("windows");
  await capture.focus();
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+c");
  await expect(capture).toHaveValue("Ctrl+K then Ctrl+C");
  const result = page.getByTestId("shortcut-result");
  await expect(result.filter({ hasText: "VS Code" })).toHaveCount(1);
  await expect(result.first()).toContainText("Ctrl+K then Ctrl+C");
  await expect(result.first().getByTestId("shortcut-source")).toHaveAttribute(
    "href",
    /^https:\/\/code\.visualstudio\.com\//,
  );
  await expect(result.first().getByTestId("shortcut-checked")).toContainText(/2026-10-\d{2}/);

  await page.getByTestId("shortcut-clear").click();
  await page.getByTestId("shortcut-app").selectOption("gmail");
  await page.getByTestId("shortcut-surface").selectOption("web");
  await capture.focus();
  await page.keyboard.press("g");
  await page.keyboard.press("i");
  await expect(capture).toHaveValue("G then I");
  await expect(result).toHaveCount(1);
  await expect(result).toContainText(/enable|turn.*on|settings/i);
  await expect(result.getByTestId("shortcut-source")).toHaveAttribute(
    "href",
    /^https:\/\/support\.google\.com\//,
  );
  await expect(result.getByTestId("shortcut-source")).toHaveAttribute("rel", /noopener/);
  await page.getByTestId("shortcut-sequential").uncheck();
  await capture.focus();
  await page.keyboard.press("g");
  await page.keyboard.press("i");
  await expect(capture).toHaveValue("I");
  await expect(result).toHaveCount(0);
  await expect(page.getByTestId("shortcut-no-matches")).toBeVisible();
});

test("screen controls reach reserved chords and narrow app, OS, surface, and text", async ({
  page,
}, testInfo) => {
  await openTool(page);
  await page.getByTestId("shortcut-builder-modifier-Ctrl").click();
  await expect(page.getByTestId("shortcut-builder-modifier-Ctrl")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByTestId("shortcut-builder-key").selectOption("L");
  await page.getByTestId("shortcut-builder-add").click();
  await expect(page.getByTestId("shortcut-capture")).toHaveValue("Ctrl+L");
  await page.getByTestId("shortcut-platform").selectOption("windows");
  await page.getByTestId("shortcut-surface").selectOption("browser");
  await page.getByTestId("shortcut-app").selectOption("chrome");
  const result = page.getByTestId("shortcut-result");
  await expect(result).toHaveCount(1);
  await expect(result).toContainText("Chrome");
  await page.getByTestId("shortcut-text").fill("address");
  await expect(result).toHaveCount(1);
  await assertNoOverflow(page);
  await reviewScreenshot(page, testInfo, "shortcuts-reserved-light");
  await page.getByTestId("shortcut-platform").selectOption("macos");
  await expect(result).toHaveCount(0);
  await expect(page.getByTestId("shortcut-no-matches")).toContainText(/does not|unknown|unlisted/i);
  await page.getByTestId("shortcut-platform").selectOption("windows");
  await page.getByTestId("shortcut-text").fill(PRIVATE_MARKER);
  await expect(result).toHaveCount(0);
  await expect(page.getByTestId("shortcut-no-matches")).toBeVisible();
});

test("private key queries and search text leave no saved data or URL", async ({ page }) => {
  await openTool(page);
  await page.getByTestId("shortcut-manual").fill("Ctrl+K then Ctrl+C");
  await expect(page.getByTestId("shortcut-capture")).toHaveValue("Ctrl+K then Ctrl+C");
  await page.getByTestId("shortcut-text").fill(PRIVATE_MARKER);
  await page.getByTestId("settings-button").click();
  await page.getByTestId("theme-dark").click();
  await page.getByTestId("settings-close").click();
  const storage = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    href: location.href,
  }));
  expect(Object.keys(storage.local)).toEqual([PREFERENCE_KEY]);
  expect(Object.keys(JSON.parse(storage.local[PREFERENCE_KEY] as string)).sort()).toEqual([
    "autoApply",
    "enabledTools",
    "favorites",
    "knownTools",
    "locale",
    "theme",
    "version",
  ]);
  expect(storage.session).toEqual({});
  expect(JSON.stringify(storage)).not.toContain(PRIVATE_MARKER);
  expect(JSON.stringify(storage)).not.toContain("Ctrl+K then Ctrl+C");
  await page.reload();
  await expect(page.getByTestId("shortcut-capture")).toHaveValue("");
  await expect(page.getByTestId("shortcut-manual")).toHaveValue("");
  await expect(page.getByTestId("shortcut-text")).toHaveValue("");
});

test("all languages and themes react while results remain responsive", async ({
  page,
}, testInfo) => {
  await openTool(page);
  await page.getByTestId("shortcut-manual").fill("g then i");
  await page.getByTestId("shortcut-app").selectOption("gmail");
  const english = await page.getByTestId("shortcut-result-count").textContent();
  for (const locale of ["ja", "zh-CN", "zh-TW", "ko", "en"]) {
    await page.getByTestId("settings-button").click();
    await page.getByTestId("locale-select").selectOption(locale);
    await page.getByTestId("settings-close").click();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByTestId("shortcut-capture")).toHaveValue("G then I");
    await expect(page.getByTestId("shortcut-result")).toHaveCount(1);
    await expect(page.getByTestId("shortcut-result-count")).not.toContainText(
      /shortcuts\.|shortcut\./,
    );
    if (locale === "en")
      await expect(page.getByTestId("shortcut-result-count")).toHaveText(english!);
    else await expect(page.getByTestId("shortcut-result-count")).not.toHaveText(english!);
    await assertNoOverflow(page);
  }
  await reviewScreenshot(page, testInfo, "shortcuts-sequence-light");
  await page.getByTestId("settings-button").click();
  await page.getByTestId("theme-dark").click();
  await page.getByTestId("settings-close").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByTestId("shortcut-result")).toHaveCount(1);
  await assertNoOverflow(page);
  await reviewScreenshot(page, testInfo, "shortcuts-sequence-dark");
});
