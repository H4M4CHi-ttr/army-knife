import { test, expect } from "@playwright/test";
import { ADDED_LOCALES, LOCALES, languageNames } from "../../src/lib/locales";
import { messages } from "../../src/i18n/messages";
import { localeHomePath, toolPath, SITE_BASE } from "../../src/lib/routes";

const PREFERENCE_KEY = "army-knife:preferences:v1";
const fontSamples = {
  es: "Español codificación ñáéíóúü",
  fr: "Français spécificité éèêëàâçœ",
  de: "Deutsch Größe äußere Übersicht",
  "pt-BR": "Português codificação ação ãõáç",
  id: "Bahasa Indonesia konversi ukuran",
  vi: "Tiếng Việt chuyển đổi Đăâêôơư ấầẩẫậếềểễệ",
};

for (const locale of ADDED_LOCALES) {
  test(`language ${locale}: translated UI, search, tool, fonts and saved preference`, async ({
    page,
  }, testInfo) => {
    const failures: string[] = [];
    const stylesheets: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.text().includes("[intlify]"))
        failures.push(message.text());
    });
    page.on("request", (request) => {
      if (request.resourceType() === "stylesheet") stylesheets.push(request.url());
    });

    await page.goto(localeHomePath("en"));
    await page.getByTestId("settings-button").click();
    const select = page.getByTestId("locale-select");
    await expect(select.locator("option")).toHaveCount(LOCALES.length);
    await expect(select.locator(`option[value="${locale}"]`)).toHaveText(languageNames[locale]);
    await select.selectOption(locale);
    await expect(page).toHaveURL(new RegExp(`${localeHomePath(locale)}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.getByTestId("tool-card-cidr")).toContainText(messages[locale]["tool.cidr.name"]);

    const search = page.locator(".global-search");
    await search.fill(messages[locale]["tool.cidr.name"]);
    await expect(page.getByTestId("tool-card-cidr")).toBeVisible();
    await page.getByTestId("tool-card-cidr").click();
    await expect(page).toHaveURL(new RegExp(`${toolPath(locale, "cidr")}$`));
    await expect(page.locator(".workbench-title")).toContainText(messages[locale]["tool.cidr.name"]);
    await page.locator("#cidr-input").fill("10.0.0.42/16");
    await expect(page.locator(".result-panel")).toContainText("10.0.0.0/16");
    await expect(page.locator(".result-panel")).toContainText(messages[locale]["cidr.addressCount"]);
    await expect(page.locator(".cidr-count").first()).toHaveText(new Intl.NumberFormat(locale).format(65_536));

    await expect(page.locator('link[data-font-locale="en"]')).toHaveAttribute("media", "all");
    const loadedFaces = await page.evaluate(async (sample) => {
      const faces = await document.fonts.load('16px "Noto Sans Variable"', sample);
      return faces.map((face) => ({
        family: face.family.replace(/^["']|["']$/g, ""),
        status: face.status,
      }));
    }, fontSamples[locale]);
    expect(loadedFaces.length).toBeGreaterThan(0);
    expect(loadedFaces.every((face) => face.family === "Noto Sans Variable" && face.status === "loaded")).toBe(true);
    expect(stylesheets.filter((url) => new URL(url).pathname.endsWith("/fonts/en.css"))).toHaveLength(1);
    expect(stylesheets.some((url) => new URL(url).pathname.endsWith(`/fonts/${locale}.css`))).toBe(false);

    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await expect(page.getByTestId("locale-select")).toHaveValue(locale);
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await testInfo.attach(`${locale}-${theme}-${testInfo.project.name}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("#cidr-input")).toHaveValue("");
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).locale, PREFERENCE_KEY)).toBe(locale);
    await page.goto(SITE_BASE);
    await expect(page).toHaveURL(new RegExp(`${localeHomePath(locale)}$`));
    expect(failures).toEqual([]);
  });
}
