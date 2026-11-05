import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { httpLinkMessages } from "../../src/i18n/http-link";
import { HTTP_LINK_SAMPLE } from "../../src/lib/tools/http-link-sample";

const PRIVATE = "PRIVATE_LINK_7193";
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
  test(`Link structure, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = httpLinkMessages[locale];
    await page.goto(`./${locale}/tools/http-link/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.http-link.description"]);
    const result = page.getByTestId("link-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("link-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("link-entry")).toHaveCount(3);
    await expect(page.getByTestId("link-target").nth(1)).toHaveText("<?page=9>");
    await expect(page.getByTestId("link-relations").last()).toHaveText("preload · stylesheet");
    await expect(result).toContainText('"Next, page"');
    await page.locator("#http-link-input").fill(', </a,b;c>; REL="Next alternate"; rel=last; x; empty="",');
    await expect(page.getByTestId("link-empty")).toContainText("2");
    await expect(page.getByTestId("link-relations")).toHaveText("Next · alternate");
    await expect(result).toContainText(m["link.valueless"]);
    await page.getByTestId("link-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/http-link-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`http-link-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.getByTestId("link-clear").focus(); await page.keyboard.press("Enter");
    await expect(result).toHaveCount(0); await expect(page.locator("#http-link-input")).toHaveValue("");
  });
}

test("Link explicit exact JSON download, inert values and memory lifecycle", async ({ page }) => {
  await page.goto("./en/tools/http-link/"); await page.getByTestId("link-sample").click();
  const pending = page.waitForEvent("download");
  await page.getByTestId("link-result").getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-http-link.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  const report = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(report).toEqual({ links: [
    { position: 1, target: "https://api.example.invalid/items?page=2&per_page=20", relations: ["next"], parameters: [{ name: "rel", value: "next" }, { name: "title", value: "Next, page" }], duplicateParameters: [], missingRel: false },
    { position: 2, target: "?page=9", relations: ["last"], parameters: [{ name: "rel", value: "last" }, { name: "type", value: "application/json" }], duplicateParameters: [], missingRel: false },
    { position: 3, target: "/assets/site.css", relations: ["preload", "stylesheet"], parameters: [{ name: "rel", value: "preload stylesheet" }, { name: "as", value: "style" }], duplicateParameters: [], missingRel: false },
  ], emptyMembers: 0 });
  await page.locator("#http-link-input").fill(`<https://example.invalid/${PRIVATE}>; rel=next; title="<script>${PRIVATE}</script>"`);
  await expect(page.getByTestId("link-result")).toContainText(PRIVATE);
  await expect(page.getByTestId("link-result").locator("script, img, a")).toHaveCount(0);
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator("#http-link-input")).toHaveValue(""); await expect(page.getByTestId("link-result")).toHaveCount(0);
  await page.getByTestId("link-sample").click();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-http-link").click();
  await expect(page.locator("#http-link-input")).toHaveValue("");
  await page.getByTestId("link-sample").click();
  await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(page.locator("#http-link-input")).toHaveValue("");
  await expect(page.getByTestId("link-result")).toHaveCount(0);
});

test("Link rejects malformed input and oversized edits without stale export", async ({ page }) => {
  await page.goto("./en/tools/http-link/");
  for (const value of ['Link: </x>; rel=next', '</x>\n', '</x>; title="unclosed', '</x>;rel=""', ','.repeat(64), Array(33).fill('</x>').join(',')]) {
    await page.getByTestId("link-sample").click(); await page.locator("#http-link-input").fill(value);
    await expect(page.getByTestId("link-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.getByTestId("link-sample").click();
  await page.locator("#http-link-input").evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } }); element.dispatchEvent(event);
  });
  await expect(page.getByTestId("link-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await page.getByTestId("link-sample").click(); await expect(page.getByTestId("link-entry")).toHaveCount(3);
});

test("Link delays, resets, cancels and applies manually", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-06T00:00:00Z") });
  await page.goto("./en/tools/http-link/");
  await page.clock.pauseAt(new Date("2026-11-06T01:00:00Z"));
  const long = HTTP_LINK_SAMPLE + " ".repeat(2100);
  await page.locator("#http-link-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(400); await page.locator("#http-link-input").fill(long + " ");
  await page.clock.runFor(799); await expect(page.getByTestId("link-result")).toHaveCount(0);
  await page.clock.runFor(1); await expect(page.getByTestId("link-entry")).toHaveCount(3);
  await page.locator("#http-link-input").fill(long); await page.getByTestId("link-cancel").click();
  await page.clock.runFor(1000); await expect(page.getByTestId("link-result")).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("link-entry")).toHaveCount(3);
  await page.locator("#http-link-input").fill(long + " "); await page.getByTestId("auto-apply-toggle").uncheck();
  await page.clock.runFor(1000); await expect(page.getByTestId("link-result")).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("link-entry")).toHaveCount(3);
  await page.reload(); await page.locator("#http-link-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await page.getByTestId("link-sample").click(); await expect(page.getByTestId("link-entry")).toHaveCount(3);
});
