import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { httpRangeMessages } from "../../src/i18n/http-range";

const PRIVATE = "PRIVATE_RANGE_9167";
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
  test(`HTTP byte range exact results, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = httpRangeMessages[locale];
    await page.goto(`./${locale}/tools/http-range/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.http-range.description"]);
    await expect(page.locator("#http-range-input")).toHaveValue("");
    await expect(page.locator("#http-range-length")).toHaveValue("");
    const result = page.getByTestId("range-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("range-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("range-covered")).toHaveText("200");
    await expect(result).toContainText("250");
    await expect(result).toContainText(m["range.overlap"]);
    await expect(result).toContainText("bytes 950-999/1000");
    await page.locator("#http-range-length").fill("0");
    await expect(result).toContainText(m["range.status.empty"]);
    await expect(result).not.toContainText("0--1");
    await page.locator("#http-range-input").fill("bytes=9007199254740993-");
    await page.locator("#http-range-length").fill("9007199254740997");
    await expect(page.getByTestId("range-covered")).toHaveText("4");
    await expect(result).toContainText("bytes 9007199254740993-9007199254740996/9007199254740997");
    await page.getByTestId("range-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/http-range-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`http-range-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
  });
}

test("HTTP range explicit export, inert hostile input and memory-only lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/http-range/");
  await page.getByTestId("range-sample").click();
  const result = page.getByTestId("range-result");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toMatchObject({ length: "1000", memberBytes: "250", coveredBytes: "200", overlaps: true, members: expect.any(Array) });
  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-http-range.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  await page.locator("#http-range-input").fill(`<img src='https://example.invalid/${PRIVATE}'>`);
  await expect(result).toHaveCount(0);
  await expect(page.locator(".tool-panel img")).toHaveCount(0);
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload();
  await expect(page.locator("#http-range-input")).toHaveValue("");
  await expect(page.locator("#http-range-length")).toHaveValue("");
  await page.getByTestId("range-sample").click();
  if (await page.locator(".mobile-menu").isVisible()) await page.locator(".mobile-menu").click();
  await page.locator('a[href="/army-knife/en/tools/cidr/"]').first().click();
  await expect(page.locator("#cidr-input")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#http-range-input")).toHaveValue("");
  await expect(page.locator("#http-range-length")).toHaveValue("");
});

test("HTTP range delayed/manual execution, cancellation and latest size", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("./en/tools/http-range/");
  await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  const long = "bytes=" + Array(32).fill("0".repeat(39) + "1-" + "9".repeat(40)).join(",");
  await page.locator("#http-range-length").fill("9".repeat(40));
  await page.locator("#http-range-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.fastForward(799);
  await expect(page.getByTestId("range-result")).toHaveCount(0);
  await page.clock.fastForward(1);
  await expect(page.getByTestId("range-result")).toBeVisible();
  await page.locator("#http-range-length").fill("1000");
  await expect(page.getByTestId("range-result")).toHaveCount(0);
  await page.getByTestId("range-cancel").click();
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("range-result")).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#http-range-length").fill("2000");
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("range-result")).toHaveCount(0);
  await page.getByTestId("apply-now").focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("range-covered")).toHaveText("1999");
  await page.locator("#http-range-length").fill("3000");
  await page.getByTestId("auto-apply-toggle").check();
  await page.clock.fastForward(800);
  await expect(page.getByTestId("range-covered")).toHaveText("2999");
});

test("HTTP range bounds and invalid fields clear every previous export", async ({ page }) => {
  await page.goto("./en/tools/http-range/");
  const result = page.getByTestId("range-result");
  for (const selector of ["#http-range-input", "#http-range-length"]) {
    await page.getByTestId("range-sample").click();
    expect(await page.locator(selector).evaluate((element) => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
      element.dispatchEvent(event); return event.defaultPrevented;
    })).toBe(true);
    await expect(result).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
    const other = selector === "#http-range-input" ? "#http-range-length" : "#http-range-input";
    await page.locator(other).fill(selector === "#http-range-input" ? "2000" : "bytes=0-49");
    await expect(result).toHaveCount(0);
    await page.locator(selector).evaluate((element) => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
      element.dispatchEvent(event);
    });
    await expect(result).toHaveCount(0);
    await page.locator(selector).fill(selector === "#http-range-input" ? "bytes=0-49" : "2000");
    await expect(result).toBeVisible();
  }
  await page.getByTestId("range-sample").click();
  for (const [input, code] of [
    ["bytes=0-1,9-8", "SYNTAX"], ["bytes=0-1,", "SYNTAX"], ["items=0-1", "SYNTAX"],
    ["bytes=0-1\nRange: bytes=2-3", "SYNTAX"],
    ["bytes=" + Array(33).fill("0-1").join(","), "LIMIT"],
    ["bytes=0-" + "9".repeat(41), "LIMIT"],
  ]) {
    await page.locator("#http-range-input").fill(input!);
    await expect(page.getByRole("alert")).toHaveText(httpRangeMessages.en[`errors.HTTP_RANGE_${code}` as keyof typeof httpRangeMessages.en]);
    await expect(result).toHaveCount(0);
  }
  await page.locator("#http-range-input").fill("bytes=-0,1000-");
  await expect(page.getByTestId("range-set")).toHaveText(httpRangeMessages.en["range.unsatisfiable"]);
  await page.locator("#http-range-length").fill("1e3");
  await expect(page.getByRole("alert")).toHaveText(httpRangeMessages.en["errors.HTTP_RANGE_LENGTH"]);
  await expect(result).toHaveCount(0);
  await page.getByTestId("range-clear").click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

