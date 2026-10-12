import { test, expect, type Page } from "@playwright/test";

const locales = ["en", "ja", "zh-CN", "zh-TW", "ko"] as const;

async function openTool(page: Page, tool: string, locale = "en"): Promise<void> {
  await page.goto("./" + locale + "/tools/" + tool + "/");
  if (await page.getByTestId("tool-disabled").isVisible()) {
    await page.getByTestId("disabled-settings").click();
    const toggle = page.getByTestId("toggle-" + tool);
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("settings-close").click();
  }
}

for (const locale of locales) {
  test("timestamp conversion and locale integration: " + locale, async ({ page }) => {
    await openTool(page, "timestamp", locale);
    await page.getByTestId("date-input").fill("2026-10-12T12:30:00+09:00");
    await expect(page.locator(".data-table")).toContainText("2026-10-12T03:30:00.000Z");
    await page.getByTestId("date-zone").fill("Asia/Tokyo");
    await expect(page.locator(".data-table")).toContainText("12:30:00");
    await page.getByTestId("date-kind").selectOption("seconds");
    await page.getByTestId("date-input").fill("-0.001");
    await expect(page.locator(".data-table")).toContainText("1969-12-31T23:59:59.999Z");
    await page.getByTestId("date-input").fill("not-a-time");
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth + 1));
  });

  test("Open Graph tags are safe and translated: " + locale, async ({ page }) => {
    await openTool(page, "og-tags", locale);
    await page.getByTestId("og-title").fill('Title " & <script>');
    await page.getByTestId("og-url").fill("https://example.com/a?b=1&c=2");
    await expect(page.getByTestId("og-result")).toContainText("Title &quot; &amp; &lt;script&gt;");
    await expect(page.getByTestId("og-result")).toContainText("b=1&amp;c=2");
    await page.getByTestId("og-url").fill("javascript:alert(1)");
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth + 1));
  });
}

test("JWT inspector keeps claims untrusted, without leaking input", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await openTool(page, "jwt");
  const token = "eyJhbGciOiJub25lIn0.eyJzdWIiOiJQUklWQVRFX01BUktFUl81NDMyIiwiZXhwIjoxfQ.";
  await page.getByTestId("jwt-input").fill(token);
  await expect(page.locator(".result-panel")).toContainText("PRIVATE_MARKER_5432");
  await expect(page.getByRole("note")).toBeVisible();
  const local = await page.evaluate(() => ({
    href: location.href, stored: localStorage.getItem("army-knife:preferences:v1"),
    session: Object.values(sessionStorage),
  }));
  expect(JSON.stringify(local)).not.toContain("PRIVATE_MARKER_5432");
  expect(JSON.stringify(requests)).not.toContain(token);
  for (const raw of requests) {
    const url = new URL(raw);
    expect(url.hostname).toBe("127.0.0.1");
    expect(url.search).toBe("");
  }
  await page.getByTestId("jwt-input").fill("a.b.c");
  await expect(page.getByRole("alert")).toBeVisible();
});

test("UUID v4/v7, ULID generation and inspection", async ({ page }) => {
  await openTool(page, "ids");
  await page.getByTestId("id-count").fill("5");
  await page.getByTestId("id-generate").click();
  const v7 = await page.getByTestId("id-results").inputValue();
  expect(v7.trim().split("\n")).toHaveLength(5);
  expect(v7).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/);
  await page.getByTestId("id-inspect").fill(v7.trim().split("\n")[0]!);
  await expect(page.locator(".result-panel").last()).toContainText("UUID v7");
  await page.getByTestId("id-format").selectOption("ulid");
  await page.getByTestId("id-generate").click();
  const ulids = await page.getByTestId("id-results").inputValue();
  expect(ulids.trim().split("\n")[0]).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  await page.getByTestId("id-count").fill("101");
  await page.getByTestId("id-generate").click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("password generator enforces groups and hex length", async ({ page }) => {
  await openTool(page, "password");
  await page.getByTestId("secret-length").fill("24");
  await page.getByTestId("secret-count").fill("5");
  await page.getByTestId("secret-generate").click();
  const secrets = await page.getByTestId("secret-results").inputValue();
  expect(secrets.trim().split("\n")).toHaveLength(5);
  for (const secret of secrets.trim().split("\n")) {
    expect(secret).toHaveLength(24);
    expect(secret).toMatch(/[a-z]/);
    expect(secret).toMatch(/[A-Z]/);
    expect(secret).toMatch(/[0-9]/);
  }
  await page.getByTestId("secret-mode").selectOption("hex");
  await page.getByTestId("secret-length").fill("9");
  await page.getByTestId("secret-generate").click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByTestId("secret-length").fill("16");
  await page.getByTestId("secret-generate").click();
  expect(await page.getByTestId("secret-results").inputValue()).toMatch(/^[a-f0-9]{16}/);
});
