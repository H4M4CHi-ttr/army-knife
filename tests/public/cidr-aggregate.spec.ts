import { expect, test } from "@playwright/test";
import { cidrAggregateMessages } from "../../src/i18n/cidr-aggregate";
import { parsePublicAssets } from "../../scripts/public-assets";
const PRIVATE = "PRIVATE_CIDR_AGGREGATE_PUBLIC_177";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published exact CIDR aggregation in " + locale, async ({ page, context, request, baseURL }, testInfo) => {
    const manifest = await request.get(new URL("public-assets.json", baseURL!).href, { maxRedirects: 0 }); expect(manifest.status()).toBe(200);
    const allowed = parsePublicAssets(await manifest.text(), process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA);
    const errors: string[] = [], requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [], sockets: string[] = [];
    page.on("pageerror", error => errors.push(error.message)); page.on("console", m => { if (m.type() === "error" || m.text().includes(PRIVATE)) errors.push(m.text()); });
    page.on("websocket", socket => sockets.push(socket.url())); context.on("request", r => requests.push({ url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() }));
    const response = await page.goto("./" + locale + "/tools/cidr-aggregate/"); expect(response?.status()).toBe(200);
    const m = cidrAggregateMessages[locale], result = page.getByTestId("cidr-aggregate-result"), input = page.locator("#cidr-aggregate-input");
    await expect(page.locator("h1")).toHaveText(m["tool.cidr-aggregate.name"]); await expect(page.locator("#page-guide")).toContainText(m["cidrAgg.scope"]);
    await page.getByTestId("cidr-aggregate-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("cidr-aggregate-prefixes")).toHaveText("192.0.2.0/24\n198.51.100.0/24\n"); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("512");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click(); await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-cidr-aggregate-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await page.getByTestId("cidr-aggregate-prefixes").focus(); await page.keyboard.press("ArrowDown"); await page.getByTestId("cidr-aggregate-ipv6-sample").click();
    await expect(page.getByTestId("cidr-aggregate-prefixes")).toHaveText("2001:db8::/64\n"); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("18446744073709551616");
    await input.fill('["::/0"]'); await expect(page.getByTestId("cidr-aggregate-total")).toHaveText("340282366920938463463374607431768211456");
    await input.fill('["192.0.2.0/24", "192.0.2.1/24"]'); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText(m["errors.CIDR_AGGREGATE_HOST_BITS"]); await expect(page.getByTestId("cidr-aggregate-error-position")).toContainText("2");
    await input.fill('["::/0", "0.0.0.0/0"]'); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toContainText(m["errors.CIDR_AGGREGATE_MIXED"]);
    await input.fill(JSON.stringify(['<img src="https://example.invalid/' + PRIVATE + '">'])); await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await expect(page.locator("#main-content script, #main-content img")).toHaveCount(0); expect(await page.getByRole("alert").textContent()).not.toContain(PRIVATE);
    expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie })))).not.toContain(PRIVATE); expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
    await page.getByTestId("cidr-aggregate-clear").click(); await page.reload(); await expect(input).toHaveValue("");
    for (const request of requests) { const url = new URL(request.url); expect(url.origin).toBe(new URL(baseURL!).origin); expect(allowed.has(url.pathname)).toBe(true); expect(url.search).toBe(""); expect(request.method).toBe("GET"); expect(request.body).toBeNull(); }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE); expect(errors).toEqual([]); expect(sockets).toEqual([]);
  });
}
