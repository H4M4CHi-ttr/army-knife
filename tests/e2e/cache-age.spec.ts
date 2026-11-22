import { readFile } from "node:fs/promises";
import { expect, test as base } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { cacheAgeMessages } from "../../src/i18n/cache-age";
import { CACHE_AGE_SAMPLE, CACHE_AGE_TIMES } from "../../src/lib/tools/cache-age-sample";

const PRIVATE = "CACHE_AGE_PRIVATE_SYNTHETIC";
const privateEvaluation = "2027-04-19T02:37:41.178Z";
const privateResult = "12710264.928";
const allowed = readFile("dist/public-assets.json", "utf8").then((text) => parsePublicAssets(text));

const test = base.extend<{ audit: void }>({
  audit: [async ({ context, page, baseURL }, use) => {
    const requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [];
    const diagnostics: string[] = [];
    context.on("request", (request) => requests.push({
      url: request.url(), method: request.method(), headers: request.headers(), body: request.postData(),
    }));
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || [PRIVATE, privateEvaluation, privateResult].some((value) => message.text().includes(value))) {
        diagnostics.push(message.text());
      }
    });
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
    for (const value of [PRIVATE, privateEvaluation, privateResult]) {
      expect(JSON.stringify(requests)).not.toContain(value);
    }
    expect(diagnostics).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["en", "ja", "zh-CN", "zh-TW", "ko"] as const) {
  test(`Cache Age labels, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    await page.goto(`./${locale}/tools/cache-age/`);
    const m = cacheAgeMessages[locale];
    const result = page.getByTestId("cache-age-result");
    const headers = page.getByLabel(m["cacheAge.headers"], { exact: true });
    await expect(page.locator("h1")).toHaveText(m["tool.cache-age.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["cacheAge.scope"]);
    await expect(page.getByTestId("cache-age-incomplete")).toHaveText(m["cacheAge.incomplete"]);
    await expect(headers).toHaveValue("");
    expect((await headers.boundingBox())!.height).toBeLessThan(100);
    await page.getByTestId("cache-age-sample").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("cache-age-current")).toHaveText("24.625 s");
    await expect(result.locator("dd")).toHaveText(["12.500 s", "1.250 s", "16.250 s", "16.250 s", "8.375 s"]);
    await expect(result).toContainText(m["cacheAge.winner.corrected"]);
    for (const field of CACHE_AGE_TIMES) {
      const time = page.getByLabel(m[`cacheAge.${field}`], { exact: true });
      await expect(time).toHaveValue(CACHE_AGE_SAMPLE[field]);
      expect((await time.boundingBox())!.height).toBeLessThan(75);
    }
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId("theme-" + theme).click();
      await page.getByTestId("settings-close").click();
      const html = page.locator("html");
      if (theme === "dark") await expect(html).toHaveClass(/\bdark\b/);
      else await expect(html).not.toHaveClass(/\bdark\b/);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark")) {
        await testInfo.attach(`cache-age-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
      }
    }
    await headers.fill("Age: 0");
    await expect(result).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveText(m["errors.CACHE_AGE_DATE_MISSING"]);
    await page.getByTestId("cache-age-clear").focus();
    await page.keyboard.press("Enter");
    await expect(headers).toHaveValue("");
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("bounded input, stale-result removal, and memory-only lifecycle", async ({ page }) => {
  await page.goto("./en/tools/cache-age/");
  const headers = page.locator("#cache-age-input");
  const at = page.locator("#cache-age-evaluation");
  const current = page.getByTestId("cache-age-current");
  const m = cacheAgeMessages.en;
  const sample = page.getByTestId("cache-age-sample");
  await sample.click();
  await at.fill(privateEvaluation);
  await expect(current).toHaveText(privateResult + " s");
  await headers.fill(CACHE_AGE_SAMPLE.headers.replace("15", "9".repeat(40)));
  await expect(current).toHaveText((BigInt("9".repeat(40)) + 12710249n).toString() + ".928 s");
  expect((await current.innerText()).length).toBe(47);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await headers.fill(CACHE_AGE_SAMPLE.headers + "\nAge: 0");
  await expect(page.getByRole("alert")).toHaveText(m["errors.CACHE_AGE_DUPLICATE"]);
  await expect(current).toHaveCount(0);
  await headers.fill(CACHE_AGE_SAMPLE.headers);
  await expect(current).toHaveText(privateResult + " s");
  const rejected = await at.evaluate((element) => {
    const editor = element as HTMLTextAreaElement;
    editor.select();
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(25) } });
    editor.dispatchEvent(paste);
    return paste.defaultPrevented;
  });
  expect(rejected).toBe(true);
  await expect(page.getByText(m["cacheAge.rejected"])).toBeVisible();
  await expect(current).toHaveCount(0);
  await at.fill(CACHE_AGE_SAMPLE.evaluation);
  await expect(current).toHaveText("24.625 s");
  await headers.fill(`<img src="https://example.invalid/${PRIVATE}">`);
  await expect(page.locator("#main-content img")).toHaveCount(0);
  await expect(page.locator("#main-content")).not.toContainText(PRIVATE);
  const storage = JSON.stringify(await page.evaluate(() => ({
    local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie,
  })));
  for (const value of [PRIVATE, privateEvaluation, privateResult]) expect(storage).not.toContain(value);
  await page.reload();
  await expect(headers).toHaveValue("");
  await expect(at).toHaveValue("");
  await sample.click();
  await page.locator(".back-link").click();
  await page.getByTestId("tool-card-cache-age").click();
  await expect(current).toHaveCount(0);
  await expect(headers).toHaveValue("");
  await sample.click();
  await page.getByTestId("settings-button").click();
  await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.locator("h1")).toHaveText(cacheAgeMessages.ja["tool.cache-age.name"]);
  await expect(headers).toHaveValue("");
  await expect(at).toHaveValue("");
  await expect(current).toHaveCount(0);
});
