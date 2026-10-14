import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { corsMessages } from "../../src/i18n/cors";

const PRIVATE = "PRIVATE_CORS_7261";
async function assets(dir: string, prefix = "/army-knife/"): Promise<string[]> {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map((entry) =>
    entry.isDirectory() ? assets(`${dir}/${entry.name}`, `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
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
    context.on("request", (r) => requests.push({ url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() }));
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("websocket", (socket) => sockets.push(socket.url()));
    await use();
    for (const request of requests) {
      const url = new URL(request.url);
      if (url.protocol === "blob:") continue;
      expect(url.origin).toBe(new URL(baseURL!).origin);
      expect((await allowed).has(url.pathname)).toBe(true);
      expect(url.search).toBe("");
      expect(request.method).toBe("GET");
      expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests).toLowerCase()).not.toContain(PRIVATE.toLowerCase());
    expect(errors).toEqual([]);
    expect(sockets).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`CORS conditions, localized errors, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const messages = corsMessages[locale];
    await page.goto(`./${locale}/tools/cors/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#cors-origin")).toHaveValue("");
    await expect(page.getByTestId("cors-result")).toHaveCount(0);
    await page.getByTestId("cors-sample").click();
    await expect(page.getByTestId("cors-outcome")).toHaveText(messages["cors.possible"]);
    await expect(page.getByTestId("cors-check-preflight-headers")).toHaveAttribute("data-state", "pass");
    await expect(page.getByTestId("cors-check-actual-credentials")).toBeVisible();
    const firstCell = page.getByTestId("cors-check-actual-origin").locator("td").first();
    expect((await firstCell.boundingBox())!.width).toBeGreaterThanOrEqual(90);
    const table = page.locator(".cors-table");
    await table.focus();
    if (testInfo.project.name.endsWith("small")) {
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      await table.evaluate((element) => { element.scrollLeft = 0; });
    }
    // Native keyboard control in the compiled Vapor view.
    await page.locator("#cors-credentials").focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#cors-credentials")).not.toBeChecked();
    await page.keyboard.press("Space");
    await expect(page.locator("#cors-credentials")).toBeChecked();
    await page.locator("#cors-actual").fill("Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true");
    await expect(page.getByTestId("cors-outcome")).toHaveText(messages["cors.blocked"]);
    await page.locator("#cors-origin").fill("https://app.example/");
    await expect(page.getByRole("alert")).toHaveText(messages["errors.CORS_ORIGIN"]);
    await expect(page.getByTestId("cors-result")).toHaveCount(0);
    await page.getByTestId("cors-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      await expect(page.getByTestId("cors-outcome")).toHaveAttribute("data-outcome", "possible");
      const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.width + 1);
      await testInfo.attach(`cors-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
  });
}

test("CORS reports export only on request and leave inputs out of URLs, storage and network", async ({ page }) => {
  await page.goto("./en/tools/cors/");
  await page.getByTestId("cors-sample").click();
  await page.locator("#cors-origin").fill(`https://${PRIVATE.toLowerCase()}.example`);
  await page.locator("#cors-actual").fill(`Access-Control-Allow-Origin: *\nX-Note: ${PRIVATE}\nX-Markup: <img src='https://example.invalid/${PRIVATE}' onerror='alert(1)'>`);
  await expect(page.getByTestId("cors-outcome")).toHaveAttribute("data-outcome", "blocked");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("army-knife-cors.json");
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const report = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(report.outcome).toBe("blocked");
  expect(report.origin).toBe(`https://${PRIVATE.toLowerCase()}.example`);
  expect(JSON.stringify(report)).not.toContain("<img");
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href }));
  expect(JSON.stringify(state).toLowerCase()).not.toContain(PRIVATE.toLowerCase());
  await page.reload();
  await expect(page.locator("#cors-origin")).toHaveValue("");
  await expect(page.locator("#cors-actual")).toHaveValue("");
});

test("long header blocks defer, cancel, apply manually and discard stale output", async ({ page }) => {
  await page.goto("./en/tools/cors/");
  await page.getByTestId("cors-sample").click();
  await page.clock.install();
  const source = "Access-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Credentials: true\nX-Padding: " + "x".repeat(2100);
  await page.locator("#cors-actual").fill(source);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await expect(page.getByTestId("cors-result")).toHaveCount(0);
  await page.getByTestId("cors-cancel").click();
  await page.clock.fastForward(1000);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#cors-actual").fill(source + "y");
  await expect(page.getByTestId("execution-status")).toHaveText("Ready to apply");
  await page.getByTestId("apply-now").click();
  await expect(page.getByTestId("cors-outcome")).toHaveAttribute("data-outcome", "possible");
  await page.locator("#cors-actual").fill(source + "z");
  await expect(page.getByTestId("cors-result")).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").check();
  await page.clock.fastForward(900);
  await expect(page.getByTestId("cors-outcome")).toHaveAttribute("data-outcome", "possible");
});

test("rejected oversized edits cannot produce a truncated success or export stale results", async ({ page }) => {
  await page.goto("./en/tools/cors/");
  for (const [selector, oversized] of [
    ["#cors-status", "2049"],
    ["#cors-method", "A".repeat(33)],
    ["#cors-origin", "https://" + "a".repeat(2048) + ".example"],
    ["#cors-unsafe", "x".repeat(2049)],
    ["#cors-actual", "X:" + "x".repeat(16400)],
    ["#cors-preflight", "X:" + "x".repeat(16400)],
  ]) {
    await page.getByTestId("cors-sample").click();
    await expect(page.getByTestId("cors-outcome")).toHaveAttribute("data-outcome", "possible");
    await page.locator(selector!).fill(oversized!);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(corsMessages.en["cors.rejected"], { exact: true })).toBeVisible();
    await expect(page.getByTestId("cors-result")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
    await page.getByTestId("cors-sample").click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByTestId("cors-outcome")).toHaveAttribute("data-outcome", "possible");
    // Oversized paste is stopped before the browser inserts the text into the DOM.
    await page.locator(selector!).evaluate((element, text) => {
      const clipboard = new DataTransfer();
      clipboard.setData("text/plain", text);
      element.dispatchEvent(new ClipboardEvent("paste", { clipboardData: clipboard, bubbles: true, cancelable: true }));
    }, oversized!);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByTestId("cors-result")).toHaveCount(0);
  }
  // A valid edit, even equal to the retained previous value, restores eligibility.
  await page.locator("#cors-preflight").fill("Access-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Credentials: true\nAccess-Control-Allow-Methods: PUT\nAccess-Control-Allow-Headers: authorization, content-type");
  await expect(page.getByTestId("cors-outcome")).toHaveAttribute("data-outcome", "possible");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator("#cors-origin")).toHaveValue("");
});
