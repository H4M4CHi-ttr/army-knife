import { expect, test, type Request } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { hreflangMessages } from "../../src/i18n/hreflang";

test("published hreflang inspection works on the verified Pages revision", async ({ page, request, baseURL }) => {
  const base = new URL(baseURL!);
  const manifest = await request.get(new URL("public-assets.json", base).href, { maxRedirects: 0 });
  expect(manifest.status()).toBe(200);
  const allowed = parsePublicAssets(
    await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA,
  );
  const requests: Request[] = [];
  const errors: string[] = [];
  page.on("request", entry => requests.push(entry));
  page.on("pageerror", error => errors.push(error.message));

  const response = await page.goto("./ja/tools/hreflang/");
  const m = hreflangMessages.ja;
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText(m["tool.hreflang.name"]);
  await expect(page.locator("#page-guide")).toContainText(m["hreflang.scope"]);
  await page.getByTestId("hreflang-sample").click();
  await expect(page.getByTestId("hreflang-summary")).toHaveText(m["hreflang.matched"]);
  await expect(page.getByTestId("hreflang-unchecked")).toHaveText(m["hreflang.unchecked"]);
  await expect(page.getByTestId("hreflang-row")).toHaveCount(8);
  await page.locator("#hreflang-a-url").fill("https://example.test/ja");
  await expect(page.getByTestId("hreflang-summary")).toHaveText(m["hreflang.issues"]);
  await page.reload();
  await expect(page.locator("#hreflang-a-url")).toHaveValue("");
  await expect(page.getByTestId("hreflang-result")).toHaveCount(0);
  for (const entry of requests) {
    const url = new URL(entry.url());
    expect(url.origin).toBe(base.origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname), url.pathname).toBe(true);
    expect(entry.method()).toBe("GET");
    expect(entry.postData()).toBeNull();
  }
  expect(errors).toEqual([]);
});
