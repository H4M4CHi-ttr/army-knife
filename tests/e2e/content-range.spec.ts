import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { contentRangeMessages } from "../../src/i18n/content-range";
import { CONTENT_RANGE_SAMPLE } from "../../src/lib/tools/content-range-sample";

const PRIVATE = "PRIVATE_CONTENT_RANGE_4196";
const PRIVATE_NUMBER = "3141592653589793238462643383279502884196";
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
    expect(JSON.stringify(requests)).not.toContain(PRIVATE_NUMBER);
    expect(errors).toEqual([]); expect(sockets).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("Content-Range exact forms, keyboard and themes in " + locale, async ({ page }, testInfo) => {
    const m = contentRangeMessages[locale], result = page.getByTestId("content-range-result");
    await page.goto("./" + locale + "/tools/content-range/");
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("h1")).toHaveText(m["tool.content-range.name"]);
    await expect(result).toHaveCount(0);
    await page.getByTestId("content-range-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("content-range-first")).toHaveText("9007199254740993");
    await expect(page.getByTestId("content-range-range-bytes")).toHaveText("1000");
    await expect(page.getByTestId("content-range-after")).toHaveText("1000");
    await expect(page.getByTestId("content-range-whole")).toHaveText(m["contentRange.no"]);
    await expect(page.getByTestId("content-range-canonical")).toHaveText(CONTENT_RANGE_SAMPLE.slice(15));
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? "docs/screenshots/content-range-" + locale + "-" + theme + "-" + (testInfo.project.name.endsWith("small") ? "small" : "desktop") + ".png" : undefined;
      await testInfo.attach("content-range-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.locator("#content-range-input").fill("bytes 0-0/*");
    await expect(page.getByTestId("content-range-total")).toHaveText(m["contentRange.unknown"]);
    await expect(page.getByTestId("content-range-after")).toHaveText(m["contentRange.unknown"]);
    await expect(page.getByTestId("content-range-whole")).toHaveText(m["contentRange.unknown"]);
    await page.locator("#content-range-input").fill("bytes */0");
    await expect(page.getByTestId("content-range-total")).toHaveText("0");
    await expect(page.getByTestId("content-range-range-bytes")).toHaveText(m["contentRange.notApplicable"]);
    await expect(result).toContainText(m["contentRange.unsatisfiedHelp"]);
    await page.locator("#content-range-input").fill("bytes 0-0/1");
    await expect(page.getByTestId("content-range-whole")).toHaveText(m["contentRange.yes"]);
    await page.getByTestId("content-range-clear").focus(); await page.keyboard.press("Enter");
    await expect(result).toHaveCount(0); await expect(page.locator("#content-range-input")).toHaveValue("");
  });
}

test("Content-Range exact JSON/download, inert rejection and memory-only lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { copies: string[] }).copies = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text: string) => { (window as unknown as { copies: string[] }).copies.push(text); },
    } });
  });
  await page.goto("./en/tools/content-range/"); await page.getByTestId("content-range-sample").click();
  const result = page.getByTestId("content-range-result"), input = page.locator("#content-range-input");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toEqual({
    unit: "bytes", kind: "range", canonical: CONTENT_RANGE_SAMPLE.slice(15),
    first: "9007199254740993", last: "9007199254741992", rangeBytes: "1000",
    completeLength: "9007199254742993", bytesBefore: "9007199254740993", bytesAfter: "1000",
    coversWholeRepresentation: false,
  });
  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe("army-knife-content-range.json");
  const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  await input.fill("bytes */0"); await result.getByRole("button", { name: "Copy", exact: true }).click();
  const empty = JSON.parse(await page.evaluate(() => (window as unknown as { copies: string[] }).copies.at(-1)!));
  expect(empty).toMatchObject({ kind: "unsatisfied", completeLength: "0", rangeBytes: null, coversWholeRepresentation: null });
  await input.fill("bytes " + PRIVATE_NUMBER + "-" + PRIVATE_NUMBER + "/*");
  await expect(page.getByTestId("content-range-range-bytes")).toHaveText("1");
  const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(await state())).not.toContain(PRIVATE_NUMBER);
  await input.fill("<img src=https://example.invalid/" + PRIVATE + ">");
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await expect(page.locator("#main-content img, #main-content script")).toHaveCount(0);
  expect(await page.getByRole("alert").textContent()).not.toContain(PRIVATE);
  expect(JSON.stringify(await state())).not.toContain(PRIVATE);
  await page.reload(); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("content-range-sample").click(); await page.locator(".back-link").click(); await page.getByTestId("tool-card-content-range").click();
  await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("content-range-sample").click(); await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("Content-Range raw/digit/bounds/import rejection with saved auto-apply off", async ({ page }) => {
  await page.goto("./en/tools/retry-after/");
  await page.locator("#retry-after-input").fill("120" + " ".repeat(2100));
  await page.locator("#retry-after-reference").fill("2026-11-13T00:00:00Z");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-content-range").click();
  const result = page.getByTestId("content-range-result"), input = page.locator("#content-range-input");
  await page.getByTestId("content-range-sample").click();
  await expect(result).toBeVisible();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-mode", "instant");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "applied");
  await input.fill("bytes 0-" + "9".repeat(40) + "/*");
  await expect(page.getByTestId("content-range-range-bytes")).toHaveText("1" + "0".repeat(40));
  for (const value of ["bytes 1-0/2", "bytes 0-0/0", "bytes 0-10/10", "bytes 0-" + "9".repeat(41) + "/*", "bytes 0-1/10\n", "items 0-1/10"]) {
    await input.fill(value); await expect(result).toHaveCount(0);
    await expect(page.getByRole("alert")).toBeVisible(); await expect(page.locator(".output-actions")).toHaveCount(0);
  }
  await input.fill("bytes 0-0/1" + " ".repeat(245)); await expect(result).toBeVisible();
  await input.evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(257) } });
    element.dispatchEvent(event);
  });
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  for (const bytes of [
    Array.from(new TextEncoder().encode("bytes 0-0/1")),
    Array.from(new TextEncoder().encode("\ufeffbytes 0-0/1")), [255], Array(257).fill(120),
  ]) {
    await page.getByTestId("content-range-sample").click();
    await input.evaluate((element, value) => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [new File([Uint8Array.from(value)], "synthetic.txt")], getData: () => "" } });
      element.dispatchEvent(event);
    }, bytes);
    if (bytes[0] === 98) {
      await expect(page.getByTestId("content-range-range-bytes")).toHaveText("1");
    } else {
      await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.locator(".output-actions")).toHaveCount(0);
    }
  }
  await page.getByTestId("content-range-sample").click(); await expect(result).toBeVisible();
});
