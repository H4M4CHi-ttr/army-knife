import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { cacheControlMessages } from "../../src/i18n/cache-control";

const PRIVATE = "PRIVATE_CACHE_CONTROL_7261";
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
    const errors: string[] = [];
    const sockets: string[] = [];
    context.on("request", (request) => requests.push({ url: request.url(), method: request.method(), headers: request.headers(), body: request.postData() }));
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error" || message.text().includes(PRIVATE)) errors.push(message.text()); });
    page.on("websocket", (socket) => sockets.push(socket.url()));
    await use();
    for (const request of requests) {
      const url = new URL(request.url);
      expect(url.origin).toBe(new URL(baseURL!).origin);
      expect((await allowed).has(url.pathname)).toBe(true);
      expect(url.search).toBe("");
      expect(request.method).toBe("GET");
      expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE);
    expect(errors).toEqual([]);
    expect(sockets).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`Cache-Control localized directives, errors, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const messages = cacheControlMessages[locale];
    await page.goto(`./${locale}/tools/cache-control/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(messages["tool.cache-control.description"]);
    await expect(page.locator("#cache-control-input")).toHaveValue("");
    await expect(page.getByTestId("cache-control-result")).toHaveCount(0);
    await page.getByTestId("cache-control-sample").focus();
    await page.keyboard.press("Enter");
    const result = page.getByTestId("cache-control-result");
    await expect(result.locator(".cache-directive")).toHaveCount(5);
    await expect(result.locator('[data-directive="max-age"]')).toContainText(messages["cache.meaning.max-age"]);
    await page.locator("#cache-control-input").fill('private="Set-Cookie, ETag", max-age=9007199254740993, MAX-AGE="60", x-demo="a, b"');
    await expect(result.locator(".cache-directive")).toHaveCount(4);
    await expect(result).toContainText("9007199254740993");
    await expect(result.locator('[data-note="duplicate"]')).toHaveCount(2);
    await expect(result.locator('[data-note="extension"]')).toHaveText(messages["cache.note.extension"]);
    await expect(result.locator('[data-note="quoted-seconds"]')).toHaveText(messages["cache.note.quoted-seconds"]);
    await page.locator("#cache-control-input").fill("max-age=-1");
    await expect(result.locator('[data-note="invalid-argument"]')).toHaveText(messages["cache.note.invalid-argument"]);
    await page.locator("#cache-control-input").fill('max-age="unfinished');
    await expect(page.getByRole("alert")).toHaveText(messages["errors.CACHE_CONTROL_SYNTAX"]);
    await expect(result).toHaveCount(0);
    await page.locator("#cache-control-input").fill("Cache-Control: public\r\n Cache-Control: private");
    await expect(page.getByRole("alert")).toHaveText(messages["errors.CACHE_CONTROL_HEADERS"]);
    await expect(result).toHaveCount(0);
    await page.getByTestId("cache-control-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
      await testInfo.attach(`cache-control-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
  });
}

test("Cache-Control exports explicitly, keeps markup inert and clears private input on reload/navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/cache-control/");
  const input = `x-note="<img src='https://example.invalid/${PRIVATE}' onerror='alert(1)'>", no-cache`;
  await page.locator("#cache-control-input").fill(input);
  const result = page.getByTestId("cache-control-result");
  await expect(result).toContainText(PRIVATE);
  await expect(result.locator("img")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied).directives[0].value).toContain(PRIVATE);
  const downloadPromise = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("army-knife-cache-control.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload();
  await expect(page.locator("#cache-control-input")).toHaveValue("");
  await expect(result).toHaveCount(0);
  await page.locator("#cache-control-input").fill(input);
  if (await page.locator(".mobile-menu").isVisible()) await page.locator(".mobile-menu").click();
  await page.locator('a[href="/army-knife/en/tools/cidr/"]').first().click();
  await expect(page.locator("#cidr-input")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#cache-control-input")).toHaveValue("");
});

test("long Cache-Control input waits, cancels and supports keyboard manual apply", async ({ page }) => {
  await page.clock.install();
  await page.goto("./en/tools/cache-control/");
  const long = `x="${"a".repeat(1024)}", y="${"b".repeat(1024)}", max-age=60`;
  await page.locator("#cache-control-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.getByTestId("cache-control-cancel").click();
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("cache-control-result")).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#cache-control-input").fill(long + ", public");
  await page.getByTestId("apply-now").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("cache-control-result").locator(".cache-directive")).toHaveCount(4);
  await page.locator("#cache-control-input").fill(long + ", no-store");
  await expect(page.getByTestId("cache-control-result")).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").check();
  await page.clock.fastForward(900);
  await expect(page.getByTestId("cache-control-result").locator(".cache-directive")).toHaveCount(4);
});

test("Cache-Control rejects oversized paste and structural bounds without stale exports", async ({ page }) => {
  await page.goto("./en/tools/cache-control/");
  await page.getByTestId("cache-control-sample").click();
  const prevented = await page.locator("#cache-control-input").evaluate((element) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(page.getByTestId("cache-control-result")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  for (const invalid of ["public,".repeat(129), "Cache-Control: public\n".repeat(33), 'x="' + "a".repeat(1025) + '"']) {
    await page.locator("#cache-control-input").fill(invalid);
    await expect(page.getByRole("alert")).toHaveText(cacheControlMessages.en["errors.CACHE_CONTROL_LIMIT"]);
    await expect(page.getByTestId("cache-control-result")).toHaveCount(0);
  }
  await page.getByTestId("cache-control-clear").click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.locator("#cache-control-input").fill("no-store");
  await expect(page.getByTestId("cache-control-result")).toBeVisible();
});
