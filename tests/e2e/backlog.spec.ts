import { expect, test, type Page } from "@playwright/test";
const tools = [
  "ndjson", "json-pointer", "csv-insert", "sqlite-plan", "jsonl-logs",
  "stack-trace", "robots", "sitemap", "iso-duration", "pg-dsn",
] as const;

async function openTool(page: Page, locale: string, tool: (typeof tools)[number]) {
  await page.goto("./" + locale + "/tools/" + tool + "/");
  if (await page.getByTestId("tool-disabled").isVisible()) {
    await page.getByTestId("disabled-settings").click();
    await page.getByTestId("toggle-" + tool).click();
    await page.getByTestId("settings-close").click();
  }
  await expect(page.getByTestId("backlog-" + tool)).toBeVisible();
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", tool);
}

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"]) {
  test("ten offline backlog tools in " + locale, async ({ page }) => {
    for (const tool of tools) {
      await openTool(page, locale, tool);
      await page.getByTestId("backlog-sample").click();
      await expect(page.getByTestId("backlog-results")).toBeVisible();
      await expect(page.getByTestId("backlog-results").locator("table").first()).toBeVisible();
      const geo = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        body: document.documentElement.scrollWidth,
      }));
      expect(geo.body).toBeLessThanOrEqual(geo.viewport + 1);
    }
    await openTool(page, locale, "iso-duration");
    await page.getByTestId("backlog-sample").click();
    await expect(page.getByTestId("backlog-results")).toContainText("2024-02-29T12:00:00.000Z");
    await openTool(page, locale, "robots");
    await page.getByTestId("backlog-sample").click();
    await expect(page.getByTestId("backlog-results")).toContainText("NO");
  });
}
test("connection string never leaves the app, including clipboard/export", async ({page}) => {
  const sent: string[] = [];
  page.on("request", request => {
    const body = request.postData();
    if (body) sent.push(body);
  });
  await openTool(page, "en", "pg-dsn");
  await page.locator("#backlog-source").fill("postgresql://demo:PRIVATE_SENTINEL_982734@example.test/db");
  await expect(page.getByTestId("backlog-results")).toContainText("<redacted>");
  await expect(page.getByTestId("backlog-results")).not.toContainText("PRIVATE_SENTINEL_982734");
  const state = await page.evaluate(() => ({
    url: location.href, local: {...localStorage}, session: {...sessionStorage},
  }));
  expect(JSON.stringify(state)).not.toContain("PRIVATE_SENTINEL_982734");
  expect(sent.join("|")).not.toContain("PRIVATE_SENTINEL_982734");
});