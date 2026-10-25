import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { idnMessages } from "../../src/i18n/idn";

const PRIVATE = "PRIVATE_IDN_9167";
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
  test(`IDN normalization, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = idnMessages[locale];
    await page.goto(`./${locale}/tools/idn/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.idn.description"]);
    await expect(page.locator("#idn-input")).toHaveValue("");
    const result = page.getByTestId("idn-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("idn-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("idn-ascii")).toHaveText("xn--bcher-kva.example");
    await expect(page.getByTestId("idn-unicode")).toHaveText("bücher.example");
    await expect(result).toContainText("U+00FC");
    await expect(result).toContainText(m["idn.mapping"]);
    await page.locator("#idn-input").fill("例え.テスト");
    await expect(page.getByTestId("idn-ascii")).toHaveText("xn--r8jz45g.xn--zckzah");
    await page.locator("#idn-input").fill("xn--vi8h.example");
    await expect(page.getByTestId("idn-unicode")).toHaveText("🍕.example");
    await expect(result).toContainText("U+1F355");
    await page.locator("#idn-input").fill("pаypal.example");
    await expect(result).toContainText(m["idn.warning.mixed"]);
    await expect(result).toContainText(m["idn.warning.lookalike"]);
    await page.locator("#idn-input").fill("bücher.123.example");
    await expect(page.getByTestId("idn-ascii")).toHaveText("xn--bcher-kva.123.example");
    await page.locator("#idn-input").fill("BÜCHER。ＥＸＡＭＰＬＥ．");
    await expect(page.getByTestId("idn-ascii")).toHaveText("xn--bcher-kva.example.");
    await page.getByTestId("idn-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/idn-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`idn-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
  });
}

test("IDN explicit export and memory-only inert lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/idn/");
  await page.getByTestId("idn-sample").click();
  const result = page.getByTestId("idn-result");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toMatchObject({ input: "bücher。example", ascii: "xn--bcher-kva.example", unicode: "bücher.example", changed: true, labels: expect.any(Array) });
  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-idn.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  await expect(result.locator("a")).toHaveCount(0);
  await page.locator("#idn-input").fill(`<img src='https://example.invalid/${PRIVATE}'>`);
  await expect(result).toHaveCount(0);
  await expect(page.locator(".tool-panel img")).toHaveCount(0);
  await page.locator("#idn-input").fill("private-idn-9167.example");
  await expect(result).toBeVisible();
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toMatch(/PRIVATE_IDN_9167|private-idn-9167/);
  await page.reload();
  await expect(page.locator("#idn-input")).toHaveValue("");
  await expect(result).toHaveCount(0);
  await page.getByTestId("idn-sample").click();
  if (await page.locator(".mobile-menu").isVisible()) await page.locator(".mobile-menu").click();
  await page.locator('a[href="/army-knife/en/tools/cidr/"]').first().click();
  await expect(page.locator("#cidr-input")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#idn-input")).toHaveValue("");
});

test("IDN delayed/manual execution, cancel and latest input", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("./en/tools/idn/");
  await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  const long = [63, 63, 40].map(n => "a".repeat(n)).join(".");
  await page.locator("#idn-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.fastForward(799);
  await expect(page.getByTestId("idn-result")).toHaveCount(0);
  await page.clock.fastForward(1);
  await expect(page.getByTestId("idn-result")).toBeVisible();
  await page.locator("#idn-input").fill(long + "b");
  await expect(page.getByTestId("idn-result")).toHaveCount(0);
  await page.getByTestId("idn-cancel").click();
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("idn-result")).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#idn-input").fill(long + "c");
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("idn-result")).toHaveCount(0);
  await page.getByTestId("apply-now").focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("idn-ascii")).toHaveText(long + "c");
  await page.locator("#idn-input").fill(long + "d");
  await page.getByTestId("auto-apply-toggle").check();
  await page.clock.fastForward(800);
  await expect(page.getByTestId("idn-ascii")).toHaveText(long + "d");
});

test("IDN bounds, malformed ACE and URL/IP syntax clear previous exports", async ({ page }) => {
  await page.goto("./en/tools/idn/");
  const result = page.getByTestId("idn-result");
  await page.getByTestId("idn-sample").click();
  expect(await page.locator("#idn-input").evaluate((element) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(2049) } });
    element.dispatchEvent(event); return event.defaultPrevented;
  })).toBe(true);
  await expect(result).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await page.getByTestId("idn-sample").click();
  expect(await page.locator("#idn-input").evaluate((element) => {
    const files = new DataTransfer();
    files.items.add(new File(["new.example"], "domain.txt", { type: "text/plain" }));
    const event = new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: files });
    element.dispatchEvent(event); return event.defaultPrevented;
  })).toBe(true);
  await expect(result).toHaveCount(0);
  await expect(page.locator("#idn-input")).toBeEnabled();
  for (const [input, code] of [
    ["xn--a.example", "SYNTAX"], ["xn--abc-.example", "SYNTAX"], ["a..example", "SYNTAX"],
    ["https://example.com", "SYNTAX"], ["example.com:80", "SYNTAX"], ["example.com\n", "SYNTAX"],
    ["127.1", "IP"], ["0x7f000001", "IP"],
    ["a".repeat(64) + ".example", "LIMIT"],
  ]) {
    await page.locator("#idn-input").fill(input!);
    await expect(page.getByRole("alert")).toHaveText(idnMessages.en[`errors.IDN_${code}` as keyof typeof idnMessages.en]);
    await expect(result).toHaveCount(0);
  }
  await page.getByTestId("idn-sample").click();
  await expect(result).toBeVisible();
  await page.getByTestId("idn-clear").click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(result).toHaveCount(0);
});

