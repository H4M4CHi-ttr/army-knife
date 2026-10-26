import { readdir } from "node:fs/promises";
import { expect, test as base, type Page, type Download } from "@playwright/test";
import { backlogCopy } from "../../src/i18n/backlog";

const tools = [
  "ndjson", "json-pointer", "csv-insert", "sqlite-plan", "jsonl-logs",
  "stack-trace", "robots", "sitemap", "iso-duration", "pg-dsn",
] as const;
const PRIVATE = "PRIVATE_BACKLOG_982734";
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

async function openTool(page: Page, locale: string, tool: (typeof tools)[number]) {
  await page.goto("./" + locale + "/tools/" + tool + "/");
  await expect(page.getByTestId("backlog-" + tool)).toBeVisible();
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", tool);
}
async function downloadText(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
async function privateState(page: Page) {
  expect(await page.evaluate(() => JSON.stringify({ url: location.href, local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain(PRIVATE);
}

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("ten offline inspector workflows in " + locale, async ({ page }, testInfo) => {
    for (const tool of tools) {
      await openTool(page, locale, tool);
      await expect(page.locator("#" + tool + "-input")).toHaveValue("");
      await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
      await expect(page.locator("#page-guide")).toContainText(backlogCopy[locale][tool][1]);
      await page.getByTestId("backlog-sample").focus(); await page.keyboard.press("Enter");
      const result = page.getByTestId("backlog-results");
      await expect(result).toBeVisible();
      await expect(result.locator("table").first()).toBeVisible();
      if (tool === "iso-duration") await expect(result).toContainText("2024-02-29T12:00:00.000Z");
      if (tool === "robots") await expect(result).toContainText("NO");
      if (tool === "pg-dsn") await expect(result).toContainText("<redacted>");
      for (const theme of ["light", "dark"] as const) {
        await page.getByTestId("settings-button").click();
        await page.getByTestId(`theme-${theme}`).click();
        await page.getByTestId("settings-close").click();
        const geo = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, body: document.documentElement.scrollWidth }));
        expect(geo.body).toBeLessThanOrEqual(geo.viewport + 1);
        if ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark")) {
          const selected = ["pg-dsn", "json-pointer", "robots", "iso-duration"].includes(tool);
          const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && selected && testInfo.project.name.startsWith("chromium-");
          const path = capture ? `docs/screenshots/backlog-${tool}-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
          await testInfo.attach(`${tool}-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
        }
      }
    }
  });
}

test("DSN and stack exports omit secret fields and input stays in memory", async ({ page }) => {
  await openTool(page, "en", "pg-dsn");
  await page.locator("#pg-dsn-input").fill(`postgresql://demo:${PRIVATE}@example.test/db?options=-c%20app.api_key%3D${PRIVATE}`);
  const result = page.getByTestId("backlog-results");
  await expect(result).toContainText("<redacted>"); await expect(result).not.toContainText(PRIVATE);
  let pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  expect(await downloadText(await pending)).not.toContain(PRIVATE);
  await privateState(page);
  await page.reload(); await expect(page.locator("#pg-dsn-input")).toHaveValue("");
  await expect(result).toHaveCount(0);
  await openTool(page, "en", "stack-trace");
  await page.locator("#stack-trace-input").fill(`Error: ${PRIVATE}Error\n at handle (/private/${PRIVATE}/a.js:1:2)`);
  await expect(result).toBeVisible(); await expect(result).not.toContainText(PRIVATE);
  pending = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  expect(await downloadText(await pending)).not.toContain(PRIVATE);
  await privateState(page);
});

test("JSON Pointer explicitly exports and restores a report above 64 KiB via the real Worker", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await openTool(page, "en", "json-pointer");
  const source = Array.from({ length: 1000 }, (_, i) => i);
  await page.locator("#json-pointer-input").fill(JSON.stringify(source));
  const result = page.getByTestId("backlog-results");
  await expect(result).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const flat = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(Buffer.byteLength(flat)).toBeGreaterThan(65_536);
  expect(JSON.parse(flat)).toHaveLength(1001);
  await page.getByTestId("backlog-direction").selectOption("restore");
  await page.locator("#json-pointer-input-file").setInputFiles({ name: "pointers.json", mimeType: "application/json", buffer: Buffer.from(flat) });
  await expect(result).toBeVisible();
  const pending = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  expect(JSON.parse(await downloadText(await pending))).toEqual(source);
});

test("real Worker delay, cancellation, manual apply, full export and stale-output rejection", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await openTool(page, "en", "ndjson");
  await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  const source = Array.from({ length: 150 }, (_, i) => JSON.stringify({ id: i, value: PRIVATE })).join("\n");
  const result = page.getByTestId("backlog-results");
  await page.locator("#ndjson-input").fill(source);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(799); await expect(result).toHaveCount(0);
  await page.clock.runFor(1); await expect(result).toBeVisible();
  await expect(result).toContainText("Only the first 100 rows");
  const pending = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  expect(JSON.parse(await downloadText(await pending))).toMatchObject({ total: 150, valid: 150, invalid: 0 });
  await page.locator("#ndjson-input").fill(source + "\n{}");
  await expect(result).toHaveCount(0);
  await page.getByTestId("backlog-cancel").focus(); await page.keyboard.press("Enter");
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#ndjson-input").fill(source + "\n{}\n{}");
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").focus(); await page.keyboard.press("Enter");
  await expect(result).toBeVisible(); await expect(result).toContainText("152");
  await page.locator("#ndjson-input").evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(65_537) } });
    element.dispatchEvent(event);
  });
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText("size limit");
  await page.getByTestId("backlog-sample").click(); await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(result).toBeVisible();
  await privateState(page);
  await page.reload(); await expect(page.locator("#ndjson-input")).toHaveValue("");
});

test("adversarial rules finish and malformed XML and numeric/date inputs remain explicit", async ({ page }) => {
  await openTool(page, "en", "robots");
  await page.getByTestId("backlog-path").fill("/" + "a".repeat(80));
  await page.locator("#robots-input").fill("User-agent: *\nDisallow: /" + "a*".repeat(24) + "b");
  const result = page.getByTestId("backlog-results");
  await expect(result).toContainText("YES");
  await openTool(page, "en", "iso-duration"); await page.getByTestId("backlog-reference").fill("2024-02-31T12:00:00Z");
  await page.locator("#iso-duration-input").fill("PT1.001S"); await expect(result).toHaveCount(0);
  await expect(page.getByRole("alert")).toBeVisible();
  await openTool(page, "en", "sqlite-plan");
  await page.locator("#sqlite-plan-input").fill('[{"id":1.00000000000000001,"parent":0,"detail":"SCAN t"}]');
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  await openTool(page, "en", "sitemap");
  await page.locator("#sitemap-input").fill(`<!DOCTYPE urlset SYSTEM "https://example.invalid/${PRIVATE}"><urlset/>`);
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  await privateState(page);
});
