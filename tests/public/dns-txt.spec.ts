import { expect, test } from "@playwright/test";
import { dnsTxtMessages } from "../../src/i18n/dns-txt";
import { DNS_TXT_SAMPLE_RDATA, DNS_TXT_SAMPLE_TEXT } from "../../src/lib/tools/dns-txt-sample";

const PRIVATE = "PRIVATE_DNS_TXT_PUBLIC_5821";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published DNS TXT operation in " + locale, async ({ page, context }, testInfo) => {
    const errors: string[] = [], requests: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    context.on("request", request => requests.push(JSON.stringify({ url: request.url(), headers: request.headers(), body: request.postData() })));
    const response = await page.goto("./" + locale + "/tools/dns-txt/"); expect(response?.status()).toBe(200);
    const m = dnsTxtMessages[locale], result = page.getByTestId("dns-txt-result"), input = page.locator("#dns-txt-input");
    await expect(page.locator("h1")).toHaveText(m["tool.dns-txt.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["dnsTxt.scope"]);
    await page.getByTestId("dns-txt-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("dns-txt-data-bytes")).toHaveText("257");
    await expect(page.getByTestId("dns-txt-wire-bytes")).toHaveText("259");
    expect(await page.getByTestId("dns-txt-rdata").locator("pre").textContent()).toBe(DNS_TXT_SAMPLE_RDATA);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-dns-txt-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await page.locator("#dns-txt-mode").selectOption("restore"); await expect(result).toHaveCount(0); await expect(input).toHaveValue("");
    await page.getByTestId("dns-txt-sample").click();
    expect(await page.getByTestId("dns-txt-text").locator("pre").textContent()).toBe(DNS_TXT_SAMPLE_TEXT);
    await input.fill('""'); await expect(page.getByTestId("dns-txt-data-bytes")).toHaveText("0");
    await input.fill('"\\255"'); await expect(result).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveText(m["errors.DNS_TXT_UTF8"]);
    await page.locator("#dns-txt-mode").selectOption("split");
    await input.evaluate(element => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [new File(["\ufeffa"], "synthetic.txt")], getData: () => "" } });
      element.dispatchEvent(event);
    });
    await expect(page.getByTestId("dns-txt-data-bytes")).toHaveText("4");
    expect(await page.getByTestId("dns-txt-text").locator("pre").textContent()).toBe("\ufeffa");
    await input.fill("<script>" + PRIVATE + "</script>");
    await expect(result).toBeVisible(); await expect(result.locator("script, img, a")).toHaveCount(0);
    expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href })))).not.toContain(PRIVATE);
    await page.getByTestId("dns-txt-clear").click(); await page.reload(); await expect(input).toHaveValue("");
    expect(requests.join("\n")).not.toContain(PRIVATE); expect(errors).toEqual([]);
  });
}
