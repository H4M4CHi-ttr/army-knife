import { expect, test } from "@playwright/test";
import { pgLsnMessages } from "../../src/i18n/pg-lsn";

const PRIVATE = "PRIVATE_PG_LSN_PUBLIC_7812";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published PostgreSQL WAL LSN operation in " + locale, async ({ page, context }, testInfo) => {
    const errors: string[] = [], requests: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    context.on("request", request => requests.push(JSON.stringify({ url: request.url(), headers: request.headers(), body: request.postData() })));
    const response = await page.goto("./" + locale + "/tools/pg-lsn/"); expect(response?.status()).toBe(200);
    const m = pgLsnMessages[locale], result = page.getByTestId("pg-lsn-result");
    await expect(page.locator("h1")).toHaveText(m["tool.pg-lsn.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["lsn.scope"]);
    await page.getByTestId("pg-lsn-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("pg-lsn-delta")).toHaveText("33554432");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-pg-lsn-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await page.locator("#pg-lsn-first").fill("200000/1"); await page.locator("#pg-lsn-second").fill("200000/2");
    await expect(page.getByTestId("pg-lsn-delta")).toHaveText("1"); await expect(result).toContainText("9007199254740993");
    await page.locator("#pg-lsn-segment").selectOption("1"); await expect(result).toContainText("8589934592");
    await page.locator("#pg-lsn-first").fill("0/0"); await expect(page.getByTestId("pg-lsn-zero")).toHaveText(m["lsn.zero"]);
    await page.locator("#pg-lsn-first").fill(PRIVATE);
    await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toHaveText(m["errors.PG_LSN_SYNTAX"]);
    expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href })))).not.toContain(PRIVATE);
    await page.getByTestId("pg-lsn-clear").click(); await page.reload(); await expect(page.locator("#pg-lsn-first")).toHaveValue("");
    expect(requests.join("\n")).not.toContain(PRIVATE); expect(errors).toEqual([]);
  });
}
