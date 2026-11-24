import { readFile } from "node:fs/promises";
import { expect, test as base, type Request } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { iCalendarMessages } from "../../src/i18n/icalendar";
import { ICALENDAR_SAMPLE } from "../../src/lib/tools/icalendar-sample";

const marker = "SYNTHETIC_ICALENDAR_PRIVATE_MARKER";
const allowed = readFile("dist/public-assets.json", "utf8").then(parsePublicAssets);
const test = base.extend<{ audit: void }>({
  audit: [async ({ context, page, baseURL }, use) => {
    const requests: Request[] = [];
    const errors: string[] = [];
    const sockets: string[] = [];
    context.on("request", entry => requests.push(entry));
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" || message.text().includes(marker)) errors.push(message.text());
    });
    page.on("websocket", socket => sockets.push(socket.url()));
    await use();
    const paths = await allowed;
    for (const entry of requests) {
      const url = new URL(entry.url());
      expect(url.origin).toBe(new URL(baseURL!).origin);
      expect(url.search).toBe("");
      expect(paths.has(url.pathname)).toBe(true);
      expect(entry.method()).toBe("GET");
      expect(entry.postData()).toBeNull();
      expect(JSON.stringify([entry.url(), entry.headers()])).not.toContain(marker);
    }
    expect(errors).toEqual([]);
    expect(sockets).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["en", "ja", "zh-CN", "zh-TW", "ko"] as const) {
  test("local iCalendar inspection and keyboard preview in " + locale, async ({ page }, testInfo) => {
    const m = iCalendarMessages[locale];
    await page.goto("./" + locale + "/tools/icalendar/");
    await expect(page.locator("h1")).toHaveText(m["tool.icalendar.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["icalendar.limits"]);
    const sample = page.getByTestId("icalendar-sample");
    await sample.focus();
    await page.keyboard.press("Enter");
    const events = page.getByTestId("icalendar-event");
    await expect(events).toHaveCount(3);
    await expect(events.first()).toContainText("Planning, review");
    await expect(events.nth(1)).toContainText(m["icalendar.exception"]);
    await expect(events.last()).toContainText(m["icalendar.date.date"]);
    await expect(page.getByTestId("icalendar-timezone")).toContainText("Example/Office");
    const summary = events.nth(1).locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(events.nth(1)).toHaveAttribute("open", "");
    await expect(events.nth(1)).toContainText("20261209T090000");
    await expect(events.nth(1)).toContainText("20261209T110000");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId("theme-" + theme).click();
      await page.getByTestId("settings-close").click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if (locale === "en" || locale === "ja") {
        await page.evaluate(() => document.fonts.ready);
        const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1"
          && testInfo.project.name.startsWith("chromium-")
          && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
        const path = capture ? "docs/screenshots/icalendar-" + locale + "-" + theme + "-" + (testInfo.project.name.endsWith("small") ? "small" : "desktop") + ".png" : undefined;
        await testInfo.attach("icalendar-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
      }
    }
  });
}

test("imports an ICS file, displays inert values and exports only on request", async ({ page }) => {
  await page.goto("./en/tools/icalendar/");
  const picker = page.locator('input[type="file"]');
  await expect(picker).toHaveAttribute("accept", ".ics,text/calendar,text/plain");
  const source = ICALENDAR_SAMPLE.replace("SUMMARY:Planning\\,\n  review",
    'SUMMARY:<img src="https://example.invalid/' + marker + '">');
  await picker.setInputFiles({ name: "synthetic.ics", mimeType: "text/calendar", buffer: Buffer.from(source.replaceAll("\n", "\r\n")) });
  const result = page.getByTestId("icalendar-result");
  await expect(result).toContainText(marker);
  await expect(result.locator("img")).toHaveCount(0);
  const downloaded = page.waitForEvent("download");
  await result.getByRole("button", { name: /download/i }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("army-knife-icalendar.json");
  const json = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(json.calendars[0].events[0].summary).toContain(marker);
  expect(json.calendars[0].events[1].recurrenceId.value).toBe("20261209T090000");
  expect(await page.evaluate(() => JSON.stringify([location.href, localStorage, sessionStorage]))).not.toContain(marker);
  await page.reload();
  await expect(page.locator("#icalendar-input")).toHaveValue("");
  await expect(result).toHaveCount(0);
});

test("defers heavy parsing, cancels the countdown, and inspects the latest edit on manual apply", async ({ page }) => {
  await page.goto("./en/tools/icalendar/");
  await page.clock.install();
  const input = page.locator("#icalendar-input");
  const result = page.getByTestId("icalendar-result");
  const status = page.getByTestId("apply-control");
  const padding = "X-TEST:" + "a".repeat(4200);
  const large = ICALENDAR_SAMPLE.replace("END:VCALENDAR", padding + "\nEND:VCALENDAR");
  await input.fill(large);
  await expect(status).toHaveAttribute("data-status", "pending");
  await expect(page.getByTestId("apply-now")).toContainText("0.8s");
  await page.getByTestId("icalendar-cancel").click();
  await page.clock.fastForward(800);
  await expect(status).toHaveAttribute("data-status", "cancelled");
  await expect(result).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").uncheck();
  await input.fill(large.replace("Moved planning", marker));
  await expect(status).toHaveAttribute("data-status", "manual");
  await page.getByTestId("apply-now").click();
  await expect(result).toContainText(marker);
  await input.fill("BEGIN:VCALENDAR\nVERSION:1.0\nEND:VCALENDAR");
  await expect(result).not.toContainText(marker);
  await expect(page.getByTestId("icalendar-diagnostics")).toContainText("Unsupported iCalendar version");
  await input.fill("BEGIN:VCALENDAR\nX-BIG:" + "x".repeat(8192) + "\nEND:VCALENDAR");
  await page.getByTestId("apply-now").click();
  await expect(result).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("structure exceeds");
});
