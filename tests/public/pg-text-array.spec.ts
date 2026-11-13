import { expect, test } from "@playwright/test";
import { pgTextArrayMessages } from "../../src/i18n/pg-text-array";

const PRIVATE = "PRIVATE_PG_ARRAY_PUBLIC_7301";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published PostgreSQL text[] operation in " + locale, async ({ page, context }, testInfo) => {
    const errors: string[] = [], requests: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    context.on("request", request => requests.push(JSON.stringify({ url: request.url(), headers: request.headers(), body: request.postData() })));
    const response = await page.goto("./" + locale + "/tools/pg-text-array/"); expect(response?.status()).toBe(200);
    const m = pgTextArrayMessages[locale], input = page.locator("#pg-array-input"), result = page.getByTestId("pg-array-result");
    await expect(page.locator("h1")).toHaveText(m["tool.pg-text-array.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["pgArray.scope"]);
    await page.getByTestId("pg-array-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("pg-array-count")).toHaveText("7");
    await expect(page.getByTestId("pg-array-nulls")).toHaveText("1"); await expect(page.getByTestId("pg-array-empty")).toHaveText("1");
    expect(JSON.parse((await page.getByTestId("pg-array-json").locator("pre").textContent())!)).toEqual(["a,b", null, "NULL", "", 'a"b', "c\\d", "日本語"]);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-pg-array-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await page.locator("#pg-array-mode").selectOption("encode"); await expect(input).toHaveValue("");
    await input.fill('["9007199254740993",null,"NULL",""]');
    expect(await page.getByTestId("pg-array-array").locator("pre").textContent()).toBe('{"9007199254740993",NULL,"NULL",""}');
    await input.fill("[]"); await expect(page.getByTestId("pg-array-zero-dim")).toBeVisible();
    await input.fill("[1]"); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toHaveText(m["errors.PG_ARRAY_JSON_SHAPE"]);
    await input.fill('["<script>' + PRIVATE + '</script>"]');
    await expect(result).toBeVisible(); await expect(page.locator("#main-content script, #main-content img")).toHaveCount(0);
    const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
    expect(JSON.stringify(await state())).not.toContain(PRIVATE);
    await page.locator("#pg-array-mode").selectOption("decode");
    const raw = '{"' + PRIVATE + '\r\nvalue"}';
    await page.locator('input[type="file"]').setInputFiles({ name: "synthetic-public-cr.txt", mimeType: "text/plain", buffer: Buffer.from(raw) });
    await expect(page.getByTestId("pg-array-json").locator("pre")).toHaveText(JSON.stringify([PRIVATE + "\r\nvalue"], null, 2));
    await input.focus(); await page.keyboard.press("ControlOrMeta+End"); await page.keyboard.type(" ");
    await expect(page.getByTestId("pg-array-json").locator("pre")).toHaveText(JSON.stringify([PRIVATE + "\r\nvalue"], null, 2));
    expect(await input.evaluate((element: HTMLTextAreaElement) => element.readOnly)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    expect(JSON.stringify(await state())).not.toContain(PRIVATE);
    await page.getByTestId("pg-array-clear").click(); await page.reload(); await expect(input).toHaveValue("");
    expect(requests.join("\n")).not.toContain(PRIVATE); expect(errors).toEqual([]);
  });
}
