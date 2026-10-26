import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { serverTimingMessages } from "../../src/i18n/server-timing";

const PRIVATE = "PRIVATE_SERVER_TIMING_8812";
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
  test(`Server-Timing localized metrics, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const messages = serverTimingMessages[locale];
    await page.goto(`./${locale}/tools/server-timing/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(messages["tool.server-timing.description"]);
    await expect(page.locator("#server-timing-input")).toHaveValue("");
    const result = page.getByTestId("server-timing-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("server-timing-sample").focus();
    await page.keyboard.press("Enter");
    await expect(result.locator(".timing-metric")).toHaveCount(3);
    await expect(result.locator('[data-metric="cache"]')).toContainText("hit, edge");
    await expect(result.locator('[data-metric="cache"]')).toContainText(messages["timing.unavailable"]);
    await page.locator("#server-timing-input").fill('db;dur=9007199254740993.125;dur=12;x-note="edge, warm", db;dur=bad, DB;DUR=3');
    await expect(result.locator(".timing-metric")).toHaveCount(3);
    await expect(result).toContainText("9007199254740993.125");
    await expect(result.locator('[data-note="duplicate-parameter"]')).toHaveText(messages["timing.note.duplicate-parameter"]);
    await expect(result.locator('[data-note="extension"]')).toHaveCount(2);
    await expect(result.locator('[data-note="duration-format"]')).toHaveText(messages["timing.note.duration-format"]);
    const parameters = result.locator("summary").first();
    await parameters.focus();
    await page.keyboard.press("Enter");
    await expect(result.locator(".timing-parameters").first()).toBeVisible();
    await expect(result.locator(".timing-parameters").first()).toContainText(messages["timing.ignored"]);
    await page.locator("#server-timing-input").fill('db;desc="unfinished');
    await expect(page.getByRole("alert")).toHaveText(messages["errors.SERVER_TIMING_SYNTAX"]);
    await expect(result).toHaveCount(0);
    await page.locator("#server-timing-input").fill("Server-Timing: db\r\n Server-Timing: app");
    await expect(page.getByRole("alert")).toHaveText(messages["errors.SERVER_TIMING_HEADERS"]);
    await page.locator("#server-timing-input").fill('Server-Timing: db;desc="unfinished\nServer-Timing: app"');
    await expect(page.getByRole("alert")).toHaveText(messages["errors.SERVER_TIMING_SYNTAX"]);
    await expect(result).toHaveCount(0);
    await page.getByTestId("server-timing-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
      await testInfo.attach(`server-timing-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
  });
}

test("Server-Timing exports explicitly, keeps markup inert and clears input on reload/navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/server-timing/");
  const input = `db;dur=9007199254740993.125;desc="<img src='https://example.invalid/${PRIVATE}' onerror='alert(1)'>"`;
  await page.locator("#server-timing-input").fill(input);
  const result = page.getByTestId("server-timing-result");
  await expect(result).toContainText(PRIVATE);
  await expect(result.locator("img")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied).metrics[0].description).toContain(PRIVATE);
  expect(JSON.parse(copied).metrics[0].duration).toBe("9007199254740993.125");
  const downloadPromise = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("army-knife-server-timing.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload();
  await expect(page.locator("#server-timing-input")).toHaveValue("");
  await expect(result).toHaveCount(0);
  await page.locator("#server-timing-input").fill(input);
  if (await page.locator(".mobile-menu").isVisible()) await page.locator(".mobile-menu").click();
  await page.locator('a[href="/army-knife/en/tools/cidr/"]').first().click();
  await expect(page.locator("#cidr-input")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#server-timing-input")).toHaveValue("");
});

test("long Server-Timing input waits, cancels and supports keyboard manual apply", async ({ page }) => {
  await page.clock.install();
  await page.goto("./en/tools/server-timing/");
  const long = `db;desc="${"a".repeat(1024)}", app;desc="${"b".repeat(1024)}"`;
  await page.locator("#server-timing-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.getByTestId("server-timing-cancel").click();
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("server-timing-result")).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#server-timing-input").fill(long + ", cache");
  await page.getByTestId("apply-now").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("server-timing-result").locator(".timing-metric")).toHaveCount(3);
  await page.locator("#server-timing-input").fill(long + ", total");
  await expect(page.getByTestId("server-timing-result")).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").check();
  await page.clock.fastForward(900);
  await expect(page.getByTestId("server-timing-result").locator(".timing-metric")).toHaveCount(3);
});

test("Server-Timing rejects oversized paste and structural overflow without stale exports", async ({ page }) => {
  await page.goto("./en/tools/server-timing/");
  await page.getByTestId("server-timing-sample").click();
  const prevented = await page.locator("#server-timing-input").evaluate((element) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(page.getByTestId("server-timing-result")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  for (const invalid of [Array(65).fill("db").join(","), "Server-Timing: db\n".repeat(33), 'db;desc="' + "a".repeat(1025) + '"', "db" + ";x=1".repeat(17)]) {
    await page.locator("#server-timing-input").fill(invalid);
    await expect(page.getByRole("alert")).toHaveText(serverTimingMessages.en["errors.SERVER_TIMING_LIMIT"]);
    await expect(page.getByTestId("server-timing-result")).toHaveCount(0);
  }
  await page.getByTestId("server-timing-clear").click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.locator("#server-timing-input").fill("cache");
  await expect(page.getByTestId("server-timing-result")).toBeVisible();
});
