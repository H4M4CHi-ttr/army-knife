import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { pgLsnMessages } from "../../src/i18n/pg-lsn";

const PRIVATE = "PRIVATE_PG_LSN_7812";
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
  test(`WAL LSN exact values, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = pgLsnMessages[locale];
    await page.goto(`./${locale}/tools/pg-lsn/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("h1")).toHaveText(m["tool.pg-lsn.name"]);
    const result = page.getByTestId("pg-lsn-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("pg-lsn-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("pg-lsn-delta")).toHaveText("33554432");
    await expect(page.getByTestId("pg-lsn-position")).toHaveCount(2);
    await expect(page.getByTestId("pg-lsn-position").first()).toContainText("255");
    await page.locator("#pg-lsn-segment").focus(); await page.keyboard.press("Home"); await page.keyboard.press("Enter");
    await expect(page.locator("#pg-lsn-segment")).toHaveValue("1");
    await expect(page.getByTestId("pg-lsn-position").first()).toContainText("4080");
    await page.getByTestId("pg-lsn-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/pg-lsn-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`pg-lsn-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.locator("#pg-lsn-first").fill("1/0"); await page.locator("#pg-lsn-second").fill("0/FFFFFFFF");
    await expect(page.getByTestId("pg-lsn-delta")).toHaveText("-1");
    await expect(page.getByTestId("pg-lsn-direction")).toHaveText(m["lsn.backward"]);
    await page.locator("#pg-lsn-first").fill("0/0"); await page.locator("#pg-lsn-second").fill("0/0");
    await expect(page.getByTestId("pg-lsn-zero")).toHaveCount(2);
    await expect(page.getByTestId("pg-lsn-direction")).toHaveText(m["lsn.equal"]);
    await page.getByTestId("pg-lsn-clear").focus(); await page.keyboard.press("Enter");
    await expect(result).toHaveCount(0); await expect(page.locator("#pg-lsn-first")).toHaveValue("");
    await expect(page.locator("#pg-lsn-second")).toHaveValue("");
  });
}

test("WAL LSN complete exact JSON, inert input and memory lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/pg-lsn/"); await page.getByTestId("pg-lsn-sample").click();
  const result = page.getByTestId("pg-lsn-result");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toEqual({
    first: { lsn: "0/FF000000", bytePosition: "4278190080", segmentNumber: "255", segmentOffsetBytes: "0", zero: false },
    second: { lsn: "1/1000000", bytePosition: "4311744512", segmentNumber: "257", segmentOffsetBytes: "0", zero: false },
    segmentMiB: 16, segmentBytes: "16777216", deltaBytes: "33554432", distanceBytes: "33554432",
    direction: "forward", distanceMiB: { whole: "32", remainderBytes: "0" },
  });
  const pending = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe("army-knife-pg-lsn.json");
  const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  await page.locator("#pg-lsn-first").fill("D15EA5ED/BA5E2026"); await page.locator("#pg-lsn-second").fill("D15EA5ED/BA5E2026");
  await expect(page.getByTestId("pg-lsn-delta")).toHaveText("0");
  const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(await state())).not.toContain("D15EA5ED");
  await page.locator("#pg-lsn-first").fill(`<img src=https://example.invalid/${PRIVATE}>`);
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("#main-content img, #main-content script")).toHaveCount(0);
  expect(JSON.stringify(await state())).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator("#pg-lsn-first")).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("pg-lsn-sample").click(); await page.locator(".back-link").click(); await page.getByTestId("tool-card-pg-lsn").click();
  await expect(page.locator("#pg-lsn-first")).toHaveValue("");
  await page.getByTestId("pg-lsn-sample").click(); await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(page.locator("#pg-lsn-first")).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("WAL LSN precision, raw bounds and either rejected edit remove stale exports", async ({ page }) => {
  await page.goto("./en/tools/pg-lsn/");
  const result = page.getByTestId("pg-lsn-result");
  await page.locator("#pg-lsn-first").fill("200000/1"); await page.locator("#pg-lsn-second").fill("200000/2");
  await expect(page.getByTestId("pg-lsn-delta")).toHaveText("1"); await expect(result).toContainText("9007199254740993");
  await page.locator("#pg-lsn-second").fill("FFFFFFFF/FFFFFFFF"); await expect(result).toContainText("18446744073709551615");
  for (const id of ["first", "second"]) {
    for (const text of ["0/100000000", "1 /0", "１/0", "1/0\n", "0/0" + " ".repeat(62)]) {
      await page.getByTestId("pg-lsn-sample").click(); await page.locator(`#pg-lsn-${id}`).fill(text);
      await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    }
    await page.getByTestId("pg-lsn-sample").click();
    await page.locator(`#pg-lsn-${id}`).evaluate(element => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(65) } });
      element.dispatchEvent(event);
    });
    await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await page.locator("#pg-lsn-segment").selectOption("32"); await expect(result).toHaveCount(0);
    await page.locator(`#pg-lsn-${id}`).fill("0/0" + " ".repeat(61)); await expect(result).toBeVisible();
  }
});

test("WAL LSN remains instant when deferred auto-apply is disabled", async ({ page }) => {
  await page.goto("./en/tools/retry-after/");
  await page.locator("#retry-after-input").fill("120" + " ".repeat(2100));
  await page.locator("#retry-after-reference").fill("2026-11-11T00:00:00Z");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-pg-lsn").click();
  await page.getByTestId("pg-lsn-sample").click();
  await expect(page.getByTestId("pg-lsn-delta")).toHaveText("33554432");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-mode", "instant");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "applied");
});
