import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base, expect } from "@playwright/test";
import { redisSlotsMessages } from "../../src/i18n/redis-slots";
import { REDIS_SLOTS_SAMPLE } from "../../src/lib/tools/redis-slots-sample";
import { parsePublicAssets } from "../../scripts/public-assets";

const PRIVATE = "PRIVATE_REDIS_SLOTS_175";
const allowed = readFile("dist/public-assets.json", "utf8").then(text => parsePublicAssets(text));
const test = base.extend<{ audit: void }>({
  audit: [async ({ context, page, baseURL }, use) => {
    const requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [];
    const errors: string[] = [], sockets: string[] = [];
    context.on("request", r => requests.push({ url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() }));
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error" || message.text().includes(PRIVATE)) errors.push(message.text()); });
    page.on("websocket", socket => sockets.push(socket.url()));
    await use();
    for (const request of requests) {
      const url = new URL(request.url);
      expect(url.origin).toBe(new URL(baseURL!).origin); expect((await allowed).has(url.pathname)).toBe(true);
      expect(url.search).toBe(""); expect(request.method).toBe("GET"); expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE); expect(errors).toEqual([]); expect(sockets).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("Redis key slots, keyboard, preview and themes in " + locale, async ({ page }, testInfo) => {
    const m = redisSlotsMessages[locale], result = page.getByTestId("redis-slots-result");
    await page.goto("./" + locale + "/tools/redis-slots/");
    await expect(page.locator("h1")).toHaveText(m["tool.redis-slots.name"]);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(result).toHaveCount(0);
    await page.getByTestId("redis-slots-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("redis-slots-slot").first()).toHaveText("3443");
    const slotBox = await page.getByTestId("redis-slots-slot").first().boundingBox();
    expect(slotBox).not.toBeNull();
    expect(slotBox!.x).toBeGreaterThanOrEqual(0);
    expect(slotBox!.x + slotBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expect(page.getByTestId("redis-slots-key")).toHaveCount(5);
    await expect(page.getByTestId("redis-slots-key").nth(2)).toContainText(m["redis.wholeKey"]);
    await expect(page.getByTestId("redis-slots-key").nth(3)).toContainText('"{bar"');
    await expect(page.getByTestId("redis-slots-slot").last()).toHaveText("0");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? "docs/screenshots/redis-slots-" + locale + "-" + theme + "-" + (testInfo.project.name.endsWith("small") ? "small" : "desktop") + ".png" : undefined;
      await testInfo.attach("redis-slots-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    const region = result.getByRole("region"); await region.focus(); await expect(region).toBeFocused(); await page.keyboard.press("ArrowRight");
    await page.locator("#redis-slots-input").fill('["a{x}", "b{x}"]');
    await expect(page.getByTestId("redis-slots-same")).toHaveText(m["redis.same"]);
    await page.locator("#redis-slots-input").fill('[""]'); await expect(page.getByTestId("redis-slots-slot")).toHaveText("0");
    await page.getByTestId("redis-slots-clear").focus(); await page.keyboard.press("Enter"); await expect(result).toHaveCount(0);
  });
}

test("complete explicit JSON downloads, inert keys and memory-only lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { copies: string[] }).copies = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text: string) => { (window as unknown as { copies: string[] }).copies.push(text); },
    } });
  });
  await page.goto("./en/tools/redis-slots/");
  const result = page.getByTestId("redis-slots-result"), input = page.locator("#redis-slots-input");
  const keys = Array.from({ length: 128 }, (_, i) => "k{" + i + "}");
  await input.fill(JSON.stringify(keys)); await expect(result).toBeVisible();
  await expect(page.getByTestId("redis-slots-key")).toHaveCount(32); await expect(result.locator("caption")).toContainText("128");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied).keys.map((k: { key: string }) => k.key)).toEqual(keys);
  const pending = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe("army-knife-redis-slots.json");
  const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toBe(copied);
  const privateKey = '<img src="https://example.invalid/' + PRIVATE + '">\u0000\r\n😀';
  await input.fill(JSON.stringify([privateKey])); await expect(result).toContainText("\\u0000\\r\\n");
  await expect(page.locator("#main-content img, #main-content script")).toHaveCount(0);
  const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(await state())).not.toContain(PRIVATE);
  await input.fill('["' + PRIVATE + '", 1]'); await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  expect(await page.getByRole("alert").textContent()).not.toContain(PRIVATE);
  await page.reload(); await expect(input).toHaveValue("");
  await page.getByTestId("redis-slots-sample").click(); await page.locator(".back-link").click(); await page.getByTestId("tool-card-redis-slots").click();
  await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("redis-slots-sample").click(); await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("strict limits/imports and cancellable delayed/manual execution", async ({ page }) => {
  await page.goto("./en/tools/redis-slots/");
  const input = page.locator("#redis-slots-input"), result = page.getByTestId("redis-slots-result");
  const deferred = '["foo"]' + " ".repeat(2100);
  await input.fill(deferred); await page.getByTestId("redis-slots-cancel").click();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.waitForTimeout(900); await expect(result).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").uncheck(); await input.fill(deferred + " ");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("redis-slots-slot")).toHaveText("12182");
  await input.fill('["123456789"]'); await expect(page.getByTestId("redis-slots-slot")).toHaveText("12739");
  for (const bad of ["[]", "[1]", '["\\ud800"]', JSON.stringify(["😀".repeat(257)])]) {
    await input.fill(bad); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  }
  await input.fill('["foo"]');
  await input.evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } }); element.dispatchEvent(event);
  });
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  for (const bytes of [Buffer.from('\ufeff["foo"]'), Buffer.from([255]), Buffer.from("x".repeat(8193))]) {
    await page.getByTestId("redis-slots-sample").click();
    await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: bytes });
    await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: Buffer.from('["a\\rb", ""]') });
  await expect(result).toBeVisible(); await expect(page.getByTestId("redis-slots-key").first()).toContainText('"a\\rb"');
  await input.fill(deferred); await page.getByTestId("auto-apply-toggle").check();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await expect(page.getByTestId("redis-slots-slot")).toHaveText("12182");
});

test("pending local file reads hide exports and cannot overwrite a sample", async ({ page }) => {
  await page.goto("./en/tools/redis-slots/"); await page.getByTestId("redis-slots-sample").click();
  await page.evaluate(() => {
    const native = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      const bytes = await native.call(this);
      await new Promise<void>(resolve => { (window as unknown as { finishRead: () => void }).finishRead = resolve; }); return bytes;
    };
  });
  await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: Buffer.from('["foo"]') });
  await expect(page.locator("#redis-slots-input")).toBeDisabled(); await expect(page.getByTestId("redis-slots-result")).toHaveCount(0);
  await page.getByTestId("redis-slots-sample").click();
  await page.evaluate(() => (window as unknown as { finishRead: () => void }).finishRead());
  await expect(page.locator("#redis-slots-input")).toHaveValue(REDIS_SLOTS_SAMPLE);
  await expect(page.getByTestId("redis-slots-slot").first()).toHaveText("3443");
});

test("raw CRLF paste boundaries and protected original-byte workflow", async ({ page }) => {
  await page.goto("./en/tools/redis-slots/"); await page.getByTestId("redis-slots-sample").click();
  const input = page.locator("#redis-slots-input"), result = page.getByTestId("redis-slots-result");
  const paste = (value: string) => input.evaluate((element, text) => {
    const field = element as HTMLTextAreaElement; field.focus(); field.setSelectionRange(0, field.value.length);
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => text } }); field.dispatchEvent(event);
    return event.defaultPrevented;
  }, value);
  const exact = '["界"]\r\n' + " ".repeat(8183);
  expect(Buffer.byteLength(exact)).toBe(8192); expect(await paste(exact)).toBe(true);
  await expect(input).toHaveAttribute("readonly", ""); await expect(page.getByTestId("preserved-cr-input")).toBeVisible();
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("redis-slots-count")).toHaveText("1");
  const pending = page.waitForEvent("download"); await page.getByTestId("download-raw-cr-input").click();
  const download = await pending, chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toBe(exact);
  await page.getByTestId("replace-raw-cr-input").click(); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("redis-slots-sample").click(); expect(await paste(exact + " ")).toBe(true);
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
});

test.describe("production hostname privacy", () => {
  test.use({ baseURL: "https://h4m4chi-ttr.github.io/army-knife/" });
  test("same distribution never initializes external analytics on the published hostname", async ({ context, page }) => {
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== "https://h4m4chi-ttr.github.io" || !(await allowed).has(url.pathname) || url.search) { await route.abort(); return; }
      const name = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
      await route.fulfill({ path: resolve("dist", name.slice("/army-knife/".length)) });
    });
    await page.goto("./en/tools/redis-slots/"); await page.getByTestId("redis-slots-sample").click();
    await expect(page.getByTestId("redis-slots-slot").first()).toHaveText("3443");
    await page.locator("#redis-slots-input").fill(JSON.stringify([PRIVATE]));
    await expect(page.getByTestId("redis-slots-count")).toHaveText("1");
    expect(await page.evaluate(() => ({ dataLayer: "dataLayer" in window, cookie: document.cookie }))).toEqual({ dataLayer: false, cookie: "" });
    await expect(page.locator('script[src*="analytics"], script[src*="googletag"]')).toHaveCount(0);
  });
});
