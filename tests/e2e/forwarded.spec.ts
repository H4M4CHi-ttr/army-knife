import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { forwardedMessages } from "../../src/i18n/forwarded";
import { FORWARDED_SAMPLE } from "../../src/lib/tools/forwarded-sample";

const PRIVATE = "PRIVATE_FORWARDED_2719";
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


for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("Forwarded grouping, keyboard and themes in " + locale, async ({ page }, testInfo) => {
    const m = forwardedMessages[locale];
    await page.goto("./" + locale + "/tools/forwarded/");
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.forwarded.description"]);
    await expect(page.locator("h1")).toHaveText(m["tool.forwarded.name"]);
    const result = page.getByTestId("forwarded-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("forwarded-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("forwarded-element")).toHaveCount(2);
    await expect(result).toContainText("192.0.2.1"); await expect(result).toContainText("[2001:db8::1]:4711");
    await page.locator("#forwarded-input").fill(' , ;for="a;b,c";x="";,by=unknown');
    await expect(page.getByTestId("forwarded-element")).toHaveCount(2);
    await expect(result).toContainText('"a;b,c"'); await expect(result).toContainText('""');
    await expect(result).toContainText(m["forwarded.emptyElements"].replace("{count}", "1"));
    await page.getByTestId("forwarded-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      await testInfo.attach("forwarded-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await page.getByTestId("forwarded-clear").focus(); await page.keyboard.press("Enter");
    await expect(result).toHaveCount(0); await expect(page.locator("#forwarded-input")).toHaveValue("");
  });
}

test("Forwarded exact explicit JSON download, inert values and memory-only lifecycle", async ({ page }) => {
  await page.goto("./en/tools/forwarded/");
  await page.locator("#forwarded-input").fill('for=unknown;by=_edge,for="[2001:db8::1]:04711";x=""');
  const pending = page.waitForEvent("download");
  await page.getByTestId("forwarded-result").getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe("army-knife-forwarded.json");
  const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual({
    elements: [
      { index: 1, parameters: [{ name: "for", value: "unknown" }, { name: "by", value: "_edge" }], emptyParameterSlots: 0 },
      { index: 2, parameters: [{ name: "for", value: "[2001:db8::1]:04711" }, { name: "x", value: "" }], emptyParameterSlots: 0 },
    ], emptyElements: 0,
  });
  await page.locator("#forwarded-input").fill('for=unknown;x="<script>' + PRIVATE + '</script><img src=https://example.invalid/' + PRIVATE + '>"');
  await expect(page.getByTestId("forwarded-result")).toContainText(PRIVATE);
  await expect(page.getByTestId("forwarded-result").locator("script, img, a")).toHaveCount(0);
  expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie })))).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator("#forwarded-input")).toHaveValue(""); await expect(page.getByTestId("forwarded-result")).toHaveCount(0);
  await page.getByTestId("forwarded-sample").click(); await page.locator(".back-link").click(); await page.getByTestId("tool-card-forwarded").click();
  await expect(page.locator("#forwarded-input")).toHaveValue("");
  await page.getByTestId("forwarded-sample").click(); await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(page.locator("#forwarded-input")).toHaveValue("");
  await expect(page.getByTestId("forwarded-result")).toHaveCount(0);
});

test("Forwarded rejects malformed fields and oversized paste without stale exports", async ({ page }) => {
  await page.goto("./en/tools/forwarded/");
  for (const value of ["Forwarded: for=a", "for=a\n", 'for="unclosed', "for=a;FOR=b", "for =a", "for=[::1]", ",,;;", "for=a" + ";".repeat(32)]) {
    await page.getByTestId("forwarded-sample").click(); await page.locator("#forwarded-input").fill(value);
    await expect(page.getByTestId("forwarded-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.getByTestId("forwarded-sample").click();
  await page.locator("#forwarded-input").evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } }); element.dispatchEvent(event);
  });
  await expect(page.getByTestId("forwarded-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await page.getByTestId("forwarded-sample").click(); await expect(page.getByTestId("forwarded-element")).toHaveCount(2);
});

test("Forwarded pending debounce resets, cancels and respects saved manual preference", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-10T00:00:00Z") }); await page.goto("./en/tools/forwarded/");
  await page.clock.pauseAt(new Date("2026-11-10T01:00:00Z"));
  const long = FORWARDED_SAMPLE + " ".repeat(2100);
  await page.locator("#forwarded-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(400); await page.locator("#forwarded-input").fill(long + " ");
  await page.clock.runFor(799); await expect(page.getByTestId("forwarded-result")).toHaveCount(0);
  await page.clock.runFor(1); await expect(page.getByTestId("forwarded-element")).toHaveCount(2);
  await page.locator("#forwarded-input").fill(long); await page.getByTestId("forwarded-cancel").click();
  await page.clock.runFor(1000); await expect(page.getByTestId("forwarded-result")).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("forwarded-element")).toHaveCount(2);
  await page.locator("#forwarded-input").fill(long + " "); await page.getByTestId("auto-apply-toggle").uncheck();
  await page.clock.runFor(1000); await expect(page.getByTestId("forwarded-result")).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("forwarded-element")).toHaveCount(2);
  await page.reload(); await page.locator("#forwarded-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await page.getByTestId("forwarded-sample").click(); await expect(page.getByTestId("forwarded-element")).toHaveCount(2);
});
