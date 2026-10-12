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

async function enableRadix(page: Page) {
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await page.getByTestId("disabled-settings").click();
  const toggle = page.getByTestId("toggle-radix");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("settings-close").click();
  await expect(page.locator("#quick-input")).toBeVisible();
}

for (const locale of LOCALES) {
  test("private quick converters, i18n and opt-in in " + locale, async ({ page }, testInfo) => {
    await page.goto("./" + locale + "/tools/radix/");
    await enableRadix(page);
    await page.locator("#quick-input").fill("9007199254740993");
    const radixRows = page.getByTestId("quick-output-row");
    await expect(radixRows).toHaveCount(5);
    const expected = [
      "100000000000000000000000000000000000000000000000000001",
      "400000000000000001",
      "9007199254740993",
      "20000000000001",
      "2GOSA7PA2GX",
    ];
    for (let index = 0; index < expected.length; index++)
      await expect(radixRows.nth(index).locator("td code")).toHaveText(expected[index]!);
    if (locale === "en" && testInfo.project.name === "chromium-desktop") {
      await testInfo.attach("radix-light-desktop", {
        body: await page.screenshot(), contentType: "image/png",
      });
      await page.getByTestId("settings-button").click();
      await page.getByTestId("theme-dark").click();
      await page.getByTestId("settings-close").click();
      await testInfo.attach("radix-dark-desktop", {
        body: await page.screenshot(), contentType: "image/png",
      });
    }
    await page.getByTestId("quick-radix-base").selectOption("16");
    await page.locator("#quick-input").fill("ff");
    await expect(radixRows.nth(2).locator("td code")).toHaveText("255");
    await page.locator("#quick-input").fill("G");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator(".result-panel")).toHaveCount(0);

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

test("invalid values and input privacy", async ({ page }) => {
  const requests: Array<{ url: string; method: string; body: string | null; headers: string }> = [];
  page.on("request", (request) => requests.push({
    url: request.url(), method: request.method(), body: request.postData(),
    headers: JSON.stringify(request.headers()),
  }));
  await page.goto("./en/tools/radix/");
  await enableRadix(page);
  const radixSecret = "1234567890123456789012345678901234567890";
  await page.locator("#quick-input").fill(radixSecret);
  await expect(page.getByTestId("quick-output-row")).toHaveCount(5);
  const radixState = await page.evaluate(() => ({
    preferences: localStorage.getItem("army-knife:preferences:v1"),
    session: Object.values(sessionStorage),
    location: window.location.href,
  }));
  expect(JSON.stringify(radixState)).not.toContain(radixSecret);

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
    const url = new URL(request.url);
    expect(url.search).toBe("");
    expect(request.url + (request.body ?? "")).not.toContain(secret);
    expect(request.url + (request.body ?? "")).not.toContain(radixSecret);
    expect(request.headers).not.toContain(secret);
    expect(request.headers).not.toContain(radixSecret);
    expect(request.method).toBe("GET");
    expect(url.origin).toBe("http://127.0.0.1:4173");
  }
});
