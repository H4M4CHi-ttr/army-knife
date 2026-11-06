import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { hstsMessages } from "../../src/i18n/hsts";
import { HSTS_SAMPLE } from "../../src/lib/tools/hsts-sample";

const PRIVATE = "PRIVATE_HSTS_2731";
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
  test(`HSTS exact lifetime, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = hstsMessages[locale];
    await page.goto(`./${locale}/tools/hsts/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.hsts.description"]);
    await expect(page.locator("h1")).toHaveText(m["tool.hsts.name"]);
    const result = page.getByTestId("hsts-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("hsts-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("hsts-seconds")).toHaveText("31536000");
    await expect(result).toContainText(m["hsts.preloadHelp"]);
    await page.locator("#hsts-input").fill(' ; MAX-age="9007199254740993"; x="a;b,c"; empty=""; flag;');
    await expect(page.getByTestId("hsts-seconds")).toHaveText("9007199254740993");
    await expect(result).toContainText("104249991374");
    await expect(result).toContainText('"a;b,c"');
    await expect(result).toContainText(m["hsts.valueless"]);
    await page.locator("#hsts-input").fill("max-age=0; includeSubDomains; preload");
    await expect(page.getByTestId("hsts-removal")).toHaveText(m["hsts.zero"]);
    await page.getByTestId("hsts-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/hsts-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`hsts-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.getByTestId("hsts-clear").focus(); await page.keyboard.press("Enter");
    await expect(result).toHaveCount(0); await expect(page.locator("#hsts-input")).toHaveValue("");
  });
}

test("HSTS explicit exact JSON download, inert extensions and memory lifecycle", async ({ page }) => {
  await page.goto("./en/tools/hsts/");
  await page.locator("#hsts-input").fill('max-age="9007199254740993"; includeSubDomains; preload');
  const pending = page.waitForEvent("download");
  await page.getByTestId("hsts-result").getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-hsts.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual({
    maxAgeSeconds: "9007199254740993", duration: { days: "104249991374", hours: 7, minutes: 36, seconds: 33 },
    operation: "declare", includeSubDomains: true, preload: true, emptySlots: 0,
    directives: [{ name: "max-age", value: "9007199254740993", recognized: true }, { name: "includeSubDomains", value: null, recognized: true }, { name: "preload", value: null, recognized: false }],
  });
  await page.locator("#hsts-input").fill(`max-age=1; x="<script>${PRIVATE}</script><img src=https://example.invalid/${PRIVATE}>"`);
  await expect(page.getByTestId("hsts-result")).toContainText(PRIVATE);
  await expect(page.getByTestId("hsts-result").locator("script, img, a")).toHaveCount(0);
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator("#hsts-input")).toHaveValue(""); await expect(page.getByTestId("hsts-result")).toHaveCount(0);
  await page.getByTestId("hsts-sample").click();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-hsts").click();
  await expect(page.locator("#hsts-input")).toHaveValue("");
  await page.getByTestId("hsts-sample").click();
  await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(page.locator("#hsts-input")).toHaveValue("");
  await expect(page.getByTestId("hsts-result")).toHaveCount(0);
});

test("HSTS rejects malformed fields and oversized paste without stale exports", async ({ page }) => {
  await page.goto("./en/tools/hsts/");
  for (const value of ["Strict-Transport-Security: max-age=1", "max-age=1\n", 'max-age=1;x="unclosed', "max-age=1;X; x", "max-age=1;includeSubDomains=true", "max-age=" + "9".repeat(41), "max-age=1" + ";".repeat(64)]) {
    await page.getByTestId("hsts-sample").click(); await page.locator("#hsts-input").fill(value);
    await expect(page.getByTestId("hsts-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.getByTestId("hsts-sample").click();
  await page.locator("#hsts-input").evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(4097) } }); element.dispatchEvent(event);
  });
  await expect(page.getByTestId("hsts-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await page.getByTestId("hsts-sample").click(); await expect(page.getByTestId("hsts-seconds")).toHaveText("31536000");
});

test("HSTS delays, resets, cancels and persists only manual-mode preference", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-07T00:00:00Z") });
  await page.goto("./en/tools/hsts/");
  await page.clock.pauseAt(new Date("2026-11-07T01:00:00Z"));
  const long = HSTS_SAMPLE + " ".repeat(2100);
  await page.locator("#hsts-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(400); await page.locator("#hsts-input").fill(long + " ");
  await page.clock.runFor(799); await expect(page.getByTestId("hsts-result")).toHaveCount(0);
  await page.clock.runFor(1); await expect(page.getByTestId("hsts-seconds")).toHaveText("31536000");
  await page.locator("#hsts-input").fill(long); await page.getByTestId("hsts-cancel").click();
  await page.clock.runFor(1000); await expect(page.getByTestId("hsts-result")).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("hsts-seconds")).toHaveText("31536000");
  await page.locator("#hsts-input").fill(long + " "); await page.getByTestId("auto-apply-toggle").uncheck();
  await page.clock.runFor(1000); await expect(page.getByTestId("hsts-result")).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("hsts-seconds")).toHaveText("31536000");
  await page.reload(); await page.locator("#hsts-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await page.getByTestId("hsts-sample").click(); await expect(page.getByTestId("hsts-seconds")).toHaveText("31536000");
});
