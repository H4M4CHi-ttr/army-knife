import { expect, test } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";

test("published Git blob tool hashes an empty file on the verified Pages revision", async ({ page, request, baseURL }) => {
  const manifest = await request.get(new URL("public-assets.json", baseURL!).href, { maxRedirects: 0 });
  expect(manifest.status()).toBe(200);
  const allowed = parsePublicAssets(await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const response = await page.goto("./ja/tools/git-blob/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Git blob ID計算");
  await page.locator("#git-blob-file").setInputFiles({ name: "empty.bin", mimeType: "application/octet-stream", buffer: Buffer.alloc(0) });
  await expect(page.getByTestId("git-blob-sha1")).toHaveText("e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  await expect(page.getByTestId("git-blob-sha256")).toHaveText("473a0f4c3be8a93681a267e3b1e9a7dcda1185436fe141f7749120a303721813");
  for (const address of requests) {
    const url = new URL(address);
    expect(url.origin).toBe(new URL(baseURL!).origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname)).toBe(true);
  }
});
