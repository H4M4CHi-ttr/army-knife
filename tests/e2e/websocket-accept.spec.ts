import { readdir } from "node:fs/promises";
import { test as base, expect, type Download } from "@playwright/test";
import { websocketAcceptMessages } from "../../src/i18n/websocket-accept";

const PRIVATE = "PRIVATE_WS_61824", PRIVATE_KEY = "UFJJVkFURV9XU182MTgyNA==";
const KEY = "dGhlIHNhbXBsZSBub25jZQ==", ACCEPT = "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=";
const PRIVATE_ACCEPT = "chwgrXaFpYC+Ak+MbRS/bV+dryo=";
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
    for (const marker of [PRIVATE, PRIVATE_KEY, PRIVATE_ACCEPT]) expect(JSON.stringify(requests)).not.toContain(marker);
    expect(errors).toEqual([]); expect(sockets).toEqual([]);
  }, { auto: true }],
});
async function downloadedText(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`WebSocket Accept RFC vector, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = websocketAcceptMessages[locale];
    await page.goto(`./${locale}/tools/websocket-accept/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("h1")).toHaveText(m["tool.websocket-accept.name"]);
    await expect(page.getByTestId("websocket-accept-result")).toHaveCount(0);
    await page.getByTestId("websocket-accept-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("websocket-accept-expected")).toHaveText(ACCEPT);
    await expect(page.getByTestId("websocket-accept-status")).toHaveText(m["wsAccept.match"]);
    await expect(page.getByTestId("websocket-accept-result")).toContainText("b37a4f2cc0624f1690f64606cf385945b2bec4ea");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/websocket-accept-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`websocket-accept-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.locator("#websocket-accept-response").fill("AAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    await expect(page.getByTestId("websocket-accept-status")).toHaveText(m["wsAccept.mismatch"]);
    await page.locator("#websocket-accept-response").fill("");
    await expect(page.getByTestId("websocket-accept-status")).toHaveText(m["wsAccept.notCompared"]);
    await page.getByTestId("websocket-accept-clear").focus(); await page.keyboard.press("Enter");
    for (const id of ["key", "response"]) await expect(page.locator(`#websocket-accept-${id}`)).toHaveValue("");
    await expect(page.getByTestId("websocket-accept-result")).toHaveCount(0);
  });
}

test("WebSocket Accept exports exact independent JSON and header downloads", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = []; (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/websocket-accept/"); await page.getByTestId("websocket-accept-sample").click();
  await expect(page.getByTestId("websocket-accept-result")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  const json = page.getByTestId("websocket-accept-json"), header = page.getByTestId("websocket-accept-header");
  await json.getByRole("button", { name: "Copy", exact: true }).click();
  await header.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies);
  expect(JSON.parse(copied[0]!)).toEqual({ key: KEY, nonceHex: "7468652073616d706c65206e6f6e6365", sha1Hex: "b37a4f2cc0624f1690f64606cf385945b2bec4ea",
    expectedAccept: ACCEPT, recordedAccept: ACCEPT, matches: true, responseHeader: "Sec-WebSocket-Accept: " + ACCEPT });
  expect(copied[1]).toBe("Sec-WebSocket-Accept: " + ACCEPT);
  for (const [container, extension, text] of [[json, "json", copied[0]], [header, "txt", copied[1]]] as const) {
    const pending = page.waitForEvent("download"); await container.getByRole("button", { name: "Download", exact: true }).click();
    const download = await pending; expect(download.suggestedFilename()).toBe("army-knife-websocket-accept." + extension);
    expect(await downloadedText(download)).toBe(text);
  }
  await page.locator("#websocket-accept-response").fill("");
  await expect(page.getByTestId("websocket-accept-status")).toHaveText(websocketAcceptMessages.en["wsAccept.notCompared"]);
  const pending = page.waitForEvent("download"); await json.getByRole("button", { name: "Download", exact: true }).click();
  expect(JSON.parse(await downloadedText(await pending))).toMatchObject({ recordedAccept: null, matches: null });
});

test("WebSocket Accept rejects either malformed/oversize input and preserves independent rejection", async ({ page }) => {
  await page.goto("./en/tools/websocket-accept/");
  const result = page.getByTestId("websocket-accept-result"), sample = page.getByTestId("websocket-accept-sample");
  for (const id of ["key", "response"]) {
    const input = page.locator(`#websocket-accept-${id}`);
    const original = id === "key" ? KEY : ACCEPT;
    for (const value of [" ", original + "\n", "\u00a0" + original, "\ufeff" + original, original.slice(0, -1), "Sec-WebSocket-Key: " + original, "x".repeat(129), "é".repeat(65)]) {
      await sample.click(); await expect(result).toBeVisible(); await input.fill(value);
      await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    }
    await sample.click(); await expect(result).toBeVisible();
    await input.evaluate(element => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(129) } }); element.dispatchEvent(event);
    });
    await expect(result).toHaveCount(0);
    await page.locator(`#websocket-accept-${id === "key" ? "response" : "key"}`).fill(id === "key" ? "" : "AAAAAAAAAAAAAAAAAAAAAA==");
    await expect(result).toHaveCount(0);
    await input.fill(original + " ".repeat(128 - original.length)); await expect(result).toBeVisible();
  }
});

test("WebSocket Accept reads dropped UTF-8 locally and rejects BOM, invalid bytes and raw file limits", async ({ page }) => {
  await page.goto("./en/tools/websocket-accept/");
  const sample = page.getByTestId("websocket-accept-sample"), result = page.getByTestId("websocket-accept-result");
  for (const id of ["key", "response"]) {
    const original = id === "key" ? KEY : ACCEPT;
    for (const bytes of [[...new TextEncoder().encode("\ufeff" + original)], [0xc3, 0x28], [...new TextEncoder().encode(original + "\r\n")], [...new TextEncoder().encode(original + " ".repeat(129 - original.length))]]) {
      await sample.click(); await expect(result).toBeVisible();
      await page.locator(`#websocket-accept-${id}`).evaluate((element, data) => {
        const transfer = new DataTransfer(); transfer.items.add(new File([new Uint8Array(data)], "synthetic.txt", { type: "text/plain" }));
        element.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
      }, bytes);
      await expect(result).toHaveCount(0);
    }
    await sample.click(); await expect(result).toBeVisible();
    await page.locator(`#websocket-accept-${id}`).evaluate((element, text) => {
      const transfer = new DataTransfer(); transfer.items.add(new File([text], "synthetic.txt", { type: "text/plain" }));
      element.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    }, original + " ".repeat(128 - original.length));
    await expect(page.locator(`#websocket-accept-${id}`)).toHaveValue(original + " ".repeat(128 - original.length));
    await expect(result).toBeVisible();
  }
});

test("WebSocket Accept keeps private values out of storage/URL and clears on navigation/reload/locale", async ({ page }) => {
  await page.goto("./en/tools/websocket-accept/");
  await page.locator("#websocket-accept-key").fill(PRIVATE_KEY);
  await page.locator("#websocket-accept-response").fill(PRIVATE_ACCEPT);
  await expect(page.getByTestId("websocket-accept-status")).toHaveText(websocketAcceptMessages.en["wsAccept.match"]);
  const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  for (const marker of [PRIVATE, PRIVATE_KEY, PRIVATE_ACCEPT]) expect(JSON.stringify(await state())).not.toContain(marker);
  await page.locator("#websocket-accept-response").fill(`<img src=https://example.invalid/${PRIVATE}>`);
  await expect(page.getByTestId("websocket-accept-result")).toHaveCount(0);
  await expect(page.locator("#main-content img, #main-content script")).toHaveCount(0);
  expect(JSON.stringify(await state())).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator("#websocket-accept-key")).toHaveValue("");
  await page.getByTestId("websocket-accept-sample").click(); await expect(page.getByTestId("websocket-accept-result")).toBeVisible();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-websocket-accept").click();
  await expect(page.locator("#websocket-accept-key")).toHaveValue("");
  await page.getByTestId("websocket-accept-sample").click(); await expect(page.getByTestId("websocket-accept-result")).toBeVisible();
  await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const id of ["key", "response"]) await expect(page.locator(`#websocket-accept-${id}`)).toHaveValue("");
  await expect(page.getByTestId("websocket-accept-result")).toHaveCount(0);
});

test("WebSocket Accept cancels/discards delayed native digests and retries after its watchdog", async ({ page }) => {
  await page.addInitScript(() => {
    const native = crypto.subtle.digest.bind(crypto.subtle);
    let hold = true;
    const pending: (() => void)[] = [];
    crypto.subtle.digest = (...args) => native(...args).then(value => hold ? new Promise<ArrayBuffer>(resolve => { pending.push(() => resolve(value)); }) : value);
    Object.assign(window, { releaseDigests: () => { hold = false; pending.splice(0).forEach(finish => finish()); }, holdDigests: () => { hold = true; } });
  });
  await page.goto("./en/tools/websocket-accept/"); await page.locator("#websocket-accept-key").fill(KEY);
  await expect(page.getByTestId("websocket-accept-running")).toBeVisible();
  await page.getByTestId("websocket-accept-cancel").click();
  await page.evaluate(() => (window as unknown as { releaseDigests(): void }).releaseDigests());
  await expect(page.getByTestId("websocket-accept-result")).toHaveCount(0);
  await page.getByTestId("websocket-accept-retry").click(); await expect(page.getByTestId("websocket-accept-expected")).toHaveText(ACCEPT);
  await page.clock.install(); await page.evaluate(() => (window as unknown as { holdDigests(): void }).holdDigests());
  await page.locator("#websocket-accept-response").fill(ACCEPT);
  await expect(page.getByTestId("websocket-accept-running")).toBeVisible();
  await page.clock.fastForward(5000);
  await expect(page.getByRole("alert")).toHaveText(websocketAcceptMessages.en["errors.WS_ACCEPT_TIMEOUT"]);
  await page.evaluate(() => (window as unknown as { releaseDigests(): void }).releaseDigests());
  await expect(page.getByTestId("websocket-accept-result")).toHaveCount(0);
  await page.getByTestId("websocket-accept-retry").click();
  await expect(page.getByTestId("websocket-accept-status")).toHaveText(websocketAcceptMessages.en["wsAccept.match"]);
});

test("WebSocket Accept remains immediate when saved deferred auto-apply is disabled", async ({ page }) => {
  await page.goto("./en/tools/retry-after/");
  await page.locator("#retry-after-input").fill("120" + " ".repeat(2100));
  await page.locator("#retry-after-reference").fill("2026-11-18T00:00:00Z");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-websocket-accept").click();
  await page.getByTestId("websocket-accept-sample").click();
  await expect(page.getByTestId("websocket-accept-expected")).toHaveText(ACCEPT);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-mode", "instant");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "applied");
});
