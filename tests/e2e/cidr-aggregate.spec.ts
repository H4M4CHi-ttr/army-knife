import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base, expect } from "@playwright/test";
import { cidrAggregateMessages } from "../../src/i18n/cidr-aggregate";
import { CIDR_AGGREGATE_SAMPLE } from "../../src/lib/tools/cidr-aggregate-sample";
import { parsePublicAssets } from "../../scripts/public-assets";

const PRIVATE = "PRIVATE_CIDR_AGGREGATE_177";
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
  test("exact CIDR union, keyboard and themes in " + locale, async ({ page }, testInfo) => {
    const m = cidrAggregateMessages[locale], result = page.getByTestId("cidr-aggregate-result");
    await page.goto("./" + locale + "/tools/cidr-aggregate/");
    await expect(page.locator("h1")).toHaveText(m["tool.cidr-aggregate.name"]);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(result).toHaveCount(0);
    await page.getByTestId("cidr-aggregate-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("cidr-aggregate-prefixes")).toHaveText("192.0.2.0/24\n198.51.100.0/24\n");
    await expect(page.getByTestId("cidr-aggregate-input-count")).toHaveText("5");
    await expect(page.getByTestId("cidr-aggregate-output-count")).toHaveText("2");
    await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("512");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? "docs/screenshots/cidr-aggregate-" + locale + "-" + theme + "-" + (testInfo.project.name.endsWith("small") ? "small" : "desktop") + ".png" : undefined;
      await testInfo.attach("cidr-aggregate-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.getByTestId("cidr-aggregate-prefixes").focus(); await expect(page.getByTestId("cidr-aggregate-prefixes")).toBeFocused(); await page.keyboard.press("ArrowDown");
    await page.getByTestId("cidr-aggregate-ipv6-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("cidr-aggregate-prefixes")).toHaveText("2001:db8::/64\n");
    await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("18446744073709551616");
    await page.locator("#cidr-aggregate-input").fill('["::/0"]');
    await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("340282366920938463463374607431768211456");
    await page.getByTestId("cidr-aggregate-clear").focus(); await page.keyboard.press("Enter"); await expect(result).toHaveCount(0);
  });
}

test("two complete explicit exports and memory-only lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { copies: string[] }).copies = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text: string) => { (window as unknown as { copies: string[] }).copies.push(text); },
    } });
  });
  await page.goto("./en/tools/cidr-aggregate/");
  const result = page.getByTestId("cidr-aggregate-result"), input = page.locator("#cidr-aggregate-input");
  const values = Array.from({ length: 128 }, (_, i) => `10.0.${i}.0/32`), text = values.join("\n") + "\n";
  await input.fill(JSON.stringify(values)); await expect(result).toBeVisible();
  await expect(page.getByTestId("cidr-aggregate-output-count")).toHaveText("128");
  expect(await page.getByTestId("cidr-aggregate-prefixes").textContent()).toBe(text);
  await page.getByTestId("cidr-aggregate-prefixes").focus(); await page.keyboard.press("End");
  await expect.poll(() => page.getByTestId("cidr-aggregate-prefixes").evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  const list = page.getByTestId("cidr-aggregate-list"), json = page.getByTestId("cidr-aggregate-json");
  await list.getByRole("button", { name: "Copy", exact: true }).click();
  const copiedText = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!); expect(copiedText).toBe(text);
  const listPending = page.waitForEvent("download"); await list.getByRole("button", { name: "Download", exact: true }).click();
  const listDownload = await listPending; expect(listDownload.suggestedFilename()).toBe("army-knife-cidr-aggregate.txt");
  const textChunks: Buffer[] = []; for await (const chunk of (await listDownload.createReadStream())!) textChunks.push(chunk);
  expect(Buffer.concat(textChunks).toString("utf8")).toBe(text);
  await json.getByRole("button", { name: "Copy", exact: true }).click();
  const copiedJson = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[1]!);
  const report = JSON.parse(copiedJson); expect(report.prefixes.map((p: { cidr: string }) => p.cidr)).toEqual(values); expect(report.addressCount).toBe("128");
  const jsonPending = page.waitForEvent("download"); await json.getByRole("button", { name: "Download", exact: true }).click();
  const jsonDownload = await jsonPending; expect(jsonDownload.suggestedFilename()).toBe("army-knife-cidr-aggregate.json");
  const jsonChunks: Buffer[] = []; for await (const chunk of (await jsonDownload.createReadStream())!) jsonChunks.push(chunk);
  expect(Buffer.concat(jsonChunks).toString("utf8")).toBe(copiedJson);
  await input.fill(JSON.stringify(["192.0.2.0/24", '<img src="https://example.invalid/' + PRIVATE + '">']));
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await expect(page.locator("#main-content img, #main-content script")).toHaveCount(0);
  expect(await page.getByRole("alert").textContent()).not.toContain(PRIVATE);
  expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie })))).not.toContain(PRIVATE);
  await page.reload(); await expect(input).toHaveValue("");
  await page.getByTestId("cidr-aggregate-sample").click(); await page.locator(".back-link").click(); await page.getByTestId("tool-card-cidr-aggregate").click();
  await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("cidr-aggregate-sample").click(); await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("strict indexed errors, imports and cancellable delayed/manual operation", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-21T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-11-21T00:01:00Z"));
  await page.goto("./en/tools/cidr-aggregate/");
  const input = page.locator("#cidr-aggregate-input"), result = page.getByTestId("cidr-aggregate-result"), m = cidrAggregateMessages.en;
  const deferred = '["::/128"]' + " ".repeat(2100);
  await input.fill(deferred); await page.getByTestId("cidr-aggregate-cancel").click();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled"); await page.clock.runFor(900); await expect(result).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").uncheck(); await input.fill(deferred + " ");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("1");
  await input.fill('["::/0"]'); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("340282366920938463463374607431768211456");
  for (const [value, code] of [
    ['["192.0.2.0/24", "192.0.2.1/24"]', "CIDR_AGGREGATE_HOST_BITS"],
    ['["::/0", "0.0.0.0/0"]', "CIDR_AGGREGATE_MIXED"],
    ['["::/0", "bad"]', "CIDR_AGGREGATE_CIDR"],
  ] as const) {
    await input.fill(value); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText(m[("errors." + code) as keyof typeof m]);
    await expect(page.getByTestId("cidr-aggregate-error-position")).toContainText("2");
  }
  for (const value of ["[]", "[1]", JSON.stringify(Array(129).fill("::/0"))]) {
    await input.fill(value); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  }
  for (const bytes of [Buffer.from('\ufeff["::/0"]'), Buffer.from([255]), Buffer.from("x".repeat(8193))]) {
    await page.getByTestId("cidr-aggregate-sample").click();
    await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: bytes });
    await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: Buffer.from('["::ffff:192.0.2.0/120"]') });
  await expect(page.getByTestId("cidr-aggregate-prefixes")).toHaveText("::ffff:192.0.2.0/120\n");
  await input.fill(deferred); await page.getByTestId("auto-apply-toggle").check();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(799); await expect(result).toHaveCount(0); await page.clock.runFor(1); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("1");
});

test("pending file reads invalidate both exports and discard superseded completion", async ({ page }) => {
  await page.goto("./en/tools/cidr-aggregate/"); await page.getByTestId("cidr-aggregate-sample").click();
  await page.evaluate(() => {
    const native = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      const bytes = await native.call(this); await new Promise(resolve => setTimeout(resolve, 500));
      await new Promise<void>(resolve => { (window as unknown as { finishRead: () => void }).finishRead = resolve; }); return bytes;
    };
  });
  await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: Buffer.from('["::/128"]') });
  await expect(page.locator("#cidr-aggregate-input")).toBeDisabled(); await expect(page.getByTestId("cidr-aggregate-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await page.waitForFunction(() => typeof (window as unknown as { finishRead?: () => void }).finishRead === "function");
  await page.getByTestId("cidr-aggregate-sample").click(); await page.evaluate(() => (window as unknown as { finishRead: () => void }).finishRead());
  await expect(page.locator("#cidr-aggregate-input")).toHaveValue(CIDR_AGGREGATE_SAMPLE); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("512");
});

test("raw CRLF boundaries and protected original-byte workflow", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-21T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-11-21T00:01:00Z"));
  await page.goto("./en/tools/cidr-aggregate/"); await page.getByTestId("cidr-aggregate-sample").click();
  const input = page.locator("#cidr-aggregate-input"), result = page.getByTestId("cidr-aggregate-result");
  const paste = (value: string) => input.evaluate((element, text) => {
    const field = element as HTMLTextAreaElement; field.focus(); field.setSelectionRange(0, field.value.length);
    const event = new Event("paste", { bubbles: true, cancelable: true }); Object.defineProperty(event, "clipboardData", { value: { getData: () => text } }); field.dispatchEvent(event); return event.defaultPrevented;
  }, value);
  const base = '["::/0"]\r\n', exact = base + " ".repeat(8192 - base.length); expect(Buffer.byteLength(exact)).toBe(8192);
  expect(await paste(exact)).toBe(true); await expect(input).toHaveAttribute("readonly", ""); await expect(page.getByTestId("preserved-cr-input")).toBeVisible();
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("340282366920938463463374607431768211456");
  const pending = page.waitForEvent("download"); await page.getByTestId("download-raw-cr-input").click(); const download = await pending, chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk); expect(Buffer.concat(chunks).toString("utf8")).toBe(exact);
  await page.getByTestId("replace-raw-cr-input").click(); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("cidr-aggregate-sample").click(); expect(await paste(exact + " ")).toBe(true); await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
});

test.describe("production hostname privacy", () => {
  test.use({ baseURL: "https://h4m4chi-ttr.github.io/army-knife/" });
  test("same distribution has no external telemetry or input-bearing requests", async ({ context, page }) => {
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== "https://h4m4chi-ttr.github.io" || !(await allowed).has(url.pathname) || url.search) { await route.abort(); return; }
      const name = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname; await route.fulfill({ path: resolve("dist", name.slice("/army-knife/".length)) });
    });
    await page.goto("./en/tools/cidr-aggregate/"); await page.getByTestId("cidr-aggregate-sample").click(); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("512");
    await page.locator("#cidr-aggregate-input").fill(JSON.stringify([PRIVATE])); await expect(page.getByTestId("cidr-aggregate-result")).toHaveCount(0);
    expect(await page.evaluate(() => ({ dataLayer: "dataLayer" in window, cookie: document.cookie }))).toEqual({ dataLayer: false, cookie: "" });
    await expect(page.locator('script[src*="analytics"], script[src*="googletag"]')).toHaveCount(0);
  });
});
