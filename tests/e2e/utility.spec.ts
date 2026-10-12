import { expect, test, type Page } from "@playwright/test";

const newTools = ["html-entities", "url-encode", "dummy-text", "css-specificity", "fluid-type"] as const;
async function enable(page: Page, id: typeof newTools[number], locale: string) {
  await page.goto("./" + locale + "/tools/" + id + "/");
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await page.getByTestId("disabled-settings").click();
  const toggle = page.getByTestId("toggle-" + id);
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await page.getByTestId("settings-close").click();
  await expect(page.locator("#" + id + "-input")).toBeVisible();
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", id);
}

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"]) {
  test("five opt-in tools work in " + locale + " without viewport overflow", async ({page}) => {
    await enable(page,"html-entities",locale);
    await page.locator("#html-entities-input").fill('<b title="x">A & 👋</b>');
    await expect(page.getByTestId("html-entities-output")).toHaveText("&lt;b title=&quot;x&quot;&gt;A &amp; 👋&lt;/b&gt;");
    await page.getByTestId("codec-direction").selectOption("decode");
    await page.locator("#html-entities-input").fill("&amp;lt; &#x1F44B;");
    await expect(page.getByTestId("html-entities-output")).toHaveText("&lt; 👋");
    await page.getByTestId("codec-direction").selectOption("encode");
    await page.getByTestId("codec-mode").selectOption("full");
    await page.locator("#html-entities-input").fill("日");
    await expect(page.getByTestId("html-entities-output")).toHaveText("&#x65E5;");

    await enable(page,"url-encode",locale);
    await page.locator("#url-encode-input").fill("A B/日+?");
    await expect(page.getByTestId("url-encode-output")).toHaveText("A%20B%2F%E6%97%A5%2B%3F");
    await page.getByTestId("codec-mode").selectOption("path");
    await expect(page.getByTestId("url-encode-output")).toHaveText("A%20B/%E6%97%A5%2B%3F");
    await page.getByTestId("codec-mode").selectOption("form");
    await page.locator("#url-encode-input").fill("a b+c");
    await expect(page.getByTestId("url-encode-output")).toHaveText("a+b%2Bc");

    await enable(page,"dummy-text",locale);
    await expect(page.getByTestId("dummy-text-output")).not.toBeEmpty();
    await page.getByTestId("dummy-language").selectOption("ja");
    await page.getByTestId("dummy-unit").selectOption("characters");
    await page.locator("#dummy-text-input").fill("12");
    await expect.poll(async () => (await page.getByTestId("dummy-text-output").innerText()).length).toBe(12);

    await enable(page,"css-specificity",locale);
    await page.locator("#css-specificity-input").fill("main#app .card:hover::before, p:where(#preview) > a");
    const rows = page.getByTestId("css-specificity-output").locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator("td").nth(1)).toHaveText("1");
    await expect(rows.nth(0).locator("td").nth(2)).toHaveText("2");
    await expect(rows.nth(0).locator("td").nth(3)).toHaveText("2");
    await expect(rows.nth(1).locator("td").nth(1)).toHaveText("0");

    await enable(page,"fluid-type",locale);
    await expect(page.getByTestId("fluid-type-output")).toContainText("clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem)");
    await page.locator("#fluid-max-viewport").fill("320");
    await expect(page.getByRole("alert")).toBeVisible();
    await page.locator("#fluid-max-viewport").fill("1280");
    await expect(page.getByTestId("fluid-type-output")).toContainText("clamp(");

    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
  });
}

test("invalid input is rejected, large text is deferred and private", async ({page}) => {
  const requests: Array<{url:string,method:string,body:string|null}> = [];
  page.on("request", request => requests.push({url:request.url(),method:request.method(),body:request.postData()}));
  await enable(page,"url-encode","en");
  await page.getByTestId("codec-direction").selectOption("decode");
  await page.locator("#url-encode-input").fill("%E3%81");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByTestId("url-encode-output")).toHaveCount(0);
  await page.getByTestId("codec-direction").selectOption("encode");
  const secret = "PRIVATE_UTILITY_INPUT_2026_" + "abc".repeat(3200);
  await page.locator("#url-encode-input").fill(secret);
  await page.getByTestId("apply-now").click();
  await expect(page.getByTestId("url-encode-output")).toHaveText(secret);
  const stored = await page.evaluate(() => ({
    local:{...localStorage}, session:{...sessionStorage}, url:location.href,
  }));
  expect(JSON.stringify(stored)).not.toContain(secret);
  expect(requests.every(r=>new URL(r.url).origin==="http://127.0.0.1:4173" && r.method==="GET" && r.body===null)).toBe(true);
  expect(JSON.stringify(requests)).not.toContain(secret);
});
