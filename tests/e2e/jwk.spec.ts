import { readdir } from "node:fs/promises";
import { expect, test as base, type Download, type Page } from "@playwright/test";
import { jwkMessages } from "../../src/i18n/jwk";

const PRIVATE = "PRIVATE_JWK_7517239";
const key = { kty: "OKP", crv: "Ed25519", x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo" };
const fingerprint = "kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k";
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
async function open(page: Page, locale = "en") {
  await page.goto(`./${locale}/tools/jwk/`);
  await expect(page.locator("#jwk-input")).toBeVisible();
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", "jwk");
}
async function readDownload(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
async function privateState(page: Page) {
  expect(await page.evaluate(() => JSON.stringify({ url: location.href, local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain(PRIVATE);
}

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`public JWK sample, keyboard, guides and themes in ${locale}`, async ({ page }, testInfo) => {
    await open(page, locale);
    await expect(page.locator("#jwk-input")).toHaveValue("");
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(jwkMessages[locale]["jwk.exampleResult"]);
    await page.getByTestId("jwk-sample").focus(); await page.keyboard.press("Enter");
    const result = page.getByTestId("jwk-result");
    await expect(result).toBeVisible(); await expect(page.getByTestId("jwk-key")).toHaveCount(2);
    for (const element of await page.getByTestId("jwk-thumbprint").all()) await expect(element).toHaveText(fingerprint);
    await expect(result).toContainText(jwkMessages[locale]["jwk.assessment.mismatch"]);
    await expect(result).toContainText(jwkMessages[locale]["jwk.warning.duplicateKey"]);
    await result.locator("summary").first().focus(); await page.keyboard.press("Enter");
    await expect(result.locator("details").first()).toHaveAttribute("open", "");
    await expect(result.locator("pre").first()).toContainText('"crv":"Ed25519"');
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      const geo = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, body: document.documentElement.scrollWidth }));
      expect(geo.body).toBeLessThanOrEqual(geo.viewport + 1);
      if ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark")) {
        const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-");
        const path = capture ? `docs/screenshots/jwk-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
        await testInfo.attach(`jwk-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
      }
    }
  });
}

test("exact explicit JSON download, omitted references and memory-only input", async ({ page }) => {
  await open(page);
  await page.locator("#jwk-input").fill(JSON.stringify({ ...key, kid: PRIVATE, custom: "OMIT_ME", x5u: `https://example.invalid/${PRIVATE}` }));
  const result = page.getByTestId("jwk-result");
  await expect(result).toBeVisible(); await expect(result).not.toContainText("OMIT_ME");
  await expect(result.locator("a")).toHaveCount(0);
  const pending = page.waitForEvent("download"); await result.getByRole("button", { name: "Download", exact: true }).click();
  const text = await readDownload(await pending);
  expect(text).not.toContain("OMIT_ME"); expect(text).not.toContain("example.invalid");
  expect(JSON.parse(text)).toMatchObject({ keys: [{ kid: PRIVATE, thumbprint: fingerprint, ignoredMembers: 2 }] });
  await privateState(page);
  await page.reload(); await expect(page.locator("#jwk-input")).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("private material rejects the whole set and invalid input clears old exports", async ({ page }) => {
  await open(page); await page.getByTestId("jwk-sample").click();
  const result = page.getByTestId("jwk-result"); await expect(result).toBeVisible();
  await page.locator("#jwk-input").fill(JSON.stringify({ keys: [key, { ...key, d: PRIVATE }] }));
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText("Only public keys");
  await expect(page.locator(".output-actions")).toHaveCount(0);
  await expect(page.getByRole("alert")).not.toContainText(PRIVATE);
  await page.locator("#jwk-input").fill('{"kty":"OKP","kty":"RSA"}');
  await expect(page.getByRole("alert")).toContainText("duplicate-member");
  await page.locator("#jwk-input").fill(JSON.stringify({ keys: Array(33).fill(key) }));
  await expect(page.getByRole("alert")).toContainText("32 keys"); await expect(result).toHaveCount(0);
  await page.getByTestId("jwk-sample").click(); await expect(result).toBeVisible();
  await page.locator("#jwk-input-file").setInputFiles({ name: "oversize.json", mimeType: "application/json", buffer: Buffer.alloc(65537, 32) });
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText("size limit");
  await page.getByTestId("jwk-sample").click(); await expect(result).toBeVisible();
  await page.locator("#jwk-input-file").setInputFiles({ name: "invalid-utf8.json", mimeType: "application/json", buffer: Buffer.from([0xff]) });
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  await privateState(page);
});

test("real file import preserves RSA integers and empty sets are explicit", async ({ page }) => {
  await open(page);
  const rsa = { kty: "RSA", n: Buffer.from([128, ...Array<number>(254).fill(0), 1]).toString("base64url"), e: "IAAAAAAAAQ" };
  await page.locator("#jwk-input-file").setInputFiles({ name: "public.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(rsa)) });
  const result = page.getByTestId("jwk-result");
  await expect(result).toContainText("9007199254740993"); await expect(result).toContainText("2048");
  await page.locator("#jwk-input").fill('{"keys":[]}'); await expect(result).toContainText("contains no keys");
  await expect(page.getByTestId("jwk-key")).toHaveCount(0);
  await page.goto("./ja/tools/jwk/"); await expect(page.locator("#jwk-input")).toHaveValue("");
  await expect(result).toHaveCount(0);
});

test("800ms delay, pending cancellation, manual apply and rejected paste", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await open(page); await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  const source = JSON.stringify({ ...key, extension: PRIVATE.repeat(150) });
  await page.locator("#jwk-input").fill(source);
  const result = page.getByTestId("jwk-result");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(799); await expect(result).toHaveCount(0);
  await page.clock.runFor(1); await expect(result).toBeVisible();
  await page.locator("#jwk-input").fill(source + " "); await expect(result).toHaveCount(0);
  await page.getByTestId("jwk-cancel").focus(); await page.keyboard.press("Enter");
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#jwk-input").fill(source + "  "); await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").focus(); await page.keyboard.press("Enter"); await expect(result).toBeVisible();
  await page.locator("#jwk-input").evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(65537) } });
    element.dispatchEvent(event);
  });
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText("size limit");
  await privateState(page);
});
