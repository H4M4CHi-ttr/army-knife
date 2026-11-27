import { expect, test } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";

test("published gitignore sample works on the verified Pages revision", async ({ page, request, baseURL }) => {
  const manifest = await request.get(new URL("public-assets.json", baseURL!).href, { maxRedirects: 0 });
  expect(manifest.status()).toBe(200);
  const allowed = parsePublicAssets(await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", request => requests.push(request.url()));
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("./ja/tools/gitignore/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText(".gitignore ルールテスター");
  await page.getByTestId("gitignore-sample").focus();
  await page.keyboard.press("Enter");
  const rows = page.getByTestId("gitignore-row");
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toHaveAttribute("data-status", "ignored");
  await expect(rows.nth(0)).toContainText("無視された親ディレクトリ");
  await expect(rows.nth(0)).toContainText("ルールの 2 行目");
  await expect(rows.nth(2)).toHaveAttribute("data-status", "included");
  await expect(rows.nth(2)).toContainText("!keep.log");
  await page.reload();
  await expect(page.locator("#gitignore-rules")).toHaveValue("");
  await expect(page.locator("#gitignore-paths")).toHaveValue("");
  await expect(rows).toHaveCount(0);

  for (const request of requests) {
    const url = new URL(request);
    expect(url.origin).toBe(new URL(baseURL!).origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname)).toBe(true);
  }
  expect(errors).toEqual([]);
});
