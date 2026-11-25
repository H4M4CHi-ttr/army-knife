import { readFile } from "node:fs/promises";
import { expect, test as base, type Request } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { hreflangMessages } from "../../src/i18n/hreflang";
import { HREFLANG_SAMPLE } from "../../src/lib/tools/hreflang-sample";

const marker = "SYNTHETIC_HREFLANG_PRIVATE_MARKER";
const allowed = readFile("dist/public-assets.json", "utf8").then(parsePublicAssets);
const test = base.extend<{ audit: void }>({
  audit: [async ({ context, page, baseURL }, use) => {
    const requests: Request[] = [];
    const diagnostics: string[] = [];
    context.on("request", request => requests.push(request));
    page.on("pageerror", error => diagnostics.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" || message.text().includes(marker)) diagnostics.push(message.text());
    });
    page.on("websocket", socket => diagnostics.push(socket.url()));
    await use();
    const paths = await allowed;
    for (const request of requests) {
      const url = new URL(request.url());
      expect(url.origin).toBe(new URL(baseURL!).origin);
      expect(url.search).toBe("");
      expect(paths.has(url.pathname), url.pathname).toBe(true);
      expect(request.method()).toBe("GET");
      expect(request.postData()).toBeNull();
      expect(JSON.stringify([request.url(), request.headers()])).not.toContain(marker);
    }
    expect(diagnostics).toEqual([]);
  }, { auto: true }],
});

const m = hreflangMessages.en;

for (const locale of ["en", "ja", "zh-CN", "zh-TW", "ko"] as const) {
  test(`hreflang pair labels, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const messages = hreflangMessages[locale];
    await page.goto(`./${locale}/tools/hreflang/`);
    await expect(page.locator("h1")).toHaveText(messages["tool.hreflang.name"]);
    await expect(page.locator("#page-guide")).toContainText(messages["hreflang.scope"]);
    await expect(page.getByTestId("hreflang-incomplete")).toHaveText(messages["hreflang.incomplete"]);
    const sample = page.getByTestId("hreflang-sample");
    await sample.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("hreflang-summary")).toHaveText(messages["hreflang.matched"]);
    await expect(page.getByTestId("hreflang-unchecked")).toHaveText(messages["hreflang.unchecked"]);
    await expect(page.getByTestId("hreflang-row")).toHaveCount(8);
    const first = page.getByRole("group", { name: messages["hreflang.page.a"], exact: true });
    await expect(first.getByLabel(messages["hreflang.field.url"], { exact: true })).toHaveValue(HREFLANG_SAMPLE.a.url);
    await expect(first.getByLabel(messages["hreflang.field.head"], { exact: true })).toHaveValue(HREFLANG_SAMPLE.a.head);
    await expect(page.locator("#hreflang-b-head")).toHaveValue(HREFLANG_SAMPLE.b.head);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId("theme-" + theme).click();
      await page.getByTestId("settings-close").click();
      if (theme === "dark") await expect(page.locator("html")).toHaveClass(/\bdark\b/);
      else await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark")) {
        await page.evaluate(() => document.fonts.ready);
        const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1"
          && testInfo.project.name.startsWith("chromium-");
        const size = testInfo.project.name.endsWith("small") ? "small" : "desktop";
        const path = capture ? `docs/screenshots/hreflang-${locale}-${theme}-${size}.png` : undefined;
        await testInfo.attach(`hreflang-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
      }
    }
    const clear = page.getByTestId("hreflang-clear");
    await clear.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("hreflang-result")).toHaveCount(0);
    await expect(page.locator("#hreflang-b-head")).toHaveValue("");
  });
}

test("pasted HTML stays inert on both parsing paths and clears on reload or navigation", async ({ context, page }) => {
  // Prevent any accidental network traffic from reaching the example host,
  // while keeping observable Playwright requests and CSP violation events.
  await context.route(url => url.hostname.endsWith(".example.test") || url.pathname.includes(marker), route => route.abort());
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.defineProperty(window, "hreflangCspViolations", { value: violations });
    document.addEventListener("securitypolicyviolation", event => violations.push(event.blockedURI));
  });
  await page.goto("./en/tools/hreflang/");
  const head = page.locator("#hreflang-a-head");
  const result = page.getByTestId("hreflang-result");
  const prefix = `/army-knife/${marker}`;
  const external = `https://assets.example.test/${marker}`;
  const inert = [
    "<!doctype html><html><head>",
    HREFLANG_SAMPLE.b.head,
    `<link rel="alternate" hreflang="fr" href="${external}/fr">`,
    `<script src="${prefix}/script.js"></script>`,
    `<link rel="stylesheet" href="${prefix}/theme.css">`,
    `<style>@import url("${external}/import.css"); body { background-image: url("${prefix}/background.png"); }</style>`,
    "</head><body>",
    `<img src="${prefix}/pixel.png" srcset="${external}/retina.png 2x">`,
    `<iframe src="${external}/iframe"></iframe>`,
    "</body></html>",
  ].join("\n");
  await page.getByTestId("hreflang-sample").click();
  await head.fill(inert);
  await expect(result).toContainText(external + "/fr");
  await expect(result.locator("img, iframe, script, style, link, a")).toHaveCount(0);
  await head.fill("<!--" + "a".repeat(4200) + "-->\n" + inert);
  await page.getByTestId("apply-now").click();
  await expect(result).toContainText(external + "/fr");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "applied");
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => Reflect.get(window, "hreflangCspViolations"))).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify([location.href, localStorage, sessionStorage, document.cookie]))).not.toContain(marker);
  await page.reload();
  await expect(head).toHaveValue("");
  await expect(result).toHaveCount(0);
  await page.getByTestId("hreflang-sample").click();
  await page.locator(".back-link").click();
  await page.getByTestId("tool-card-hreflang").click();
  await expect(result).toHaveCount(0);
  await expect(head).toHaveValue("");
});

test("deferred inspection cancels and manually applies the latest input", async ({ page }) => {
  await page.goto("./en/tools/hreflang/");
  await page.clock.install({ time: new Date("2026-11-26T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-26T00:01:00Z"));
  await page.getByTestId("hreflang-sample").click();
  const head = page.locator("#hreflang-b-head");
  const result = page.getByTestId("hreflang-result");
  const status = page.getByTestId("apply-control");
  const padding = "<!--" + "a".repeat(4200) + "-->\n";
  await head.fill(padding + HREFLANG_SAMPLE.b.head);
  await expect(status).toHaveAttribute("data-status", "pending");
  await expect(page.getByTestId("apply-now")).toContainText("0.8s");
  await page.clock.fastForward(799);
  await expect(result).toHaveCount(0);
  await page.getByTestId("hreflang-cancel").click();
  await page.clock.fastForward(800);
  await expect(status).toHaveAttribute("data-status", "cancelled");
  await expect(result).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").uncheck();
  await head.fill(padding + HREFLANG_SAMPLE.b.head.replace('hreflang="ja"', 'hreflang="ja-JP"'));
  await expect(status).toHaveAttribute("data-status", "manual");
  await page.getByTestId("apply-now").click();
  await expect(page.getByTestId("hreflang-summary")).toHaveText(m["hreflang.issues"]);
  await expect(page.getByTestId("hreflang-page-b")).toContainText(m["hreflang.mismatch"]);
  await head.fill(HREFLANG_SAMPLE.b.head);
  await expect(page.getByTestId("hreflang-summary")).toHaveText(m["hreflang.matched"]);
});
