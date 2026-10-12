import { test, expect, type Page } from "@playwright/test";

const LOCALES = ["ja", "en", "zh-CN", "zh-TW", "ko"] as const;

async function enableUnicodeEscape(page: Page) {
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await page.getByTestId("disabled-settings").click();
  const toggle = page.getByTestId("toggle-unicode-escape");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("settings-close").click();
  await expect(page.locator("#quick-text")).toBeVisible();
}

for (const locale of LOCALES) {
  test("five private converters, i18n and opt-in in " + locale, async ({ page }) => {
    await page.goto("./" + locale + "/tools/data-units/");
    await page.getByTestId("quick-input").fill("1");
    await expect(page.getByTestId("quick-output")).toContainText("B = 1,048,576");
    await expect(page.getByTestId("quick-output")).toContainText("b = 8,388,608");
    await page.getByTestId("quick-rate").selectOption("true");
    await expect(page.getByTestId("quick-output")).toContainText("B/s = 1,048,576");

    await page.goto("./" + locale + "/tools/css-units/");
    await page.getByTestId("quick-input").fill("16");
    await expect(page.getByTestId("quick-output")).toContainText("rem = 1");
    await page.locator("#quick-css-root").fill("32");
    await expect(page.getByTestId("quick-output")).toContainText("rem = 0.5");

    await page.goto("./" + locale + "/tools/unicode-normalize/");
    await page.locator("#quick-text").fill("e\u0301①");
    await expect(page.getByTestId("quick-output")).toHaveText("é①");
    await page.getByTestId("quick-form").selectOption("NFKC");
    await expect(page.getByTestId("quick-output")).toHaveText("é1");
    await expect(page.getByTestId("quick-notice")).toBeVisible();

    await page.goto("./" + locale + "/tools/slug/");
    await page.locator("#quick-text").fill("Café Déjà Vu\nCafé Déjà Vu");
    await page.getByTestId("quick-slug-mode").selectOption("ascii");
    await expect(page.getByTestId("quick-output")).toHaveText("cafe-deja-vu\ncafe-deja-vu-2");

    await page.goto("./" + locale + "/tools/unicode-escape/");
    await enableUnicodeEscape(page);
    await page.locator("#quick-text").fill("A😀");
    await expect(page.getByTestId("quick-output")).toHaveText("U+0041 U+1F600");
    await page.getByTestId("quick-notation").selectOption("js-utf16");
    await expect(page.getByTestId("quick-output")).toHaveText("\\u0041\\uD83D\\uDE00");

    const width = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
  });
}

test("invalid values, copy, no secret persistence or network transmissions", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("./en/tools/data-units/");
  await page.getByTestId("quick-input").fill("1e100");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByTestId("quick-input").fill("0.125");
  await expect(page.getByTestId("quick-output")).toContainText("b = 1");

  await page.goto("./en/tools/slug/");
  const secret = "PRIVATE_INPUT_72613";
  await page.locator("#quick-text").fill(secret);
  await expect(page.getByTestId("quick-output")).toHaveText("private_input_72613".replaceAll("_", "-"));
  const values = await page.evaluate(() => ({
    preferences: localStorage.getItem("army-knife:preferences:v1"),
    session: Object.values(sessionStorage),
    location: window.location.href,
  }));
  expect(JSON.stringify(values)).not.toContain(secret);
  for (const request of requests) {
    const url = new URL(request);
    expect(url.search).toBe("");
    expect(request).not.toContain(secret);
    expect(url.origin).toBe("http://127.0.0.1:4173");
  }
});
