import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { pgTextArrayMessages } from "../../src/i18n/pg-text-array";
import { PG_TEXT_ARRAY_SAMPLE, PG_TEXT_ARRAY_SAMPLE_JSON } from "../../src/lib/tools/pg-text-array-sample";

const PRIVATE = "PRIVATE_PG_ARRAY_7301";
async function assets(dir: string, prefix = "/army-knife/"): Promise<string[]> {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry =>
    entry.isDirectory() ? assets(`${dir}/${entry.name}`, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
  ))).flat();
}
const allowed = assets("dist").then(paths => new Set([
  ...paths, ...paths.filter(path => path.endsWith("index.html")).map(path => path.slice(0, -10)),
]));
const test = base.extend<{ audit: void }>({
  audit: [async ({ context, page, baseURL }, use) => {
    const requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [];
    const errors: string[] = [], sockets: string[] = [];
    context.on("request", request => requests.push({ url: request.url(), method: request.method(), headers: request.headers(), body: request.postData() }));
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error" || message.text().includes(PRIVATE)) errors.push(message.text()); });
    page.on("websocket", socket => sockets.push(socket.url()));
    await use();
    for (const request of requests) {
      const url = new URL(request.url);
      expect(url.origin).toBe(new URL(baseURL!).origin); expect((await allowed).has(url.pathname)).toBe(true);
      expect(url.search).toBe(""); expect(request.method).toBe("GET"); expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE); expect(errors).toEqual([]); expect(sockets).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("PostgreSQL text[] conversion, keyboard and themes in " + locale, async ({ page }, testInfo) => {
    const m = pgTextArrayMessages[locale];
    await page.goto("./" + locale + "/tools/pg-text-array/");
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("h1")).toHaveText(m["tool.pg-text-array.name"]);
    await expect(page.getByTestId("pg-array-result")).toHaveCount(0);
    await page.getByTestId("pg-array-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("pg-array-count")).toHaveText("7");
    await expect(page.getByTestId("pg-array-nulls")).toHaveText("1");
    await expect(page.getByTestId("pg-array-empty")).toHaveText("1");
    expect(JSON.parse((await page.getByTestId("pg-array-json").locator("pre").textContent())!)).toEqual(["a,b", null, "NULL", "", 'a"b', "c\\d", "日本語"]);
    expect(await page.getByTestId("pg-array-array").locator("pre").textContent()).toBe(PG_TEXT_ARRAY_SAMPLE);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? "docs/screenshots/pg-text-array-" + locale + "-" + theme + "-" + (testInfo.project.name.endsWith("small") ? "small" : "desktop") + ".png" : undefined;
      await testInfo.attach("pg-text-array-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.locator("#pg-array-mode").selectOption("encode");
    await expect(page.locator("#pg-text-array-input")).toHaveValue(""); await expect(page.getByTestId("pg-array-result")).toHaveCount(0);
    await page.getByTestId("pg-array-sample").click();
    expect(await page.getByTestId("pg-array-array").locator("pre").textContent()).toBe(PG_TEXT_ARRAY_SAMPLE);
    await page.locator("#pg-text-array-input").fill("[1]");
    await expect(page.getByRole("alert")).toHaveText(m["errors.PG_ARRAY_JSON_SHAPE"]);
    await expect(page.getByTestId("pg-array-result")).toHaveCount(0);
    await page.getByTestId("pg-array-clear").focus(); await page.keyboard.press("Enter");
    await expect(page.locator("#pg-text-array-input")).toHaveValue("");
  });
}

test("PostgreSQL arrays export complete independent formats, inert values and labelled preview", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { copies: string[] }).copies = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => {
      (window as unknown as { copies: string[] }).copies.push(text);
    } } });
  });
  await page.goto("./en/tools/pg-text-array/"); await page.getByTestId("pg-array-sample").click();
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  for (const [id, text, filename] of [
    ["json", PG_TEXT_ARRAY_SAMPLE_JSON, "army-knife-pg-text-array.json"],
    ["array", PG_TEXT_ARRAY_SAMPLE, "army-knife-pg-text-array-value.txt"],
  ]) {
    const section = page.getByTestId("pg-array-" + id);
    await section.getByRole("button", { name: "Copy", exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies.at(-1))).toBe(text);
    const pending = page.waitForEvent("download"); await section.getByRole("button", { name: "Download", exact: true }).click();
    const download = await pending; expect(download.suggestedFilename()).toBe(filename);
    const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
    expect(Buffer.concat(chunks).toString("utf8")).toBe(text);
  }
  await page.locator("#pg-array-mode").selectOption("encode");
  const values = ["<img src=https://example.invalid/" + PRIVATE + ">", "9007199254740993", null, "", ...Array(36).fill("tail")];
  await page.locator("#pg-text-array-input").fill(JSON.stringify(values));
  await expect(page.getByTestId("pg-array-item")).toHaveCount(32);
  await expect(page.locator("caption")).toContainText("40");
  expect(JSON.parse((await page.getByTestId("pg-array-json").locator("pre").textContent())!)).toEqual(values);
  await expect(page.locator("#main-content img, #main-content script")).toHaveCount(0);
  await page.getByTestId("pg-array-json").getByRole("button", { name: "Copy", exact: true }).click();
  expect(JSON.parse((await page.evaluate(() => (window as unknown as { copies: string[] }).copies.at(-1)))!)).toEqual(values);
  await page.locator("#pg-text-array-input").fill("[]"); await expect(page.getByTestId("pg-array-count")).toHaveText("0");
  await expect(page.getByTestId("pg-array-zero-dim")).toBeVisible();
  const pending = page.waitForEvent("download"); await page.getByTestId("pg-array-array").getByRole("button", { name: "Download", exact: true }).click();
  const chunks: Buffer[] = []; for await (const chunk of (await (await pending).createReadStream())!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toBe("{}");
});

test("PostgreSQL arrays reject malformed values, counts, output expansion and invalid imports atomically", async ({ page }) => {
  await page.goto("./en/tools/pg-text-array/");
  const input = page.locator("#pg-text-array-input"), result = page.getByTestId("pg-array-result");
  for (const value of ["{x,}", "{{x}}", "[0:1]={x,y}", "'{}'::text[]"]) {
    await input.fill(value); await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
  }
  await input.fill("{" + Array(256).fill("NULL").join(",") + "}");
  await expect(page.getByTestId("pg-array-count")).toHaveText("256");
  await input.fill("{" + Array(257).fill("NULL").join(",") + "}"); await expect(result).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveText(pgTextArrayMessages.en["errors.PG_ARRAY_COUNT"]);
  // Firefox's synthetic insertText drops C0 controls. Import actual UTF-8 bytes
  // so this case exercises the same output expansion in both engines.
  const expansion = '{"' + "\u0001".repeat(5461) + '"}';
  await page.locator('input[type="file"]').setInputFiles({ name: "control-expansion.txt", mimeType: "text/plain", buffer: Buffer.from(expansion) });
  await expect(input).toHaveValue(expansion);
  await page.getByTestId("apply-now").click(); await expect(result).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveText(pgTextArrayMessages.en["errors.PG_ARRAY_OUTPUT_LIMIT"]);
  for (const operation of ["decode", "encode"]) {
    await page.locator("#pg-array-mode").selectOption(operation); await page.getByTestId("pg-array-sample").click();
    await input.evaluate(element => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } }); element.dispatchEvent(event);
    });
    await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    const valid = operation === "decode" ? PG_TEXT_ARRAY_SAMPLE : PG_TEXT_ARRAY_SAMPLE_JSON;
    await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.txt", mimeType: "text/plain", buffer: Buffer.from(valid) });
    await expect(page.getByTestId("pg-array-count")).toHaveText("7");
    for (const bytes of [Buffer.from("\ufeff" + valid), Buffer.from([255]), Buffer.from("x".repeat(8193))]) {
      await page.getByTestId("pg-array-sample").click();
      await page.locator('input[type="file"]').setInputFiles({ name: "synthetic.txt", mimeType: "text/plain", buffer: bytes });
      await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
      await expect(page.getByRole("alert")).toBeVisible();
    }
  }
});

test("PostgreSQL arrays defer large work, cancel and apply manually while short work stays immediate", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-14T00:00:00Z") }); await page.goto("./en/tools/pg-text-array/");
  await page.clock.pauseAt(new Date("2026-11-14T01:00:00Z"));
  const input = page.locator("#pg-text-array-input"), result = page.getByTestId("pg-array-result");
  await input.fill('{"' + "x".repeat(2049) + '"}');
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(799); await expect(result).toHaveCount(0); await page.clock.runFor(1); await expect(result).toBeVisible();
  await input.fill('{"' + "y".repeat(2049) + '"}'); await page.getByTestId("pg-array-cancel").click();
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(result).toBeVisible();
  await page.getByTestId("auto-apply-toggle").uncheck(); await input.fill('{"' + "z".repeat(2049) + '"}');
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").click(); await expect(result).toBeVisible();
  await input.fill('{"short"}'); await expect(result).toBeVisible(); await expect(page.getByTestId("apply-control")).toHaveAttribute("data-mode", "instant");
  await input.fill('{"' + "q".repeat(2049) + '"}'); await page.locator("#pg-array-mode").selectOption("encode");
  await page.clock.runFor(1000); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("PostgreSQL array values clear on tool, mode, locale and reload without URL/storage leakage", async ({ page }) => {
  await page.goto("./en/tools/pg-text-array/");
  const input = page.locator("#pg-text-array-input"), result = page.getByTestId("pg-array-result");
  const value = '{"' + PRIVATE + '",NULL,"NULL",""}';
  const state = () => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  await input.fill(value); await expect(result).toBeVisible(); expect(JSON.stringify(await state())).not.toContain(PRIVATE);
  await page.reload(); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await input.fill(value); await page.locator(".back-link").click(); await page.getByTestId("tool-card-pg-text-array").click();
  await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await input.fill(value); await page.locator("#pg-array-mode").selectOption("encode"); await expect(input).toHaveValue("");
  await input.fill('["' + PRIVATE + '"]'); await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0); await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  expect(JSON.stringify(await state())).not.toContain(PRIVATE);
});

test("PostgreSQL arrays preserve quoted and escaped carriage returns through file, keyboard and raw paste", async ({ page }) => {
  await page.goto("./en/tools/pg-text-array/");
  const input = page.locator("#pg-text-array-input"), json = page.getByTestId("pg-array-json").locator("pre");
  for (const [source, value] of [['{"a\rb"}', "a\rb"], ['{"a\r\nb"}', "a\r\nb"], ["{a\\\rb}", "a\rb"]]) {
    await page.getByTestId("pg-array-clear").click();
    await page.locator('input[type="file"]').setInputFiles({ name: "raw-cr.txt", mimeType: "text/plain", buffer: Buffer.from(source!) });
    const expected = JSON.stringify([value], null, 2);
    await expect(json).toHaveText(expected);
    await input.focus(); await page.keyboard.press("ControlOrMeta+End"); await page.keyboard.type(" ");
    await expect(json).toHaveText(expected);
    expect(await input.evaluate((element: HTMLTextAreaElement) => element.readOnly)).toBe(true);
    await expect(page.getByTestId("preserved-cr-input")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    const pending = page.waitForEvent("download"); await page.getByTestId("download-raw-cr-input").click();
    const chunks: Buffer[] = []; for await (const chunk of (await (await pending).createReadStream())!) chunks.push(chunk);
    expect(Buffer.concat(chunks).toString("utf8")).toBe(source);
    await page.getByTestId("replace-raw-cr-input").click(); await expect(input).toHaveValue("");
    expect(await input.evaluate((element: HTMLTextAreaElement) => element.readOnly)).toBe(false);
    const prevented = await input.evaluate((element, text) => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => text } }); element.dispatchEvent(event);
      return event.defaultPrevented;
    }, source!);
    expect(prevented).toBe(true); await expect(json).toHaveText(expected);
  }
  await page.getByTestId("replace-raw-cr-input").click();
  await input.evaluate(element => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => '{"' + "é".repeat(4094) + '\r"}' } });
    element.dispatchEvent(event);
  });
  await expect(page.getByRole("alert")).toHaveText("The input exceeds this tool’s size limit.");
  await expect(page.getByTestId("pg-array-result")).toHaveCount(0);
  await page.locator("#pg-array-mode").selectOption("encode");
  await expect(input).toHaveValue("");
  await page.locator('input[type="file"]').setInputFiles({ name: "crlf-json.json", mimeType: "application/json", buffer: Buffer.from('[\r\n"a\\rb"\r\n]') });
  await expect(json).toHaveText(JSON.stringify(["a\rb"], null, 2));
  expect(await input.evaluate((element: HTMLTextAreaElement) => element.readOnly)).toBe(false);
  await input.focus(); await page.keyboard.press("ControlOrMeta+End"); await page.keyboard.type(" ");
  expect(JSON.parse((await json.textContent())!)).toEqual(["a\rb"]);
});
