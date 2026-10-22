import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { dispositionMessages } from "../../src/i18n/content-disposition";

const PRIVATE = "PRIVATE_DISPOSITION_8812";
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
  test(`Content-Disposition filenames, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = dispositionMessages[locale];
    await page.goto(`./${locale}/tools/content-disposition/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.content-disposition.description"]);
    await expect(page.locator("#disposition-input")).toHaveValue("");
    const result = page.getByTestId("disposition-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("disposition-sample").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("disposition-selected")).toContainText('"€ rates.csv"');
    await expect(result).toContainText('"EURO rates.csv"');
    await page.locator("#disposition-input").fill("attachment;filename=\"../fallback.csv\";filename*=UTF-8''safe%E2%80%AE.csv");
    await expect(result.locator('[data-filename-note="path"]')).toHaveText(m["disposition.filename.path"]);
    await expect(result.locator('[data-filename-note="controls"]')).toHaveText(m["disposition.filename.controls"]);
    await expect(page.getByTestId("disposition-selected")).toContainText("\\u202e");
    const parameters = result.locator("summary");
    await parameters.focus(); await page.keyboard.press("Enter");
    await expect(result.locator(".disposition-parameters ul")).toBeVisible();
    await page.locator("#disposition-input").fill("attachment;filename=old.csv;filename*=shift_jis'ja'%83e.csv");
    await expect(page.getByTestId("disposition-selected")).toHaveText(m["disposition.unresolved"]);
    await page.locator("#disposition-input").fill("attachment;filename=a;FILENAME=b");
    await expect(page.getByRole("alert")).toHaveText(m["errors.DISPOSITION_DUPLICATE"]);
    await expect(result).toHaveCount(0);
    await page.getByTestId("disposition-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      await testInfo.attach(`content-disposition-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
  });
}

test("Content-Disposition explicit export, inert markup and clearing on reload/navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/content-disposition/");
  const input = `attachment;filename="<img src='https://example.invalid/${PRIVATE}'>";filename*=UTF-8''report.csv`;
  await page.locator("#disposition-input").fill(input);
  const result = page.getByTestId("disposition-result");
  await expect(result).toContainText(PRIVATE);
  await expect(result.locator("img")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toMatchObject({ preferredFilename: "report.csv", preferredSource: "filename*", filename: expect.stringContaining(PRIVATE) });
  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-content-disposition.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload();
  await expect(page.locator("#disposition-input")).toHaveValue("");
  await expect(result).toHaveCount(0);
  await page.locator("#disposition-input").fill(input);
  if (await page.locator(".mobile-menu").isVisible()) await page.locator(".mobile-menu").click();
  await page.locator('a[href="/army-knife/en/tools/cidr/"]').first().click();
  await expect(page.locator("#cidr-input")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#disposition-input")).toHaveValue("");
});

test("Content-Disposition countdown, cancellation and keyboard manual apply", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("./en/tools/content-disposition/");
  await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  const long = `attachment;x="${"a".repeat(1024)}";y="${"b".repeat(1024)}"`;
  await page.locator("#disposition-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.fastForward(799);
  await expect(page.getByTestId("disposition-result")).toHaveCount(0);
  await page.clock.fastForward(1);
  await expect(page.getByTestId("disposition-result")).toBeVisible();
  await page.locator("#disposition-input").fill(long + ";filename=a");
  await expect(page.getByTestId("disposition-result")).toHaveCount(0);
  await page.getByTestId("disposition-cancel").click();
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("disposition-result")).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#disposition-input").fill(long + ";filename=b");
  await page.getByTestId("apply-now").focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("disposition-selected")).toContainText('"b"');
  await page.locator("#disposition-input").fill(long + ";filename=c");
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("disposition-result")).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").check();
  await page.clock.fastForward(800);
  await expect(page.getByTestId("disposition-selected")).toContainText('"c"');
});

test("Content-Disposition rejects oversized paste and malformed fields without stale exports", async ({ page }) => {
  await page.goto("./en/tools/content-disposition/");
  await page.getByTestId("disposition-sample").click();
  const prevented = await page.locator("#disposition-input").evaluate((element) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    element.dispatchEvent(event); return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(page.getByTestId("disposition-result")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  for (const [input, code] of [
    ['attachment;filename="' + "a".repeat(1025) + '"', "LIMIT"],
    ["attachment" + Array.from({ length: 33 }, (_, i) => `;x${i}=a`).join(""), "LIMIT"],
    ["attachment;filename*=UTF-8''%C0%AF", "ENCODING"],
    ["attachment\nContent-Disposition: inline", "SYNTAX"],
    ["attachment;filename*0*=UTF-8''part", "CONTINUATION"],
  ]) {
    await page.locator("#disposition-input").fill(input!);
    await expect(page.getByRole("alert")).toHaveText(dispositionMessages.en[`errors.DISPOSITION_${code}` as keyof typeof dispositionMessages.en]);
    await expect(page.getByTestId("disposition-result")).toHaveCount(0);
  }
  await page.getByTestId("disposition-clear").click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.locator("#disposition-input").fill("inline");
  await expect(page.getByTestId("disposition-result")).toBeVisible();
});

