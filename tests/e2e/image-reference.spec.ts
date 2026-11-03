import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { imageReferenceMessages } from "../../src/i18n/image-reference";
import { IMAGE_REFERENCE_SAMPLE } from "../../src/lib/tools/image-reference-sample";

const PRIVATE = "private-image-7193";
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
  test(`Docker reference defaults, digest precedence, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = imageReferenceMessages[locale];
    await page.goto(`./${locale}/tools/image-reference/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.image-reference.description"]);
    await expect(page.locator("#image-reference-input")).toHaveValue("");
    const result = page.getByTestId("image-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("image-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("image-normalized")).toHaveText(IMAGE_REFERENCE_SAMPLE);
    await expect(page.getByTestId("image-pull")).toHaveText(IMAGE_REFERENCE_SAMPLE.replace(":stable@", "@"));
    await expect(page.getByTestId("image-ignored")).toHaveText(m["image.ignored"]);
    await expect(page.getByTestId("image-defaults")).toHaveText(m["image.none"]);
    await page.locator("#image-reference-input").fill("alpine");
    await expect(page.getByTestId("image-pull")).toHaveText("docker.io/library/alpine:latest");
    for (const key of ["registry", "library", "tag"] as const) await expect(page.getByTestId("image-defaults")).toContainText(m[`image.default.${key}`]);
    await page.getByTestId("image-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/image-reference-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`image-reference-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.getByTestId("image-clear").focus(); await page.keyboard.press("Enter");
    await expect(result).toHaveCount(0); await expect(page.locator("#image-reference-input")).toHaveValue("");
  });
}

test("Docker reference exports exact explicit JSON and keeps input in memory", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/image-reference/"); await page.getByTestId("image-sample").click();
  const result = page.getByTestId("image-result");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toEqual({
    normalized: IMAGE_REFERENCE_SAMPLE, pullReference: IMAGE_REFERENCE_SAMPLE.replace(":stable@", "@"),
    registry: "registry.example:5000", host: "registry.example", port: "5000", repository: "team/app",
    tag: "stable", digest: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    selection: "digest", tagIgnored: true, legacyRegistry: false,
    defaults: { registry: false, library: false, tag: false },
  });
  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-image-reference.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  await page.locator("#image-reference-input").fill(`${PRIVATE}.example/team/app:V1`);
  await expect(page.getByTestId("image-pull")).toHaveText(`${PRIVATE}.example/team/app:V1`);
  await page.locator("#image-reference-input").fill(`<img src='https://example.invalid/${PRIVATE}'>`);
  await expect(result).toHaveCount(0); await expect(page.locator(".tool-panel img")).toHaveCount(0);
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator("#image-reference-input")).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("image-sample").click();
  await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#image-reference-input")).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("Docker reference rejects unsupported, malformed and oversized edits without stale exports", async ({ page }) => {
  await page.goto("./en/tools/image-reference/");
  const result = page.getByTestId("image-result"), input = page.locator("#image-reference-input");
  for (const text of ["UPPER", "a___b", "r:.tag", "r@sha256:abcd", "r@blake3:abcd", "a".repeat(64), "https://registry.example/r", "[::::]/r", "a".repeat(248), `r:${"t".repeat(129)}`]) {
    await page.getByTestId("image-sample").click();
    await input.fill(text);
    await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await input.fill("r@blake3:abcd");
  await expect(page.getByRole("alert")).toContainText("other algorithms may be valid elsewhere");
  await page.getByTestId("image-sample").click();
  await input.evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(1025) } });
    element.dispatchEvent(event);
  });
  await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  await page.getByTestId("image-sample").click(); await expect(result).toBeVisible();
});

test("Docker reference stays immediate with saved auto-apply off and clears on app navigation", async ({ page }) => {
  await page.goto("./en/tools/retry-after/");
  await page.locator("#retry-after-input").fill("120" + " ".repeat(2100));
  await page.locator("#retry-after-reference").fill("2026-11-03T00:00:00Z");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator(".back-link").click();
  await page.getByTestId("tool-card-image-reference").click();
  const input = page.locator("#image-reference-input");
  await input.fill("alpine" + " ".repeat(1018));
  await expect(page.getByTestId("image-pull")).toHaveText("docker.io/library/alpine:latest");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-mode", "instant");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "applied");
  await page.locator(".back-link").click();
  await page.getByTestId("tool-card-image-reference").click();
  await expect(input).toHaveValue(""); await expect(page.getByTestId("image-result")).toHaveCount(0);
});
