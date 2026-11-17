import { expect, test } from "@playwright/test";
import { websocketAcceptMessages } from "../../src/i18n/websocket-accept";

const PRIVATE = "PRIVATE_WS_PUBLIC_61824", PRIVATE_KEY = "UFJJVkFURV9XU182MTgyNA==";
const PRIVATE_ACCEPT = "chwgrXaFpYC+Ak+MbRS/bV+dryo=";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published WebSocket Accept operation in " + locale, async ({ page, context }, testInfo) => {
    const errors: string[] = [], requests: string[] = [], sockets: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("websocket", socket => sockets.push(socket.url()));
    context.on("request", request => requests.push(JSON.stringify({ url: request.url(), headers: request.headers(), body: request.postData() })));
    const response = await page.goto("./" + locale + "/tools/websocket-accept/"); expect(response?.status()).toBe(200);
    const m = websocketAcceptMessages[locale], result = page.getByTestId("websocket-accept-result");
    const key = page.locator("#websocket-accept-input"), accept = page.locator("#websocket-accept-response");
    await expect(page.locator("h1")).toHaveText(m["tool.websocket-accept.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["wsAccept.scope"]);
    await page.getByTestId("websocket-accept-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("websocket-accept-expected")).toHaveText("s3pPLMBiTxaQ9kYGzzhZRbK+xOo=");
    await expect(page.getByTestId("websocket-accept-status")).toHaveText(m["wsAccept.match"]);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-websocket-accept-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await accept.fill("AAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    await expect(page.getByTestId("websocket-accept-status")).toHaveText(m["wsAccept.mismatch"]);
    await accept.fill(""); await expect(page.getByTestId("websocket-accept-status")).toHaveText(m["wsAccept.notCompared"]);
    await accept.fill(" "); await expect(result).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveText(m["errors.WS_ACCEPT_RESPONSE"]);
    await key.fill(PRIVATE_KEY); await accept.fill(PRIVATE_ACCEPT);
    await expect(page.getByTestId("websocket-accept-status")).toHaveText(m["wsAccept.match"]);
    const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
    for (const marker of [PRIVATE_KEY, PRIVATE_ACCEPT]) expect(JSON.stringify(await state())).not.toContain(marker);
    await accept.fill("<script>" + PRIVATE + "</script>"); await expect(result).toHaveCount(0);
    await expect(page.locator("#main-content script, #main-content img")).toHaveCount(0);
    expect(JSON.stringify(await state())).not.toContain(PRIVATE);
    await page.getByTestId("websocket-accept-clear").click(); await page.reload(); await expect(key).toHaveValue("");
    for (const marker of [PRIVATE, PRIVATE_KEY, PRIVATE_ACCEPT]) expect(requests.join("\n")).not.toContain(marker);
    expect(errors).toEqual([]); expect(sockets).toEqual([]);
  });
}
