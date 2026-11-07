import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { mergePatchMessages } from "../../src/i18n/json-merge-patch";
import { MERGE_PATCH_TARGET_SAMPLE, MERGE_PATCH_SAMPLE } from "../../src/lib/tools/json-merge-patch-sample";

const PRIVATE = "PRIVATE_MERGE_6317";
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
  test(`Merge Patch value rules, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = mergePatchMessages[locale];
    await page.goto(`./${locale}/tools/json-merge-patch/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.json-merge-patch.description"]);
    await expect(page.locator("h1")).toHaveText(m["tool.json-merge-patch.name"]);
    const result = page.getByTestId("merge-patch-result"), json = page.getByTestId("merge-patch-json");
    await expect(result).toHaveCount(0);
    await page.getByTestId("merge-patch-sample").focus(); await page.keyboard.press("Enter");
    await expect(json).toContainText('"Published"');
    expect(JSON.parse((await json.textContent())!)).toEqual({ title: "Published", owner: { name: "Aoi" }, tags: ["new"], archived: false });
    await expect(page.getByTestId("merge-patch-mode")).toHaveText(m["mergePatch.merge"]);
    await json.focus(); await expect(json).toBeFocused();
    for (const value of ["null", "false", "0", '""', "[]"]) {
      await page.locator("#merge-patch-patch").fill(value);
      await expect(json).toHaveText(value);
      await expect(page.getByTestId("merge-patch-mode")).toHaveText(m["mergePatch.replace"]);
    }
    await page.getByTestId("merge-patch-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/json-merge-patch-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`json-merge-patch-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.getByTestId("merge-patch-clear").focus(); await page.keyboard.press("Enter");
    await expect(result).toHaveCount(0);
    await expect(page.locator("#merge-patch-target")).toHaveValue(""); await expect(page.locator("#merge-patch-patch")).toHaveValue("");
  });
}

test("Merge Patch explicit document JSON download, inert data and memory lifecycle", async ({ page }) => {
  await page.goto("./en/tools/json-merge-patch/");
  await page.locator("#merge-patch-target").fill('{"__proto__":{"keep":9007199254740991},"drop":1,"decimal":0.1}');
  await page.locator("#merge-patch-patch").fill('{"__proto__":{"added":true},"drop":null,"array":[null]}');
  const pending = page.waitForEvent("download");
  await page.getByTestId("merge-patch-result").getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-merged.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse('{"__proto__":{"keep":9007199254740991,"added":true},"decimal":0.1,"array":[null]}'));
  await page.locator("#merge-patch-patch").fill(JSON.stringify({ note: `<script>${PRIVATE}</script><img src=https://example.invalid/${PRIVATE}>` }));
  await expect(page.getByTestId("merge-patch-result")).toContainText(PRIVATE);
  await expect(page.getByTestId("merge-patch-result").locator("script, img, a")).toHaveCount(0);
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload();
  await expect(page.locator("#merge-patch-target")).toHaveValue(""); await expect(page.locator("#merge-patch-patch")).toHaveValue("");
  await expect(page.getByTestId("merge-patch-result")).toHaveCount(0);
  await page.getByTestId("merge-patch-sample").click();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-json-merge-patch").click();
  await expect(page.locator("#merge-patch-target")).toHaveValue(""); await expect(page.locator("#merge-patch-patch")).toHaveValue("");
  await page.getByTestId("merge-patch-sample").click();
  await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#merge-patch-target")).toHaveValue(""); await expect(page.locator("#merge-patch-patch")).toHaveValue("");
  await expect(page.getByTestId("merge-patch-result")).toHaveCount(0);
});

test("Merge Patch rejects invalid inputs and per-input oversized paste without stale exports", async ({ page }) => {
  await page.goto("./en/tools/json-merge-patch/");
  for (const field of ["target", "patch"]) {
    for (const value of ['{"a":1,"a":2}', '9007199254740993', '0.10000000000000001', '1e999', '[1,]', '{', "[".repeat(33) + "0" + "]".repeat(33)]) {
      await page.getByTestId("merge-patch-sample").click(); await page.locator(`#merge-patch-${field}`).fill(value);
      await expect(page.getByTestId("merge-patch-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
      await expect(page.getByRole("alert")).toBeVisible();
    }
    await page.getByTestId("merge-patch-sample").click();
    await page.locator(`#merge-patch-${field}`).evaluate(element => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(16385) } }); element.dispatchEvent(event);
    });
    await page.locator(`#merge-patch-${field === "target" ? "patch" : "target"}`).fill("{}");
    await expect(page.getByTestId("merge-patch-result")).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await page.locator(`#merge-patch-${field}`).fill("{}"); await expect(page.getByTestId("merge-patch-json")).toHaveText("{}");
  }
});

test("Merge Patch delays both inputs, resets, cancels and persists only manual preference", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-08T00:00:00Z") });
  await page.goto("./en/tools/json-merge-patch/");
  await page.clock.pauseAt(new Date("2026-11-08T01:00:00Z"));
  const long = MERGE_PATCH_TARGET_SAMPLE + " ".repeat(2100);
  await page.locator("#merge-patch-target").fill(long);
  await page.locator("#merge-patch-patch").fill(MERGE_PATCH_SAMPLE);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(400); await page.locator("#merge-patch-patch").fill(MERGE_PATCH_SAMPLE + " ");
  await page.clock.runFor(799); await expect(page.getByTestId("merge-patch-result")).toHaveCount(0);
  await page.clock.runFor(1); await expect(page.getByTestId("merge-patch-json")).toContainText('"Published"');
  await page.locator("#merge-patch-target").fill(long + " "); await page.getByTestId("merge-patch-cancel").click();
  await page.clock.runFor(1000); await expect(page.getByTestId("merge-patch-result")).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("merge-patch-result")).toBeVisible();
  await page.locator("#merge-patch-target").fill(long); await page.getByTestId("auto-apply-toggle").uncheck();
  await page.clock.runFor(1000); await expect(page.getByTestId("merge-patch-result")).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("merge-patch-result")).toBeVisible();
  await page.reload(); await page.locator("#merge-patch-target").fill(long); await page.locator("#merge-patch-patch").fill(MERGE_PATCH_SAMPLE);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await page.getByTestId("merge-patch-sample").click(); await expect(page.getByTestId("merge-patch-json")).toContainText('"Published"');
});

