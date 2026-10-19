import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { pkceMessages } from "../../src/i18n/pkce";

const PRIVATE = "PRIVATE_PKCE_20261020";
const RFC_VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const RFC_CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
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
    const requests: unknown[] = [];
    const errors: string[] = [];
    const sockets: string[] = [];
    context.on("request", (request) => requests.push({ url: request.url(), method: request.method(), headers: request.headers(), body: request.postData() }));
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.text().includes(PRIVATE)) errors.push(message.text());
    });
    page.on("websocket", (socket) => sockets.push(socket.url()));
    await use();
    for (const request of requests as { url: string; method: string; body: string | null }[]) {
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
  test(`PKCE RFC vector, generation, localized errors, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const messages = pkceMessages[locale];
    await page.goto(`./${locale}/tools/pkce/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(messages["tool.pkce.description"]);
    await expect(page.getByTestId("pkce-result")).toHaveCount(0);
    await page.getByTestId("pkce-sample").click();
    await expect(page.getByTestId("pkce-challenge")).toHaveText(RFC_CHALLENGE);
    await expect(page.getByTestId("pkce-verifier")).toHaveText(RFC_VERIFIER);
    await expect(page.getByTestId("pkce-state")).toHaveCount(0);
    await page.locator("#pkce-verifier-input").fill("a".repeat(42));
    await expect(page.getByRole("alert")).toHaveText(messages["errors.PKCE_VERIFIER"]);
    await expect(page.getByTestId("pkce-result")).toHaveCount(0);
    const unreserved = "Az9-._~".repeat(10);
    await page.locator("#pkce-verifier-input").fill(unreserved);
    await expect(page.getByTestId("pkce-challenge")).toHaveText(createHash("sha256").update(unreserved).digest("base64url"));
    await page.locator("#pkce-mode").selectOption("generate");
    await expect(page.getByTestId("pkce-result")).toHaveCount(0);
    await page.locator("#pkce-verifier-length").fill("128");
    await page.locator("#pkce-state-length").fill("16");
    await page.getByTestId("pkce-generate").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("pkce-verifier")).toHaveText(/^[A-Za-z0-9_-]{128}$/);
    await expect(page.getByTestId("pkce-state")).toHaveText(/^[A-Za-z0-9_-]{16}$/);
    const verifier = (await page.getByTestId("pkce-verifier").textContent())!;
    await expect(page.getByTestId("pkce-challenge")).toHaveText(createHash("sha256").update(verifier).digest("base64url"));
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
      await testInfo.attach(`pkce-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await page.locator("#pkce-state-length").fill("0");
    await page.getByTestId("pkce-generate").click();
    await expect(page.getByRole("alert")).toHaveText(messages["errors.PKCE_STATE_LENGTH"]);
    await expect(page.getByTestId("pkce-result")).toHaveCount(0);
    await page.locator("#pkce-state-enabled").focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#pkce-state-enabled")).not.toBeChecked();
    await expect(page.getByTestId("pkce-result")).toHaveCount(0);
    await page.getByTestId("pkce-generate").click();
    await expect(page.getByTestId("pkce-result")).toBeVisible();
    await expect(page.getByTestId("pkce-state")).toHaveCount(0);
    await page.locator("#pkce-verifier-length").fill("42");
    await page.getByTestId("pkce-generate").click();
    await expect(page.getByRole("alert")).toHaveText(messages["errors.PKCE_LENGTH"]);
    await expect(page.getByTestId("pkce-result")).toHaveCount(0);
  });
}

test("PKCE values copy only on request and stay out of URLs, storage, logs and requests", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (value: string) => { (window as unknown as { copied: string[] }).copied.push(value); },
    } });
    (window as unknown as { copied: string[] }).copied = [];
  });
  await page.goto("./en/tools/pkce/");
  await page.getByTestId("pkce-generate").click();
  await expect(page.getByTestId("pkce-result")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copied: string[] }).copied)).toEqual([]);
  for (const key of ["verifier", "challenge", "state"]) {
    const value = (await page.getByTestId(`pkce-${key}`).textContent())!;
    await page.getByTestId(`pkce-copy-${key}`).click();
    expect(await page.evaluate(() => (window as unknown as { copied: string[] }).copied.at(-1))).toBe(value);
  }
  await page.locator("#pkce-mode").selectOption("derive");
  const verifier = PRIVATE.padEnd(43, "x");
  await page.locator("#pkce-verifier-input").fill(verifier);
  await expect(page.getByTestId("pkce-verifier")).toHaveText(verifier);
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload();
  await expect(page.locator("#pkce-mode")).toHaveValue("generate");
  await expect(page.getByTestId("pkce-result")).toHaveCount(0);
  await page.getByTestId("pkce-sample").click();
  await expect(page.getByTestId("pkce-challenge")).toHaveText(RFC_CHALLENGE);
  await page.locator("a.back-link").click();
  await page.getByTestId("tool-card-pkce").click();
  await expect(page.locator("#pkce-mode")).toHaveValue("generate");
  await expect(page.getByTestId("pkce-result")).toHaveCount(0);
});

test("PKCE cancels a pending native digest and rejects oversized paste without stale output", async ({ page }) => {
  // Compute with the real browser Crypto API, but hold delivery to expose the lifecycle.
  await page.addInitScript(() => {
    const native = crypto.subtle.digest.bind(crypto.subtle);
    const host = window as unknown as { release?: () => void; hold: boolean };
    host.hold = true;
    crypto.subtle.digest = async (...args) => {
      const result = await native(...args);
      if (host.hold) await new Promise<void>((resolve) => { host.release = resolve; });
      return result;
    };
  });
  await page.goto("./en/tools/pkce/");
  await page.getByTestId("pkce-generate").click();
  await expect(page.getByTestId("pkce-cancel")).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as { release?: () => void }).release));
  await page.getByTestId("pkce-cancel").click();
  await page.evaluate(() => {
    const host = window as unknown as { release: () => void; hold: boolean };
    host.hold = false; host.release();
  });
  await expect(page.getByTestId("pkce-result")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("cancelled");
  await page.getByTestId("pkce-sample").click();
  await expect(page.getByTestId("pkce-challenge")).toHaveText(RFC_CHALLENGE);
  await page.locator("#pkce-verifier-input").evaluate((element) => {
    const data = new DataTransfer(); data.setData("text/plain", "a".repeat(100000));
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  });
  await expect(page.getByRole("alert")).toHaveText(pkceMessages.en["errors.PKCE_VERIFIER"]);
  await expect(page.getByTestId("pkce-result")).toHaveCount(0);
  await page.getByTestId("pkce-sample").click();
  await expect(page.getByTestId("pkce-challenge")).toHaveText(RFC_CHALLENGE);
  await page.getByTestId("pkce-clear").click();
  await expect(page.locator("#pkce-verifier-input")).toHaveValue("");
  await expect(page.getByTestId("pkce-result")).toHaveCount(0);
});
