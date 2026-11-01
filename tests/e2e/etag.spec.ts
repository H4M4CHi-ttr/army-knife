import { readdir } from "node:fs/promises";
import { expect, test as base, type Download, type Page } from "@playwright/test";
import { etagMessages } from "../../src/i18n/etag";

const PRIVATE = "PRIVATE_ETAG_118947";
async function assets(dir: string, prefix = "/army-knife/"): Promise<string[]> {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry =>
    entry.isDirectory() ? assets(`${dir}/${entry.name}`, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
  ))).flat();
}
const allowed = assets("dist").then(paths => new Set([
  ...paths, ...paths.filter(path => path.endsWith("index.html")).map(path => path.slice(0, -10)),
]));
const test = base.extend<{ audit: void }>({
  audit: [async ({ context, page, baseURL }, use) => {
    const requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [];
    const errors: string[] = [], sockets: string[] = [];
    context.on("request", request => requests.push({ url: request.url(), method: request.method(), headers: request.headers(), body: request.postData() }));
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error" || message.text().includes(PRIVATE)) errors.push(message.text()); });
    page.on("websocket", socket => sockets.push(socket.url()));
    await use();
    for (const request of requests) {
      const url = new URL(request.url);
      expect(url.origin).toBe(new URL(baseURL!).origin);
      expect((await allowed).has(url.pathname)).toBe(true);
      expect(url.search).toBe(""); expect(request.method).toBe("GET"); expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE);
    expect(errors).toEqual([]); expect(sockets).toEqual([]);
  }, { auto: true }],
});
async function open(page: Page, locale = "en") {
  const response = await page.goto(`./${locale}/tools/etag/`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("#etag-current")).toBeVisible();
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", "etag");
}
async function readDownload(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
async function privateState(page: Page) {
  expect(await page.evaluate(() => JSON.stringify({ url: location.href, local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain(PRIVATE);
}

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`ETag sample, keyboard, guides and themes in ${locale}`, async ({ page }, testInfo) => {
    await open(page, locale);
    await expect(page.locator("#etag-current")).toHaveValue("");
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(etagMessages[locale]["etag.exampleResult"]);
    await page.getByTestId("etag-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("etag-status")).toHaveText("304");
    await expect(page.getByTestId("etag-tag")).toHaveCount(3);
    await expect(page.getByTestId("etag-header-ifMatch")).toContainText(etagMessages[locale]["etag.condition.passed"]);
    await expect(page.getByTestId("etag-header-ifNoneMatch")).toContainText(etagMessages[locale]["etag.condition.failed"]);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      const geo = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, body: document.documentElement.scrollWidth }));
      expect(geo.body).toBeLessThanOrEqual(geo.viewport + 1);
      if ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark")) {
        const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-");
        const path = capture ? `docs/screenshots/etag-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
        await testInfo.attach(`etag-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
      }
    }
  });
}

test("method, strong/weak precedence, empty, absent, wildcard and unknown states", async ({ page }) => {
  await open(page); await page.getByTestId("etag-sample").click();
  await page.getByTestId("etag-method").selectOption("PUT"); await expect(page.getByTestId("etag-status")).toHaveText("412");
  await expect(page.getByTestId("etag-applied-exception")).toHaveCount(0);
  await page.locator("#etag-current").fill('W/"revision-2"');
  await expect(page.getByTestId("etag-applied-exception")).toContainText("already succeeded");
  await expect(page.getByTestId("etag-header-ifNoneMatch")).toContainText("Skipped");
  await page.locator("#etag-if-match").fill("");
  await expect(page.getByTestId("etag-header-ifMatch")).toContainText("Empty tag list");
  await page.getByTestId("etag-enable-match").focus(); await page.keyboard.press("Space");
  await expect(page.locator("#etag-if-match")).toBeDisabled();
  await page.locator("#etag-current").fill("");
  await expect(page.getByTestId("etag-incomplete")).toBeVisible();
  await expect(page.getByTestId("etag-status")).toHaveText("No status inferred");
  await page.locator("#etag-if-none-match").fill("*");
  await expect(page.getByTestId("etag-status")).toHaveText("412");
  await page.getByTestId("etag-exists").uncheck();
  await expect(page.getByTestId("etag-decision")).toContainText("Continue");
  await expect(page.locator("#etag-current")).toBeDisabled();
  await page.locator("#etag-if-none-match").fill('"*"');
  await expect(page.getByTestId("etag-decision")).toContainText("Continue");
  await page.getByTestId("etag-enable-match").check(); await page.locator("#etag-if-match").fill("*");
  await expect(page.getByTestId("etag-status")).toHaveText("412");
});

test("exact JSON export, literal markup/octet display, inactive omission and clearing", async ({ page }) => {
  await open(page);
  const opaque = `${PRIVATE}<img/src=x>,https://example.invalid/\\\u0080`, raw = `"${opaque}"`;
  await page.locator("#etag-current").fill(raw); await page.getByTestId("etag-enable-none").check();
  await page.locator("#etag-if-none-match").fill(raw);
  const result = page.getByTestId("etag-result");
  await expect(result).toContainText("\\u0080"); await expect(result).not.toContainText("\u0080");
  await expect(result.locator("a, img")).toHaveCount(0);
  const pending = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending, text = await readDownload(download);
  expect(download.suggestedFilename()).toBe("army-knife-etag.json");
  expect(JSON.parse(text)).toMatchObject({ decision: "not-modified", usualStatus: 304, current: { opaque }, ifNoneMatch: { tags: [{ opaque, matches: true }] } });
  expect(text).toContain("\\u0080");
  await page.getByTestId("etag-exists").uncheck(); await page.getByTestId("etag-enable-none").uncheck();
  await expect(result).not.toContainText(PRIVATE);
  const omitted = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  const omittedText = await readDownload(await omitted);
  expect(omittedText).not.toContain(PRIVATE); expect(JSON.parse(omittedText)).toMatchObject({ current: null, currentIgnored: true, ifNoneMatch: { kind: "absent", tags: [] } });
  await privateState(page); await page.reload();
  await expect(page.locator("#etag-current")).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("etag-sample").click(); await page.goto("./ja/tools/etag/");
  await expect(page.locator("#etag-current")).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("real UTF-8 file import, all-or-error syntax and input bounds", async ({ page }) => {
  await open(page); await page.getByTestId("etag-sample").click();
  await page.locator("#etag-if-none-match-file").setInputFiles({ name: "recorded.txt", mimeType: "text/plain", buffer: Buffer.from(', W/"revision-2",, "other",') });
  await expect(page.getByTestId("etag-status")).toHaveText("304");
  await expect(page.getByTestId("etag-header-ifNoneMatch")).toContainText("Ignored empty list elements: 3");
  const result = page.getByTestId("etag-result");
  await page.locator("#etag-if-match").fill('"different"');
  await page.locator("#etag-if-none-match").fill(PRIVATE);
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).not.toContainText(PRIVATE);
  await page.getByTestId("etag-sample").click();
  await page.locator("#etag-if-match").fill(Array(65).fill('"x"').join(","));
  await expect(page.getByRole("alert")).toContainText("64 tags"); await expect(result).toHaveCount(0);
  await page.getByTestId("etag-sample").click();
  await page.locator("#etag-current").fill('"' + "x".repeat(511) + '"');
  await expect(page.getByRole("alert")).toContainText("512 UTF-8 bytes");
  await page.getByTestId("etag-sample").click();
  await page.locator("#etag-if-match-file").setInputFiles({ name: "oversize.txt", mimeType: "text/plain", buffer: Buffer.alloc(8193, 32) });
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText("size limit");
  await page.getByTestId("etag-enable-match").uncheck(); await expect(result).toBeVisible();
  await page.getByTestId("etag-enable-match").check(); await expect(result).toHaveCount(0);
  await page.getByTestId("etag-sample").click();
  await page.locator("#etag-current-file").setInputFiles({ name: "invalid-utf8.txt", mimeType: "text/plain", buffer: Buffer.from([0xff]) });
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  await privateState(page);
});

test("800ms delay, cancellation, manual apply, total bytes and rejected paste", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await open(page); await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  await page.getByTestId("etag-sample").click();
  const source = '"revision-2"' + " ".repeat(2100), result = page.getByTestId("etag-result");
  await page.locator("#etag-if-none-match").fill(source);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(799); await expect(result).toHaveCount(0);
  await page.clock.runFor(1); await expect(page.getByTestId("etag-status")).toHaveText("304");
  await page.locator("#etag-if-none-match").fill(source + " "); await expect(result).toHaveCount(0);
  await page.getByTestId("etag-cancel").focus(); await page.keyboard.press("Enter");
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("etag-sample").click(); await expect(page.getByTestId("etag-status")).toHaveText("304");
  await page.locator("#etag-if-none-match").fill(source);
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").focus(); await page.keyboard.press("Enter"); await expect(result).toBeVisible();
  await page.locator("#etag-if-none-match").evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    element.dispatchEvent(event);
  });
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText("size limit");
  await page.getByTestId("etag-sample").click();
  await page.locator("#etag-if-match").fill(" ".repeat(8190));
  await page.getByTestId("apply-now").click();
  await expect(page.getByRole("alert")).toContainText("size limit"); await expect(result).toHaveCount(0);
  await page.getByTestId("etag-clear").click(); await expect(result).toHaveCount(0);
  await privateState(page);
});
