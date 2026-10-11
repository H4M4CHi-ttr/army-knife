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
    (paths) =>
      new Set([
        ...paths,
        ...paths.filter((path) => path.endsWith("/index.html")).map((path) => path.slice(0, -10)),
      ]),
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
      const observePage = (currentPage: Page): void => {
        currentPage.on("websocket", (socket) => audit.sockets.push(socket.url()));
        currentPage.on("pageerror", (error) => audit.errors.push(error.message));
        currentPage.on("console", (message) => {
          if (message.type() === "error") audit.errors.push(message.text());
        });
      };
      observePage(page);
      context.on("page", observePage);
      await use(audit);
      context.off("request", record);
      context.off("page", observePage);
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
  await page.goto("./en/tools/shortcuts/");
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

test("ordered GitHub and VS Code chords expose setup, scope, and licensed evidence", async ({
  page,
}, testInfo) => {
  await openTool(page);
  const capture = page.getByTestId("shortcut-capture");
  await page.getByTestId("shortcut-sequential").check();
  await page.getByTestId("shortcut-platform").selectOption("windows");
  await capture.focus();
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+c");
  await expect(capture).toHaveValue("Ctrl+K then Ctrl+C");
  const result = page.getByTestId("shortcut-result");
  await expect(result.filter({ hasText: "Visual Studio Code" })).toHaveCount(1);
  await expect(result.first()).toContainText("Ctrl+K then Ctrl+C");
  await expect(result.first().getByTestId("shortcut-source")).toHaveAttribute(
    "href",
    /^https:\/\/github\.com\/microsoft\/vscode-docs\/blob\/[a-f0-9]{40}\/docs\/customization\/keyboard-shortcuts-windows\.docx$/,
  );
  await expect(result.first().getByTestId("shortcut-checked")).toContainText(/2026-10-\d{2}/);

  await page.getByTestId("shortcut-clear").click();
  await page.getByTestId("shortcut-app").selectOption("github");
  await page.getByTestId("shortcut-surface").selectOption("web");
  await capture.focus();
  await page.keyboard.press("g");
  await page.keyboard.press("i");
  await expect(capture).toHaveValue("G then I");
  await expect(result).toHaveCount(1);
  await expect(result).toContainText(/enable|turn.*on|settings/i);
  await expect(result.getByTestId("shortcut-source")).toHaveAttribute(
    "href",
    /^https:\/\/github\.com\/github\/docs\/blob\/[a-f0-9]{40}\/content\/get-started\/accessibility\/keyboard-shortcuts\.md$/,
  );
  await expect(result.getByTestId("shortcut-source")).toHaveAttribute("rel", /noopener/);
  await result.locator(".shortcut-card-source details summary").click();
  await expect(result.getByTestId("shortcut-attribution")).toContainText(/GitHub|github/);
  await expect(result.locator(".shortcut-card-source details")).toContainText(
    "MIT license does not relicense these records",
  );
  await expect(result.locator(".shortcut-card-source details")).toContainText(
    "included record checked against its source",
  );
  await assertNoOverflow(page);
  await reviewScreenshot(page, testInfo, "shortcuts-licensed-evidence");
  const license = result.getByTestId("shortcut-license");
  await expect(license).toHaveText("CC-BY-4.0");
  await expect(license).toHaveAttribute(
    "href",
    "https://creativecommons.org/licenses/by/4.0/legalcode.en",
  );
  await expect(license).toHaveAttribute("rel", /noopener/);
  const notice = result.getByTestId("shortcut-notice");
  const licenseText = result.getByTestId("shortcut-license-text");
  await expect(notice).toHaveAttribute(
    "href",
    "/army-knife/licenses/shortcut-sources/notices.html",
  );
  await expect(licenseText).toHaveAttribute(
    "href",
    "/army-knife/licenses/shortcut-sources/CC-BY-4.0.txt",
  );
  await expect(notice).toHaveAttribute("rel", /noopener/);
  await expect(licenseText).toHaveAttribute("rel", /noopener/);
  const noticePopup = page.waitForEvent("popup");
  await notice.click();
  const noticePage = await noticePopup;
  await expect(noticePage.locator("body")).toContainText(/GitHub|attribution/i);
  await noticePage.close();
  const textPopup = page.waitForEvent("popup");
  await licenseText.click();
  const licensePage = await textPopup;
  await expect(licensePage.locator("body")).toContainText(/Attribution 4\.0 International/i);
  await licensePage.close();
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
  await page.getByTestId("shortcut-builder-key").selectOption("F");
  await page.getByTestId("shortcut-builder-add").click();
  await expect(page.getByTestId("shortcut-capture")).toHaveValue("Ctrl+F");
  await page.getByTestId("shortcut-platform").selectOption("windows");
  await page.getByTestId("shortcut-surface").selectOption("browser");
  await page.getByTestId("shortcut-app").selectOption("firefox");
  const result = page.getByTestId("shortcut-result");
  await expect(result).toHaveCount(1);
  await expect(result).toContainText("Firefox");
  await page.getByTestId("shortcut-text").fill("page");
  await expect(result).toHaveCount(1);
  await assertNoOverflow(page);
  await reviewScreenshot(page, testInfo, "shortcuts-reserved-light");
  await page.getByTestId("shortcut-platform").selectOption("macos");
  await expect(result).toHaveCount(0);
  await expect(page.getByTestId("shortcut-no-matches")).toContainText(/does not|unknown|unlisted/i);
  await page.getByTestId("shortcut-manual").fill("Meta+F");
  await expect(page.getByTestId("shortcut-capture")).toHaveValue("Meta+F");
  await expect(result).toHaveCount(1);
  await expect(result).toContainText("Firefox");
  await page.getByTestId("shortcut-manual").fill("Ctrl+F");
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
  await page.getByTestId("shortcut-app").selectOption("github");
  await expect(page.getByTestId("shortcut-result")).toHaveCount(1);
  const english = await page.getByTestId("shortcut-result-count").textContent();
  const englishCandidate = await page.getByTestId("shortcut-candidate-notice").textContent();
  for (const locale of ["ja", "zh-CN", "zh-TW", "ko", "en"]) {
    await page.getByTestId("settings-button").click();
    await page.getByTestId("locale-select").selectOption(locale);
    await expect(page).toHaveURL(new RegExp(`/army-knife/${locale}/tools/shortcuts/$`));
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByTestId("shortcut-capture")).toHaveValue("");
    await page.getByTestId("shortcut-manual").fill("g then i");
    await page.getByTestId("shortcut-app").selectOption("github");
    await expect(page.getByTestId("shortcut-capture")).toHaveValue("G then I");
    await expect(page.getByTestId("shortcut-result")).toHaveCount(1);
    await expect(page.getByTestId("shortcut-result-count")).not.toContainText(
      /shortcuts\.|shortcut\./,
    );
    await expect(page.getByTestId("shortcut-candidate-notice")).not.toContainText(
      /shortcuts\.|shortcut\./,
    );
    if (locale === "en") {
      await expect(page.getByTestId("shortcut-result-count")).toHaveText(english!);
      await expect(page.getByTestId("shortcut-candidate-notice")).toHaveText(englishCandidate!);
    } else {
      await expect(page.getByTestId("shortcut-result-count")).not.toHaveText(english!);
      await expect(page.getByTestId("shortcut-candidate-notice")).not.toHaveText(englishCandidate!);
    }
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
