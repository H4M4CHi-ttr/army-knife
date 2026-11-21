import { expect, test } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { cacheStatusMessages } from "../../src/i18n/cache-status";

test("published Cache-Status works on the verified Pages revision", async ({ page, request, baseURL }) => {
  const manifest = await request.get(new URL("public-assets.json", baseURL!).href, { maxRedirects: 0 });
  expect(manifest.status()).toBe(200);
  const allowed = parsePublicAssets(await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("./ja/tools/cache-status/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText(cacheStatusMessages.ja["tool.cache-status.name"]);
  await page.getByTestId("cache-status-sample").click();
  const rows = page.getByTestId("cache-status-row");
  await expect(rows.locator("h3")).toHaveText(["shield", "Edge cache"]);
  await expect(rows.nth(0)).toContainText("-12");
  await expect(rows.nth(1)).toContainText("304");
  await page.reload();
  await expect(page.locator("#cache-status-input")).toHaveValue("");
  for (const request of requests) {
    const url = new URL(request);
    expect(url.origin).toBe(new URL(baseURL!).origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname)).toBe(true);
  }
  expect(errors).toEqual([]);
});
