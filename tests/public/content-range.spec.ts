import { expect, test } from "@playwright/test";
import { contentRangeMessages } from "../../src/i18n/content-range";

const PRIVATE = "PRIVATE_CONTENT_RANGE_PUBLIC_4196";
const PRIVATE_NUMBER = "3141592653589793238462643383279502884196";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published Content-Range operation in " + locale, async ({ page, context }, testInfo) => {
    const errors: string[] = [], requests: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    context.on("request", request => requests.push(JSON.stringify({ url: request.url(), headers: request.headers(), body: request.postData() })));
    const response = await page.goto("./" + locale + "/tools/content-range/"); expect(response?.status()).toBe(200);
    const m = contentRangeMessages[locale], result = page.getByTestId("content-range-result"), input = page.locator("#content-range-input");
    await expect(page.locator("h1")).toHaveText(m["tool.content-range.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["contentRange.scope"]);
    await page.getByTestId("content-range-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("content-range-first")).toHaveText("9007199254740993");
    await expect(page.getByTestId("content-range-range-bytes")).toHaveText("1000");
    await expect(page.getByTestId("content-range-after")).toHaveText("1000");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-content-range-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await input.fill("bytes 0-0/*");
    await expect(page.getByTestId("content-range-total")).toHaveText(m["contentRange.unknown"]);
    await expect(page.getByTestId("content-range-whole")).toHaveText(m["contentRange.unknown"]);
    await input.fill("bytes */0");
    await expect(page.getByTestId("content-range-total")).toHaveText("0");
    await expect(page.getByTestId("content-range-range-bytes")).toHaveText(m["contentRange.notApplicable"]);
    await input.fill("bytes 0-0/1");
    await expect(page.getByTestId("content-range-whole")).toHaveText(m["contentRange.yes"]);
    await input.fill("bytes 1-0/2"); await expect(result).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveText(m["errors.CONTENT_RANGE_BOUNDS"]);
    await input.fill("bytes " + PRIVATE_NUMBER + "-" + PRIVATE_NUMBER + "/*");
    await expect(page.getByTestId("content-range-range-bytes")).toHaveText("1");
    const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
    expect(JSON.stringify(await state())).not.toContain(PRIVATE_NUMBER);
    await input.fill("<script>" + PRIVATE + "</script>"); await expect(result).toHaveCount(0);
    await expect(page.locator("#main-content script, #main-content img")).toHaveCount(0);
    expect(JSON.stringify(await state())).not.toContain(PRIVATE);
    await page.getByTestId("content-range-clear").click(); await page.reload(); await expect(input).toHaveValue("");
    expect(requests.join("\n")).not.toContain(PRIVATE); expect(requests.join("\n")).not.toContain(PRIVATE_NUMBER);
    expect(errors).toEqual([]);
  });
}
