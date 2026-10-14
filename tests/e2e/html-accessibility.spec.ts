import { expect, test } from "@playwright/test";
import { htmlAccessibilityMessages } from "../../src/i18n/html-accessibility";

const INPUT = "#html-accessibility-input";
const PRIVATE_MARKER = "PRIVATE_HTML_A11Y_7261";

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`checker rule messages are localized in ${locale}`, async ({ page }) => {
    await page.goto(`./${locale}/tools/html-accessibility/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await page.locator(INPUT).fill("<button></button>");
    const expected = htmlAccessibilityMessages[locale]["htmlA11y.rule.missing-interactive-name"];
    await expect(page.getByTestId("html-accessibility-output")).toContainText(expected);
    await expect(page.getByRole("heading", { name: htmlAccessibilityMessages[locale]["htmlA11y.byRule"] }))
      .toBeVisible();
    await expect(page.getByRole("columnheader", { name: htmlAccessibilityMessages[locale]["htmlA11y.example"] }))
      .toBeVisible();
    await expect(page.locator(".a11y-repair")).toContainText("<button>Save</button>");
    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
  });
}

test("HTML findings render locally without loading or executing pasted resources", async ({ page }, testInfo) => {
  const requests: { url: string; method: string; body: string | null }[] = [];
  page.on("request", (request) => requests.push({
    url: request.url(),
    method: request.method(),
    body: request.postData(),
  }));
  await page.goto("./en/tools/html-accessibility/");
  const editor = page.getByRole("textbox", { name: "Input" });
  await expect(editor).toBeVisible();
  await editor.fill(`<!doctype html><html><body>
    <h1>Profile</h1><h3>Contact</h3>
    <img src="https://example.invalid/${PRIVATE_MARKER}.png" onerror="globalThis.__htmlA11yRan = true">
    <link rel="stylesheet" href="https://example.invalid/${PRIVATE_MARKER}.css">
    <iframe src="https://example.invalid/${PRIVATE_MARKER}"></iframe><button></button>
    <script>globalThis.__htmlA11yRan = true</script>
  </body></html>`);
  const output = page.getByTestId("html-accessibility-output");
  await expect(output).toContainText("Add a non-empty lang attribute");
  await expect(output).toContainText("Heading levels jump");
  await expect(output).toContainText("Add alt text");
  await expect(output).toContainText("Add a short, descriptive title");
  await expect(output).toContainText("Give this button or link");
  await page.waitForTimeout(250);

  const state = await page.evaluate(() => ({
    executed: Boolean((globalThis as typeof globalThis & { __htmlA11yRan?: boolean }).__htmlA11yRan),
    local: { ...localStorage },
    session: { ...sessionStorage },
    url: location.href,
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(state.executed).toBe(false);
  expect(JSON.stringify(state)).not.toContain(PRIVATE_MARKER);
  expect(state.content).toBeLessThanOrEqual(state.viewport + 1);
  expect(requests.every((request) => new URL(request.url).origin === "http://127.0.0.1:4173"))
    .toBe(true);
  expect(JSON.stringify(requests)).not.toContain(PRIVATE_MARKER);

  await page.getByTestId("html-accessibility-sample").click();
  await expect(output).toBeVisible();
  const screenshot = testInfo.outputPath("html-accessibility.png");
  await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
  await testInfo.attach("html-accessibility-checker", { path: screenshot, contentType: "image/png" });
});

test("large HTML scans are deferred and can be canceled between bounded batches", async ({ page }) => {
  await page.goto("./en/tools/html-accessibility/");
  await page.locator(INPUT).fill(" ".repeat(2_049));
  await page.getByTestId("auto-apply-toggle").uncheck();
  const source = "<img>".repeat(9_000);
  await page.locator(INPUT).fill(source);
  await expect(page.getByTestId("execution-status")).toHaveText("Ready to apply");
  await page.getByTestId("apply-now").click();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "running");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await expect(page.getByTestId("html-accessibility-result")).toHaveCount(0);
});
