import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { dnsTxtMessages } from "../../src/i18n/dns-txt";
import { DNS_TXT_SAMPLE_RDATA, DNS_TXT_SAMPLE_TEXT } from "../../src/lib/tools/dns-txt-sample";

const PRIVATE = "PRIVATE_DNS_TXT_5821";
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
  test("DNS TXT split, restore, keyboard and themes in " + locale, async ({ page }, testInfo) => {
    const m = dnsTxtMessages[locale];
    await page.goto("./" + locale + "/tools/dns-txt/");
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("h1")).toHaveText(m["tool.dns-txt.name"]);
    await expect(page.getByTestId("dns-txt-result")).toHaveCount(0);
    await page.getByTestId("dns-txt-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("dns-txt-data-bytes")).toHaveText("257");
    await expect(page.getByTestId("dns-txt-wire-bytes")).toHaveText("259");
    await expect(page.getByTestId("dns-txt-segment")).toHaveCount(2);
    expect(await page.getByTestId("dns-txt-rdata").locator("pre").textContent()).toBe(DNS_TXT_SAMPLE_RDATA);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? "docs/screenshots/dns-txt-" + locale + "-" + theme + "-" + (testInfo.project.name.endsWith("small") ? "small" : "desktop") + ".png" : undefined;
      await testInfo.attach("dns-txt-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.locator("#dns-txt-mode").selectOption("restore");
    await expect(page.locator("#dns-txt-input")).toHaveValue("");
    await expect(page.getByTestId("dns-txt-result")).toHaveCount(0);
    await page.getByTestId("dns-txt-sample").click();
    expect(await page.getByTestId("dns-txt-text").locator("pre").textContent()).toBe(DNS_TXT_SAMPLE_TEXT);
    await page.getByTestId("dns-txt-clear").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("dns-txt-result")).toHaveCount(0);
  });
}

test("DNS TXT exact independent exports, inert text and empty download", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { copies: string[] }).copies = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text: string) => { (window as unknown as { copies: string[] }).copies.push(text); },
    } });
  });
  await page.goto("./en/tools/dns-txt/"); await page.getByTestId("dns-txt-sample").click();
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  for (const [id, text, filename] of [
    ["rdata", DNS_TXT_SAMPLE_RDATA, "army-knife-dns-txt-rdata.txt"],
    ["text", DNS_TXT_SAMPLE_TEXT, "army-knife-dns-txt-text.txt"],
  ]) {
    const section = page.getByTestId("dns-txt-" + id);
    await section.getByRole("button", { name: "Copy", exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies.at(-1))).toBe(text);
    const pending = page.waitForEvent("download");
    await section.getByRole("button", { name: "Download", exact: true }).click();
    const download = await pending; expect(download.suggestedFilename()).toBe(filename);
    const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
    expect(Buffer.concat(chunks).toString("utf8")).toBe(text);
  }
  const inert = '<img src=https://example.invalid/' + PRIVATE + '>"\\\n';
  await page.locator("#dns-txt-input").fill(inert);
  expect(await page.getByTestId("dns-txt-text").locator("pre").textContent()).toBe(inert);
  await expect(page.locator("#main-content img, #main-content script")).toHaveCount(0);
  await page.locator("#dns-txt-input").fill("");
  await expect(page.getByTestId("dns-txt-data-bytes")).toHaveText("0");
  await expect(page.getByTestId("dns-txt-rdata").locator("pre")).toHaveText('""');
  const empty = page.waitForEvent("download");
  await page.getByTestId("dns-txt-text").getByRole("button", { name: "Download", exact: true }).click();
  const download = await empty;
  const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(Buffer.concat(chunks).length).toBe(0);
});

test("DNS TXT strict syntax, byte bounds and rejected edits invalidate exports", async ({ page }) => {
  await page.goto("./en/tools/dns-txt/");
  const input = page.locator("#dns-txt-input"), result = page.getByTestId("dns-txt-result");
  await input.fill("é".repeat(128));
  await expect(page.getByTestId("dns-txt-data-bytes")).toHaveText("256");
  await expect(page.getByTestId("dns-txt-segment")).toHaveCount(2);
  await page.locator("#dns-txt-mode").selectOption("restore");
  for (const value of ['"\\255"', '"\\256"', '"' + "x".repeat(256) + '"', Array(65).fill('""').join(" "), '"a"\n"b"', 'TXT "a"', '"" ;comment']) {
    await input.fill(value); await expect(result).toHaveCount(0);
    await expect(page.locator(".output-actions")).toHaveCount(0);
    await expect(page.getByRole("alert")).toBeVisible();
  }
  for (const current of ["split", "restore"]) {
    await page.locator("#dns-txt-mode").selectOption(current);
    await page.getByTestId("dns-txt-sample").click(); await expect(result).toBeVisible();
    await input.evaluate((element, cap) => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(cap + 1) } });
      element.dispatchEvent(event);
    }, current === "split" ? 8192 : 65536);
    await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await page.getByTestId("dns-txt-sample").click(); await expect(result).toBeVisible();
  }
});

test("DNS TXT deferred auto, manual and cancel preserve immediate light work", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-12T00:00:00Z") }); await page.goto("./en/tools/dns-txt/");
  await page.clock.pauseAt(new Date("2026-11-12T01:00:00Z"));
  const input = page.locator("#dns-txt-input"), result = page.getByTestId("dns-txt-result");
  await input.fill("x".repeat(2049));
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(799); await expect(result).toHaveCount(0);
  await page.clock.runFor(1); await expect(result).toBeVisible();
  await input.fill("y".repeat(2049)); await page.getByTestId("dns-txt-cancel").click();
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(result).toBeVisible();
  await page.getByTestId("auto-apply-toggle").uncheck();
  await input.fill("z".repeat(2049)); await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(result).toBeVisible();
  await input.fill("short"); await expect(result).toBeVisible();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-mode", "instant");
});

test("DNS TXT data clears on mode, tool, locale and reload; no URL or storage input", async ({ page }) => {
  await page.goto("./en/tools/dns-txt/");
  const input = page.locator("#dns-txt-input"), result = page.getByTestId("dns-txt-result");
  await input.fill(PRIVATE);
  const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(await state())).not.toContain(PRIVATE);
  await page.reload(); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await input.fill(PRIVATE); await page.locator(".back-link").click(); await page.getByTestId("tool-card-dns-txt").click();
  await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await input.fill(PRIVATE); await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  expect(JSON.stringify(await state())).not.toContain(PRIVATE);
});

test("DNS TXT dropped files keep BOM and rejected multibyte text drops stay invalid", async ({ page }) => {
  await page.goto("./en/tools/dns-txt/");
  const input = page.locator("#dns-txt-input"), result = page.getByTestId("dns-txt-result");
  for (const text of ["\ufeff", "\ufeffa"]) {
    await input.evaluate((element, value) => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [new File([value], "synthetic.txt")], getData: () => "" } });
      element.dispatchEvent(event);
    }, text);
    await expect(page.getByTestId("dns-txt-data-bytes")).toHaveText(String(new TextEncoder().encode(text).length));
    expect(await page.getByTestId("dns-txt-text").locator("pre").textContent()).toBe(text);
  }
  await input.evaluate(element => {
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files: [], getData: () => "é".repeat(4097) } });
    element.dispatchEvent(event);
  });
  await expect(input).toHaveValue("");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await page.getByTestId("dns-txt-sample").click(); await expect(result).toBeVisible();
  await input.evaluate(element => {
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files: [new File([Uint8Array.of(255)], "synthetic.txt")], getData: () => "" } });
    element.dispatchEvent(event);
  });
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await expect(page.getByRole("alert")).toBeVisible();
});
