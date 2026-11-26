import { expect, test } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";

test("published CSV/TSV key comparison works on the verified Pages revision", async ({ page, request, baseURL }) => {
  const manifest = await request.get(new URL("public-assets.json", baseURL!).href, { maxRedirects: 0 });
  expect(manifest.status()).toBe(200);
  const allowed = parsePublicAssets(await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", request => requests.push(request.url()));
  page.on("pageerror", error => errors.push(error.message));

  const response = await page.goto("./ja/tools/csv-key-diff/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("CSV・TSV キー差分");
  await page.getByTestId("csv-key-diff-sample").focus();
  await page.keyboard.press("Enter");
  const rows = page.getByTestId("csv-key-diff-row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toHaveAttribute("data-change", "updated");
  await expect(rows.nth(0)).toContainText("001");
  await expect(rows.nth(1)).toHaveAttribute("data-change", "removed");
  await expect(rows.nth(1)).toContainText("002");
  await expect(rows.nth(2)).toHaveAttribute("data-change", "added");
  await expect(rows.nth(2)).toContainText("003");
  await page.reload();
  await expect(page.locator("#csv-key-diff-before")).toHaveValue("");
  await expect(page.locator("#csv-key-diff-after")).toHaveValue("");
  await expect(rows).toHaveCount(0);

  for (const request of requests) {
    const url = new URL(request);
    expect(url.origin).toBe(new URL(baseURL!).origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname)).toBe(true);
  }
  expect(errors).toEqual([]);
});
