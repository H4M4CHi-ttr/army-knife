import { expect, test } from "@playwright/test";
import { redisSlotsMessages } from "../../src/i18n/redis-slots";
import { parsePublicAssets } from "../../scripts/public-assets";

const PRIVATE = "PRIVATE_REDIS_SLOTS_PUBLIC_175";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published Redis Cluster slot operation in " + locale, async ({ page, context, request, baseURL }, testInfo) => {
    const manifest = await request.get(new URL("public-assets.json", baseURL!).href, { maxRedirects: 0 });
    expect(manifest.status()).toBe(200);
    const allowed = parsePublicAssets(await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA);
    const errors: string[] = [], requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [], sockets: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("websocket", socket => sockets.push(socket.url()));
    context.on("request", r => requests.push({ url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() }));
    const response = await page.goto("./" + locale + "/tools/redis-slots/"); expect(response?.status()).toBe(200);
    const m = redisSlotsMessages[locale], result = page.getByTestId("redis-slots-result"), input = page.locator("#redis-slots-input");
    await expect(page.locator("h1")).toHaveText(m["tool.redis-slots.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["redis.scope"]);
    await page.getByTestId("redis-slots-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("redis-slots-slot").first()).toHaveText("3443");
    await expect(page.getByTestId("redis-slots-key")).toHaveCount(5);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-redis-slots-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await input.fill('["123456789"]'); await expect(page.getByTestId("redis-slots-slot")).toHaveText("12739");
    await input.fill('[""]'); await expect(page.getByTestId("redis-slots-slot")).toHaveText("0");
    await input.fill('["a{x}", "b{x}"]'); await expect(page.getByTestId("redis-slots-same")).toHaveText(m["redis.same"]);
    await input.fill('["foo", "bar"]'); await expect(page.getByTestId("redis-slots-same")).toHaveText(m["redis.different"]);
    await input.fill('[1]'); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toHaveText(m["errors.REDIS_SLOTS_SHAPE"]);
    await input.fill(JSON.stringify([PRIVATE, '<img src="https://example.invalid/' + PRIVATE + '">']));
    await expect(page.getByTestId("redis-slots-count")).toHaveText("2");
    await expect(page.locator("#main-content script, #main-content img")).toHaveCount(0);
    expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie, tracked: "dataLayer" in window })))).not.toContain(PRIVATE);
    expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
    await page.getByTestId("redis-slots-clear").click(); await page.reload(); await expect(input).toHaveValue("");
    for (const request of requests) {
      const url = new URL(request.url); expect(url.origin).toBe(new URL(baseURL!).origin);
      expect(allowed.has(url.pathname)).toBe(true); expect(url.search).toBe("");
      expect(request.method).toBe("GET"); expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE); expect(errors).toEqual([]); expect(sockets).toEqual([]);
  });
}
