import { expect, test } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { cacheAgeMessages } from "../../src/i18n/cache-age";

test("published Cache Age works on the verified Pages revision", async ({ page, request, baseURL }) => {
  const manifest = await request.get(new URL("public-assets.json", baseURL!).href, { maxRedirects: 0 });
  expect(manifest.status()).toBe(200);
  const allowed = parsePublicAssets(await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("./ja/tools/cache-age/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText(cacheAgeMessages.ja["tool.cache-age.name"]);
  await page.getByTestId("cache-age-sample").click();
  await expect(page.getByTestId("cache-age-current")).toHaveText("24.625 s");
  await page.reload();
  await expect(page.locator("#cache-age-evaluation")).toHaveValue("");
  await expect(page.getByTestId("cache-age-current")).toHaveCount(0);
  for (const request of requests) {
    const url = new URL(request);
    expect(url.origin).toBe(new URL(baseURL!).origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname)).toBe(true);
  }
  expect(errors).toEqual([]);
});
