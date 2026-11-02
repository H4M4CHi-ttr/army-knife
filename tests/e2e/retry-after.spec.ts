import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { retryAfterMessages } from "../../src/i18n/retry-after";

const PRIVATE = "PRIVATE_RETRY_8461";
async function assets(dir: string, prefix = "/army-knife/"): Promise<string[]> {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map((entry) =>
    entry.isDirectory() ? assets(`${dir}/${entry.name}`, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
  ))).flat();
}
const allowed = assets("dist").then((paths) => new Set([
  ...paths, ...paths.filter((path) => path.endsWith("index.html")).map((path) => path.slice(0, -10)),
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

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`Retry-After exact results, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = retryAfterMessages[locale];
    await page.goto(`./${locale}/tools/retry-after/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.retry-after.description"]);
    await expect(page.locator("#retry-after-input")).toHaveValue("");
    await expect(page.locator("#retry-after-reference")).toHaveValue("");
    const result = page.getByTestId("retry-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("retry-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("retry-milliseconds")).toHaveText("119750");
    await expect(page.getByTestId("retry-seconds")).toHaveText("120");
    await expect(page.getByTestId("retry-target")).toHaveText("2026-11-03T00:02:00.000Z");
    await page.locator("#retry-after-input").fill("9007199254740993");
    await expect(page.getByTestId("retry-milliseconds")).toHaveText("9007199254740993000");
    await expect(page.getByTestId("retry-target-unavailable")).toHaveText(m["retry.outOfRange"]);
    await page.locator("#retry-after-input").fill("Tue, 03 Nov 2026 00:00:00 GMT");
    await expect(page.getByTestId("retry-past")).toHaveText(m["retry.past"]);
    await expect(page.getByTestId("retry-seconds")).toHaveText("0");
    await page.getByTestId("retry-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/retry-after-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`retry-after-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
  });
}

test("Retry-After explicit JSON, inert input and memory-only lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/retry-after/"); await page.getByTestId("retry-sample").click();
  const result = page.getByTestId("retry-result");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toEqual({ kind: "date", value: "Tue, 03 Nov 2026 00:02:00 GMT", referenceUtc: "2026-11-03T00:00:00.250Z", targetUtc: "2026-11-03T00:02:00.000Z", declaredDelaySeconds: null, waitMilliseconds: "119750", minimumWholeSeconds: "120", past: false });
  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-retry-after.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  await page.locator("#retry-after-input").fill(`<img src='https://example.invalid/${PRIVATE}'>`);
  await expect(result).toHaveCount(0); await expect(page.locator(".tool-panel img")).toHaveCount(0);
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator("#retry-after-input")).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("retry-sample").click();
  await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#retry-after-input")).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("Retry-After rejects malformed, obsolete and over-limit input without stale exports", async ({ page }) => {
  await page.goto("./en/tools/retry-after/"); await page.getByTestId("retry-sample").click();
  const result = page.getByTestId("retry-result");
  for (const text of ["-1", "Mon, 03 Nov 2026 00:00:00 GMT", "Tue, 31 Nov 2026 00:00:00 GMT", "Sun, 01 Jan 1899 00:00:00 GMT", "120, 240", "120\nRetry-After: 10", "9".repeat(41)]) {
    await page.locator("#retry-after-input").fill(text);
    await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.locator("#retry-after-input").fill("Sunday, 06-Nov-94 08:49:37 GMT");
  await expect(page.getByRole("alert")).toContainText("not necessarily invalid HTTP");
  await page.getByTestId("retry-sample").click();
  await page.locator("#retry-after-reference").fill("2026-02-29T00:00:00Z");
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText("valid UTC receipt time");
  for (const [selector, length] of [["#retry-after-input", 8193], ["#retry-after-reference", 65]] as const) {
    await page.getByTestId("retry-sample").click(); await expect(result).toBeVisible();
    await page.locator(selector).evaluate((element, count) => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(count) } });
      element.dispatchEvent(event);
    }, length);
    await expect(result).toHaveCount(0);
  }
  await page.getByTestId("retry-sample").click(); await expect(result).toBeVisible();
});

test("Retry-After 800ms waiting, cancel, manual apply and disposal", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-03T00:00:00Z") });
  await page.goto("./en/tools/retry-after/");
  await page.clock.pauseAt(new Date("2026-11-03T01:00:00Z"));
  await page.getByTestId("retry-sample").click();
  const input = page.locator("#retry-after-input"), result = page.getByTestId("retry-result");
  const source = "120" + " ".repeat(2100);
  await input.fill(source); await expect(result).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await expect(page.getByTestId("execution-status")).toHaveText("Applying after you pause");
  await expect(page.getByTestId("apply-now")).toContainText("0.8s");
  await page.clock.runFor(799); await expect(result).toHaveCount(0);
  await page.clock.runFor(1); await expect(page.getByTestId("retry-milliseconds")).toHaveText("120000");
  await input.fill(source + " "); await page.getByTestId("retry-cancel").focus(); await page.keyboard.press("Enter");
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("retry-sample").click(); await expect(result).toBeVisible();
  await input.fill(source); await page.getByTestId("auto-apply-toggle").uncheck();
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("retry-seconds")).toHaveText("120");
  await input.fill(source + "  "); await page.goto("./en/tools/etag/"); await page.clock.runFor(1000);
  await page.goto("./en/tools/retry-after/"); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
});
