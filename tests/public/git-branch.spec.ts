import { expect, test } from "@playwright/test";
import { gitBranchMessages } from "../../src/i18n/git-branch";
import { parsePublicAssets } from "../../scripts/public-assets";

const PRIVATE = "PRIVATE_GIT_BRANCH_PUBLIC_176";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published literal Git branch operation in " + locale, async ({ page, context, request, baseURL }, testInfo) => {
    const manifest = await request.get(new URL("public-assets.json", baseURL!).href, { maxRedirects: 0 });
    expect(manifest.status()).toBe(200);
    const allowed = parsePublicAssets(await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA);
    const errors: string[] = [], requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [], sockets: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", m => { if (m.type() === "error" || m.text().includes(PRIVATE)) errors.push(m.text()); });
    page.on("websocket", socket => sockets.push(socket.url()));
    context.on("request", r => requests.push({ url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() }));
    const response = await page.goto("./" + locale + "/tools/git-branch/"); expect(response?.status()).toBe(200);
    const m = gitBranchMessages[locale], result = page.getByTestId("git-branch-result"), input = page.locator("#git-branch-input");
    await expect(page.locator("h1")).toHaveText(m["tool.git-branch.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["gitBranch.scope"]);
    await page.getByTestId("git-branch-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("git-branch-valid-count")).toHaveText("4");
    await expect(page.getByTestId("git-branch-invalid-count")).toHaveText("3");
    await expect(page.getByTestId("git-branch-row")).toHaveCount(7);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-git-branch-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await result.getByRole("region").focus(); await page.keyboard.press("ArrowRight");
    await input.fill('["@", "HEAD", "a./b", "-x", "refs/heads/main"]');
    await expect(page.getByTestId("git-branch-valid-count")).toHaveText("3");
    await expect(page.getByTestId("git-branch-row").nth(1)).toContainText(m["gitBranch.issue.reservedHead"]);
    await expect(result).toContainText("refs/heads/refs/heads/main");
    await input.fill('[1]'); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toHaveText(m["errors.GIT_BRANCH_SHAPE"]);
    await input.fill(JSON.stringify([PRIVATE, '<img src="https://example.invalid/' + PRIVATE + '">\u202e']));
    await expect(page.getByTestId("git-branch-count")).toHaveText("2");
    await expect(result).toContainText("\\u202e");
    await expect(page.locator("#main-content script, #main-content img")).toHaveCount(0);
    expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie })))).not.toContain(PRIVATE);
    expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
    await page.getByTestId("git-branch-clear").click(); await page.reload(); await expect(input).toHaveValue("");
    for (const request of requests) {
      const url = new URL(request.url); expect(url.origin).toBe(new URL(baseURL!).origin);
      expect(allowed.has(url.pathname)).toBe(true); expect(url.search).toBe("");
      expect(request.method).toBe("GET"); expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE); expect(errors).toEqual([]); expect(sockets).toEqual([]);
  });
}
