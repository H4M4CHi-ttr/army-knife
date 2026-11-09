import { expect, test } from "@playwright/test";
import { forwardedMessages } from "../../src/i18n/forwarded";

const PRIVATE = "PRIVATE_FORWARDED_PUBLIC_2719";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published Forwarded operation in " + locale, async ({ page, context }, testInfo) => {
    const errors: string[] = [], requests: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    context.on("request", request => requests.push(JSON.stringify({ url: request.url(), headers: request.headers(), body: request.postData() })));
    const response = await page.goto("./" + locale + "/tools/forwarded/");
    expect(response?.status()).toBe(200);
    const m = forwardedMessages[locale], result = page.getByTestId("forwarded-result");
    await expect(page.locator("h1")).toHaveText(m["tool.forwarded.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["forwarded.scope"]);
    await page.getByTestId("forwarded-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("forwarded-element")).toHaveCount(2);
    await expect(result).toContainText("[2001:db8::1]:4711");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-forwarded-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await page.locator("#forwarded-input").fill('for="not an IP";x="<script>' + PRIVATE + "</script>\"");
    await expect(result).toContainText(PRIVATE); await expect(result.locator("script, img, a")).toHaveCount(0);
    expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href })))).not.toContain(PRIVATE);
    await page.locator("#forwarded-input").fill("for=a;FOR=b");
    await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toHaveText(m["errors.FORWARDED_DUPLICATE"]);
    await page.getByTestId("forwarded-clear").click(); await page.reload(); await expect(page.locator("#forwarded-input")).toHaveValue("");
    expect(requests.join("\n")).not.toContain(PRIVATE); expect(errors).toEqual([]);
  });
}
