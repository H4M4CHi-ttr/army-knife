import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test("Git blob route hashes binary content and removes stale IDs after an oversized replacement", async ({ page }) => {
  const binary = Buffer.from([0xef, 0xbb, 0xbf, 97, 13, 10, 0, 255]);
  const expected = execFileSync("git", ["hash-object", "--stdin", "--no-filters"], { input: binary, encoding: "utf8" }).trim();
  await page.goto("./en/tools/git-blob/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Git blob ID calculator");
  const file = page.locator("#git-blob-file");
  const sha1 = page.getByTestId("git-blob-sha1");
  const open = page.locator("#git-blob-input");
  await open.focus();
  const chooser = page.waitForEvent("filechooser");
  await open.press("Enter");
  await (await chooser).setFiles({ name: "fixture.bin", mimeType: "application/octet-stream", buffer: binary });
  await expect(sha1).toHaveText(expected);
  await expect(page.getByTestId("git-blob-sha256")).toHaveText(/^[0-9a-f]{64}$/);

  await file.setInputFiles({ name: "too-large.bin", mimeType: "application/octet-stream", buffer: Buffer.alloc(8 * 1024 * 1024 + 1) });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(sha1).toHaveCount(0);

  await file.setInputFiles({ name: "empty.bin", mimeType: "application/octet-stream", buffer: Buffer.alloc(0) });
  await expect(sha1).toHaveText("e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
});

test("large local files support manual apply, and reload clears the result", async ({ page }, testInfo) => {
  const buffer = Buffer.alloc(128 * 1024 + 1, 0xab);
  const expected = execFileSync("git", ["hash-object", "--stdin"], { input: buffer, encoding: "utf8" }).trim();
  const requests: { url: string; method: string; body: string | null }[] = [];
  page.context().on("request", (request) => requests.push({
    url: request.url(), method: request.method(), body: request.postData(),
  }));
  await page.clock.install({ time: new Date("2026-11-24T00:00:00Z") });
  await page.goto("./ja/tools/git-blob/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Git blob ID計算");
  await page.clock.pauseAt(new Date("2026-11-24T01:00:00Z"));
  const file = page.locator("#git-blob-file");
  await file.setInputFiles({ name: "git-blob-private-fixture.bin", mimeType: "application/octet-stream", buffer });
  const auto = page.getByTestId("auto-apply-toggle");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await auto.uncheck();
  const apply = page.getByTestId("apply-now");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await expect(apply).toBeEnabled();
  await expect(page.getByTestId("git-blob-sha1")).toHaveCount(0);
  await apply.focus();
  await apply.press("Enter");
  await expect(page.getByTestId("git-blob-sha1")).toHaveText(expected);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await testInfo.attach("git-blob-ja", { body: await page.screenshot(), contentType: "image/png" });

  await page.clock.resume();
  await page.reload();
  await expect(page.getByTestId("git-blob-sha1")).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]));
  expect(stored).not.toContain("git-blob-private-fixture");
  expect(stored).not.toContain(expected);
  for (const request of requests) {
    expect(new URL(request.url).origin).toBe(new URL(page.url()).origin);
    expect(request.method).toBe("GET");
    expect(request.body).toBeNull();
    expect(request.url).not.toContain("git-blob-private-fixture");
    expect(request.url).not.toContain(expected);
  }
});
