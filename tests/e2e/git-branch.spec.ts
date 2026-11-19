import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base, expect } from "@playwright/test";
import { gitBranchMessages } from "../../src/i18n/git-branch";
import { GIT_BRANCH_SAMPLE } from "../../src/lib/tools/git-branch-sample";
import { parsePublicAssets } from "../../scripts/public-assets";

const PRIVATE = "PRIVATE_GIT_BRANCH_176";
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
  test("literal branch diagnostics, keyboard and themes in " + locale, async ({ page }, testInfo) => {
    const m = gitBranchMessages[locale], result = page.getByTestId("git-branch-result");
    await page.goto("./" + locale + "/tools/git-branch/");
    await expect(page.locator("h1")).toHaveText(m["tool.git-branch.name"]);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(result).toHaveCount(0);
    await page.getByTestId("git-branch-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("git-branch-row")).toHaveCount(7);
    await expect(page.getByTestId("git-branch-valid-count")).toHaveText("4");
    await expect(page.getByTestId("git-branch-invalid-count")).toHaveText("3");
    await expect(page.getByTestId("git-branch-row").nth(2)).toContainText(m["gitBranch.issue.reservedHead"]);
    await expect(result).toContainText("refs/heads/refs/heads/main");
    const status = await page.getByTestId("git-branch-status").first().boundingBox();
    expect(status).not.toBeNull(); expect(status!.x).toBeGreaterThanOrEqual(0);
    expect(status!.x + status!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? "docs/screenshots/git-branch-" + locale + "-" + theme + "-" + (testInfo.project.name.endsWith("small") ? "small" : "desktop") + ".png" : undefined;
      await testInfo.attach("git-branch-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    const region = result.getByRole("region"); await region.focus(); await expect(region).toBeFocused(); await page.keyboard.press("ArrowRight");
    await page.locator("#git-branch-input").fill('["@", "HEAD", "a./b", "-x"]');
    await expect(page.getByTestId("git-branch-valid-count")).toHaveText("2");
    await expect(page.getByTestId("git-branch-status").first()).toHaveText(m["gitBranch.valid"]);
    await expect(page.getByTestId("git-branch-status").nth(1)).toHaveText(m["gitBranch.invalid"]);
    await page.getByTestId("git-branch-clear").focus(); await page.keyboard.press("Enter"); await expect(result).toHaveCount(0);
  });
}

test("complete explicit JSON downloads, inert names and memory-only lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { copies: string[] }).copies = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text: string) => { (window as unknown as { copies: string[] }).copies.push(text); },
    } });
  });
  await page.goto("./en/tools/git-branch/");
  const result = page.getByTestId("git-branch-result"), input = page.locator("#git-branch-input");
  const names = Array.from({ length: 128 }, (_, i) => i % 2 ? "bad.." + i : "topic/" + i);
  await input.fill(JSON.stringify(names)); await expect(result).toBeVisible();
  await expect(page.getByTestId("git-branch-row")).toHaveCount(32); await expect(result.locator("caption")).toContainText("128");
  await expect(page.getByTestId("git-branch-valid-count")).toHaveText("64");
  await expect(page.getByTestId("git-branch-invalid-count")).toHaveText("64");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  const report = JSON.parse(copied);
  expect(report.branches.map((b: { name: string }) => b.name)).toEqual(names);
  expect(report.branches.at(-1)).toMatchObject({ valid: false, fullRef: null, issues: ["doubleDot"] });
  expect(report.branches[0].fullRef).toBe("refs/heads/topic/0");
  const pending = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe("army-knife-git-branch.json");
  const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toBe(copied);
  const privateName = '<img src="https://example.invalid/' + PRIVATE + '">\u0000\r\n\u202e\u200b😀';
  await input.fill(JSON.stringify([privateName])); await expect(result).toContainText("\\u0000\\r\\n\\u202e\\u200b");
  await expect(page.locator("#main-content img, #main-content script")).toHaveCount(0);
  expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie })))).not.toContain(PRIVATE);
  await input.fill('["' + PRIVATE + '", 1]'); await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  expect(await page.getByRole("alert").textContent()).not.toContain(PRIVATE);
  await page.reload(); await expect(input).toHaveValue("");
  await page.getByTestId("git-branch-sample").click(); await page.locator(".back-link").click(); await page.getByTestId("tool-card-git-branch").click();
  await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("git-branch-sample").click(); await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("strict limits/imports and cancellable delayed/manual execution", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-20T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-20T00:01:00Z"));
  await page.goto("./en/tools/git-branch/");
  const input = page.locator("#git-branch-input"), result = page.getByTestId("git-branch-result");
  const deferred = '["main"]' + " ".repeat(2100);
  await input.fill(deferred); await page.getByTestId("git-branch-cancel").click();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.clock.runFor(900); await expect(result).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").uncheck(); await input.fill(deferred + " ");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("git-branch-valid-count")).toHaveText("1");
  await input.fill('["HEAD"]'); await expect(page.getByTestId("git-branch-invalid-count")).toHaveText("1");
  for (const value of ['[]', '[1]', '["\\ud800"]', JSON.stringify(["x".repeat(513)])]) {
    await input.fill(value); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  }
  for (const bytes of [Buffer.from('\ufeff["main"]'), Buffer.from([255]), Buffer.from("x".repeat(8193))]) {
    await page.getByTestId("git-branch-sample").click();
    await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: bytes });
    await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: Buffer.from('["a\\rb", "main"]') });
  await expect(result).toBeVisible(); await expect(page.getByTestId("git-branch-row").first()).toContainText('"a\\rb"');
  await expect(page.getByTestId("git-branch-invalid-count")).toHaveText("1");
  await input.fill(deferred); await page.getByTestId("auto-apply-toggle").check();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(799); await expect(result).toHaveCount(0);
  await page.clock.runFor(1); await expect(page.getByTestId("git-branch-valid-count")).toHaveText("1");
});

test("pending local file reads hide exports and cannot overwrite a sample", async ({ page }) => {
  await page.goto("./en/tools/git-branch/"); await page.getByTestId("git-branch-sample").click();
  await page.evaluate(() => {
    const native = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      const bytes = await native.call(this);
      // Model a slow native file read before the controllable completion exists.
      await new Promise(resolve => setTimeout(resolve, 500));
      await new Promise<void>(resolve => { (window as unknown as { finishRead: () => void }).finishRead = resolve; }); return bytes;
    };
  });
  await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.json", mimeType: "application/json", buffer: Buffer.from('["old"]') });
  await expect(page.locator("#git-branch-input")).toBeDisabled(); await expect(page.getByTestId("git-branch-result")).toHaveCount(0);
  await page.waitForFunction(() => typeof (window as unknown as { finishRead?: () => void }).finishRead === "function");
  await page.getByTestId("git-branch-sample").click();
  await page.evaluate(() => (window as unknown as { finishRead: () => void }).finishRead());
  await expect(page.locator("#git-branch-input")).toHaveValue(GIT_BRANCH_SAMPLE);
  await expect(page.getByTestId("git-branch-valid-count")).toHaveText("4");
});

test("raw CRLF paste boundaries and protected original-byte workflow", async ({ page }) => {
  await page.goto("./en/tools/git-branch/"); await page.getByTestId("git-branch-sample").click();
  const input = page.locator("#git-branch-input"), result = page.getByTestId("git-branch-result");
  const paste = (value: string) => input.evaluate((element, text) => {
    const field = element as HTMLTextAreaElement; field.focus(); field.setSelectionRange(0, field.value.length);
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => text } }); field.dispatchEvent(event);
    return event.defaultPrevented;
  }, value);
  const exact = '["界"]\r\n' + " ".repeat(8183);
  expect(Buffer.byteLength(exact)).toBe(8192); expect(await paste(exact)).toBe(true);
  await expect(input).toHaveAttribute("readonly", ""); await expect(page.getByTestId("preserved-cr-input")).toBeVisible();
  await page.getByTestId("apply-now").click(); await expect(page.getByTestId("git-branch-count")).toHaveText("1");
  const pending = page.waitForEvent("download"); await page.getByTestId("download-raw-cr-input").click();
  const download = await pending, chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toBe(exact);
  await page.getByTestId("replace-raw-cr-input").click(); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("git-branch-sample").click(); expect(await paste(exact + " ")).toBe(true);
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
});

test.describe("production hostname privacy", () => {
  test.use({ baseURL: "https://h4m4chi-ttr.github.io/army-knife/" });
  test("same distribution only uses exact first-party assets on the published hostname", async ({ context, page }) => {
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== "https://h4m4chi-ttr.github.io" || !(await allowed).has(url.pathname) || url.search) { await route.abort(); return; }
      const name = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
      await route.fulfill({ path: resolve("dist", name.slice("/army-knife/".length)) });
    });
    await page.goto("./en/tools/git-branch/"); await page.getByTestId("git-branch-sample").click();
    await expect(page.getByTestId("git-branch-valid-count")).toHaveText("4");
    await page.locator("#git-branch-input").fill(JSON.stringify([PRIVATE]));
    await expect(page.getByTestId("git-branch-valid-count")).toHaveText("1");
    expect(await page.evaluate(() => ({ dataLayer: "dataLayer" in window, cookie: document.cookie }))).toEqual({ dataLayer: false, cookie: "" });
    await expect(page.locator('script[src*="analytics"], script[src*="googletag"]')).toHaveCount(0);
  });
});
