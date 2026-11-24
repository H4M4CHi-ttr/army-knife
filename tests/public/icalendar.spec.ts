import { expect, test, type Request } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { iCalendarMessages } from "../../src/i18n/icalendar";

test("published iCalendar inspector works on the verified Pages revision", async ({
  page,
  request,
  baseURL,
}) => {
  const base = new URL(baseURL!);
  const manifest = await request.get(new URL("public-assets.json", base).href, { maxRedirects: 0 });
  expect(manifest.status()).toBe(200);
  const allowed = parsePublicAssets(
    await manifest.text(),
    process.env.ARMY_KNIFE_DEPLOYED_SHA ?? process.env.GITHUB_SHA,
  );
  const marker = "synthetic-icalendar-pages-check";
  const requests: Request[] = [];
  const errors: string[] = [];
  page.on("request", (entry) => requests.push(entry));
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("./en/tools/icalendar/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText(iCalendarMessages.en["tool.icalendar.name"]);
  await page.getByTestId("icalendar-sample").click();
  await expect(page.getByTestId("icalendar-event")).toHaveCount(3);
  await expect(page.getByTestId("icalendar-event").first()).toContainText("Planning, review");
  await expect(page.getByTestId("icalendar-timezone").first()).toContainText("Example/Office");

  const input = page.locator("#icalendar-input");
  await input.fill(
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Example//Synthetic calendar//EN",
      "BEGIN:VEVENT",
      "UID:published-check@example.invalid",
      "DTSTAMP:20261124T120000Z",
      "DTSTART;VALUE=DATE:20261125",
      `SUMMARY:${marker}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );
  await expect(page.getByTestId("icalendar-event").first()).toContainText(marker);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain(marker);
  await page.reload();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("icalendar-result")).toHaveCount(0);

  for (const entry of requests) {
    const url = new URL(entry.url());
    expect(url.origin).toBe(base.origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname)).toBe(true);
    expect(entry.method()).toBe("GET");
    expect(entry.postData()).toBeNull();
    expect(entry.url()).not.toContain(marker);
  }
  expect(errors).toEqual([]);
});
