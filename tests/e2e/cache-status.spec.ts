import { readFile } from "node:fs/promises";
import { expect, test as base } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { cacheStatusMessages } from "../../src/i18n/cache-status";

const PRIVATE = "PRIVATE_CACHE_STATUS_9112";
const allowed = readFile("dist/public-assets.json", "utf8").then((text) => parsePublicAssets(text));

const test = base.extend<{ audit: void }>({
  audit: [async ({ context, page, baseURL }, use) => {
    const requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [];
    const diagnostics: string[] = [];
    context.on("request", (request) => requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      body: request.postData(),
    }));
    page.on("console", (message) => {
      if (message.type() === "error" || message.text().includes(PRIVATE)) diagnostics.push(message.text());
    });
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("websocket", (socket) => diagnostics.push(socket.url()));
    await use();
    const paths = await allowed;
    for (const request of requests) {
      const url = new URL(request.url);
      expect(url.origin).toBe(new URL(baseURL!).origin);
      expect(paths.has(url.pathname)).toBe(true);
      expect(url.search).toBe("");
      expect(request.method).toBe("GET");
      expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE);
    expect(diagnostics).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["en", "ja", "zh-CN", "zh-TW", "ko"] as const) {
  test(`Cache-Status route, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    await page.goto(`./${locale}/tools/cache-status/`);
    const messages = cacheStatusMessages[locale];
    await expect(page.locator("h1")).toHaveText(messages["tool.cache-status.name"]);
    await expect(page.locator("#page-guide")).toContainText(messages["cacheStatus.scope"]);
    await page.getByTestId("cache-status-sample").focus();
    await page.keyboard.press("Enter");
    const rows = page.getByTestId("cache-status-row");
    await expect(rows.locator("h3")).toHaveText(["shield", "Edge cache"]);
    await expect(rows.nth(0)).toContainText(messages["cacheStatus.hit"]);
    await expect(rows.nth(0)).toContainText("-12");
    await expect(rows.nth(1)).toContainText(messages["cacheStatus.reason.stale"]);
    await expect(rows.nth(1)).toContainText("304");
    await rows.nth(1).locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(rows.nth(1).getByText("stored=?1")).toBeVisible();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId("theme-" + theme).click();
      await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" &&
        testInfo.project.name.startsWith("chromium-") &&
        ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      if (capture) {
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          window.scrollTo(0, 0);
        });
        await page.screenshot({ fullPage: true, path: `docs/screenshots/cache-status-${locale}-${theme}-${testInfo.project.name.slice(9)}.png` });
      }
    }
  });
}

test("explicit complete export, error invalidation and memory-only input", async ({ page }) => {
  await page.goto("./en/tools/cache-status/");
  const input = page.locator("#cache-status-input");
  const result = page.getByTestId("cache-status-result");
  const detail = "<img src='https://example.invalid/" + PRIVATE + "'>";
  await input.fill('edge; fwd=vary-miss; collapsed=?0; ttl=0; detail="' + detail + '"');
  await result.locator("summary").click();
  await expect(result).toContainText(detail);
  await expect(result.locator("img")).toHaveCount(0);

  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-cache-status.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  const json = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(json.caches).toEqual([{
    name: "edge",
    outcome: "forwarded",
    forwarded: "vary-miss",
    forwardedStatus: null,
    ttl: "0",
    parameters: [
      { name: "fwd", kind: "token", value: "vary-miss" },
      { name: "collapsed", kind: "boolean", value: false },
      { name: "ttl", kind: "integer", value: "0" },
      { name: "detail", kind: "string", value: detail },
    ],
  }]);
  expect(JSON.stringify(await page.evaluate(() => ({
    local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookies: document.cookie,
  })))).not.toContain(PRIVATE);
  await input.fill("edge; hit; fwd=miss");
  await expect(result).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveText(cacheStatusMessages.en["errors.CACHE_STATUS_PARAMETER"]);
  await page.reload();
  await expect(input).toHaveValue("");
});

test("uses cancellable deferred application and rejects oversized raw CRLF paste", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-22T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-22T00:01:00Z"));
  await page.goto("./en/tools/cache-status/");
  const input = page.locator("#cache-status-input");
  const result = page.getByTestId("cache-status-result");
  await page.getByTestId("cache-status-sample").click();
  await expect(result).toBeVisible();
  const prevented = await input.evaluate((element) => {
    const editor = element as HTMLTextAreaElement;
    editor.select();
    const text = 'Cache-Status: edge; detail="' + "a".repeat(8144) + '"\r\nCache-Status: next';
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => text } });
    editor.dispatchEvent(paste);
    return paste.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(result).toHaveCount(0);
  await expect(page.getByText(cacheStatusMessages.en["cacheStatus.rejected"])).toBeVisible();
  await input.fill('edge; detail="' + "a".repeat(2048) + '"');
  const control = page.getByTestId("apply-control");
  await expect(control).toHaveAttribute("data-status", "pending");
  await page.getByTestId("cache-status-cancel").click();
  await page.clock.fastForward(1000);
  await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").focus();
  await page.keyboard.press("Enter");
  await expect(result).toBeVisible();
});
