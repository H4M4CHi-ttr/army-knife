import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";

async function enable(page: Page, locale = "en") {
  await page.goto("./" + locale + "/tools/base64/");
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await page.getByTestId("disabled-settings").click();
  const toggle = page.getByTestId("toggle-base64");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("settings-close").click();
  await expect(page.locator("#base64-input")).toBeVisible();
}

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"]) {
  test("local Base64 conversion and opt-in in " + locale, async ({ page }) => {
    await enable(page, locale);
    await page.locator("#base64-input").fill("こんにちは 👋");
    await expect(page.getByTestId("base64-output")).toHaveText("44GT44KT44Gr44Gh44GvIPCfkYs=");
    await page.getByTestId("base64-direction").selectOption("decode");
    await page.locator("#base64-input").fill("44GT44KT44Gr44Gh44GvIPCfkYs=");
    await expect(page.getByTestId("base64-output")).toHaveText("こんにちは 👋");
    await page.getByTestId("base64-alphabet").selectOption("url");
    await page.getByTestId("base64-direction").selectOption("encode");
    await page.locator("#base64-input").fill("💻");
    await expect(page.getByTestId("base64-output")).toHaveText("8J-Suw");
    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
  });
}

test("strict errors, large-worker processing, export and privacy", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    requests.push(request.url());
  });
  await enable(page);
  await page.getByTestId("base64-direction").selectOption("decode");
  await page.locator("#base64-input").fill("Zg==\n");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByTestId("base64-output")).toHaveCount(0);
  await page.locator("#base64-input").fill("/w==");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByTestId("base64-direction").selectOption("encode");
  const sample = "PRIVATE_INPUT_M4RKR_7261" + "🙂".repeat(5000);
  await page.locator("#base64-input").fill(sample);
  const expected = Buffer.from(sample, "utf8").toString("base64");
  await expect(page.getByTestId("base64-output")).toHaveText(expected, { timeout: 15000 });

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadEvent;
  const location = await download.path();
  expect(location).not.toBeNull();
  expect(await readFile(location as string, "utf8")).toBe(expected);

  const stored = await page.evaluate(() => ({
    preferences: localStorage.getItem("army-knife:preferences:v1"),
    session: Object.values(sessionStorage),
    url: location.href,
  }));
  expect(JSON.stringify(stored)).not.toContain("PRIVATE_INPUT_M4RKR_7261");
  for (const request of requests) {
    const url = new URL(request);
    expect(url.origin).toBe("http://127.0.0.1:4173");
    expect(url.search).toBe("");
    expect(request).not.toContain("PRIVATE_INPUT_M4RKR_7261");
  }
});
