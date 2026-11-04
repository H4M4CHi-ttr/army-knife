import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { traceContextMessages } from "../../src/i18n/trace-context";
import { TRACE_CONTEXT_SAMPLE } from "../../src/lib/tools/trace-context-sample";

const PRIVATE = "PRIVATE_TRACE_9173";
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
      expect(url.origin).toBe(new URL(baseURL!).origin);
      expect((await allowed).has(url.pathname)).toBe(true);
      expect(url.search).toBe(""); expect(request.method).toBe("GET"); expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE);
    expect(errors).toEqual([]); expect(sockets).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`Trace Context values, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = traceContextMessages[locale];
    await page.goto(`./${locale}/tools/trace-context/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.trace-context.description"]);
    const result = page.getByTestId("trace-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("trace-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("trace-id")).toHaveText("4bf92f3577b34da6a3ce929d0e0e4736");
    await expect(page.getByTestId("trace-parent-id")).toHaveText("00f067aa0ba902b7");
    await expect(page.getByTestId("trace-sampled")).toHaveText(m["trace.set"]);
    await expect(page.getByTestId("trace-entries").locator("tbody tr")).toHaveCount(2);
    await expect(page.getByTestId("trace-entries").locator("tbody tr").first()).toContainText("rojo");
    await page.locator("#trace-parent-input").fill(TRACE_CONTEXT_SAMPLE.parent.slice(0, -2) + "02");
    await expect(page.getByTestId("trace-sampled")).toHaveText(m["trace.unset"]);
    await expect(page.getByTestId("trace-other")).toContainText("02");
    await page.locator("#trace-state-input").fill("a= opaque  value, ,b=second");
    await expect(page.getByTestId("trace-empty")).toContainText("1");
    await expect(page.getByTestId("trace-entries").locator("tbody tr").first().locator("td").last()).toHaveText(" opaque  value");
    await page.getByTestId("trace-sample").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-") && ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark"));
      const path = capture ? `docs/screenshots/trace-context-${locale}-${theme}-${testInfo.project.name.endsWith("small") ? "small" : "desktop"}.png` : undefined;
      await testInfo.attach(`trace-context-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
    }
    await page.getByTestId("trace-clear").focus(); await page.keyboard.press("Enter");
    await expect(result).toHaveCount(0);
    await expect(page.locator("#trace-parent-input")).toHaveValue("");
    await expect(page.locator("#trace-state-input")).toHaveValue("");
  });
}

test("Trace Context explicit JSON copy/download, opaque values and memory lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/trace-context/"); await page.getByTestId("trace-sample").click();
  const result = page.getByTestId("trace-result");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toEqual({
    traceparent: TRACE_CONTEXT_SAMPLE.parent, version: "00", traceId: "4bf92f3577b34da6a3ce929d0e0e4736", parentId: "00f067aa0ba902b7",
    flags: "01", sampled: true, otherFlags: "00", emptyMembers: 0,
    entries: [{ position: 1, key: "rojo", value: "00f067aa0ba902b7" }, { position: 2, key: "congo", value: "t61rcWkgMzE" }],
  });
  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-trace-context.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  await page.locator("#trace-state-input").fill(`a=<script>alert('${PRIVATE}')</script> https://example.invalid/${PRIVATE}`);
  await expect(result).toContainText(PRIVATE); await expect(result.locator("script, img, a")).toHaveCount(0);
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator("#trace-parent-input")).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("trace-sample").click();
  await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#trace-parent-input")).toHaveValue(""); await expect(page.locator("#trace-state-input")).toHaveValue(""); await expect(result).toHaveCount(0);
});

test("Trace Context rejects unsupported or malformed inputs and either rejected edit", async ({ page }) => {
  await page.goto("./en/tools/trace-context/");
  const result = page.getByTestId("trace-result");
  for (const [id, text] of [
    ["parent", TRACE_CONTEXT_SAMPLE.parent.toUpperCase()], ["parent", "01" + TRACE_CONTEXT_SAMPLE.parent.slice(2)],
    ["parent", TRACE_CONTEXT_SAMPLE.parent + "-extra"], ["parent", TRACE_CONTEXT_SAMPLE.parent.replace("00f067aa0ba902b7", "0".repeat(16))],
    ["state", "a=x,a=y"], ["state", "a=x=y"], ["state", "a@1=x"], ["state", ",".repeat(32)], ["state", "a=" + "x".repeat(257)],
  ]) {
    await page.getByTestId("trace-sample").click(); await page.locator(`#trace-${id}-input`).fill(text!);
    await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await expect(page.getByRole("alert")).toBeVisible();
  }
  for (const [id, length] of [["parent", 129], ["state", 513]] as const) {
    await page.getByTestId("trace-sample").click();
    await page.locator(`#trace-${id}-input`).evaluate((element, size) => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(size) } });
      element.dispatchEvent(event);
    }, length);
    await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
    await page.getByTestId("trace-sample").click(); await expect(result).toBeVisible();
  }
});

test("Trace Context stays immediate with auto-apply off and clears on app navigation", async ({ page }) => {
  await page.goto("./en/tools/retry-after/");
  await page.locator("#retry-after-input").fill("120" + " ".repeat(2100));
  await page.locator("#retry-after-reference").fill("2026-11-05T00:00:00Z");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-trace-context").click();
  await page.locator("#trace-parent-input").fill(TRACE_CONTEXT_SAMPLE.parent + " ".repeat(73));
  await page.locator("#trace-state-input").fill("a=x" + " ".repeat(509));
  await expect(page.getByTestId("trace-id")).toHaveText("4bf92f3577b34da6a3ce929d0e0e4736");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-mode", "instant");
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "applied");
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-trace-context").click();
  await expect(page.locator("#trace-parent-input")).toHaveValue(""); await expect(page.getByTestId("trace-result")).toHaveCount(0);
});

