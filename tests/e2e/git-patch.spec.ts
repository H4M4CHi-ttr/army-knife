import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { patchMessages } from "../../src/i18n/git-patch";
import { PATCH_SAMPLE } from "../../src/lib/tools/git-patch";

const PRIVATE = "PRIVATE_PATCH_791";
async function assets(dir: string, prefix = "/army-knife/"): Promise<string[]> {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map((entry) =>
    entry.isDirectory() ? assets(`${dir}/${entry.name}`, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
  ))).flat();
}
const allowed = assets("dist").then((paths) => new Set([
  ...paths, ...paths.filter((path) => path.endsWith("index.html")).map((path) => path.slice(0, -10)),
]));
const test = base.extend<{ audit: void }>({
  audit: [async ({ context, page, baseURL }, use) => {
    const requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [];
    const errors: string[] = [];
    const sockets: string[] = [];
    context.on("request", (request) => requests.push({ url: request.url(), method: request.method(), headers: request.headers(), body: request.postData() }));
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error" || message.text().includes(PRIVATE)) errors.push(message.text()); });
    page.on("websocket", (socket) => sockets.push(socket.url()));
    await use();
    for (const request of requests) {
      const url = new URL(request.url);
      expect(url.origin).toBe(new URL(baseURL!).origin);
      expect((await allowed).has(url.pathname)).toBe(true);
      expect(url.search).toBe("");
      expect(request.method).toBe("GET");
      expect(request.body).toBeNull();
    }
    expect(JSON.stringify(requests)).not.toContain(PRIVATE);
    expect(errors).toEqual([]);
    expect(sockets).toEqual([]);
  }, { auto: true }],
});

for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test(`Git patch files, hunks, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = patchMessages[locale];
    await page.goto(`./${locale}/tools/git-patch/`);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["tool.git-patch.description"]);
    await expect(page.locator("#git-patch-input")).toHaveValue("");
    const result = page.getByTestId("patch-result");
    await expect(result).toHaveCount(0);
    await page.getByTestId("patch-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("patch-totals")).toContainText("+2 / −1");
    const hunk = result.locator("details.patch-hunk");
    await expect(hunk).not.toHaveAttribute("open", "");
    await hunk.locator("summary").focus(); await page.keyboard.press("Enter");
    await expect(hunk.locator(".patch-lines")).toBeVisible();
    await expect(hunk.locator(".patch-addition")).toHaveCount(2);
    await page.locator("#patch-file").focus(); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
    await expect(result).toContainText("rename to new.txt");
    await expect(result.locator("details.patch-hunk")).toHaveCount(0);
    await page.locator("#patch-file").selectOption("0");
    await result.locator("details.patch-hunk summary").click();
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId("settings-close").click();
      await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      await testInfo.attach(`git-patch-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
  });
}

test("Git patch explicit full export, inert content and memory-only lifecycle", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as unknown as { copies: string[] }).copies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await page.goto("./en/tools/git-patch/");
  await page.locator("#git-patch-input").fill(PATCH_SAMPLE.replace("+Welcome!", `+<img src='https://example.invalid/${PRIVATE}'>`));
  const result = page.getByTestId("patch-result");
  await expect(result).toContainText(PRIVATE);
  await expect(result.locator("img")).toHaveCount(0);
  await page.locator("#patch-file").selectOption("1");
  expect(await page.evaluate(() => (window as unknown as { copies: string[] }).copies)).toEqual([]);
  await result.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copies: string[] }).copies[0]!);
  expect(JSON.parse(copied)).toMatchObject({ hunks: 1, additions: 2, deletions: 1 });
  expect(JSON.parse(copied).files).toHaveLength(2);
  expect(copied).toContain(PRIVATE);
  const pending = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-git-patch.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(JSON.parse(copied));
  const state = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
  expect(JSON.stringify(state)).not.toContain(PRIVATE);
  await page.reload();
  await expect(page.locator("#git-patch-input")).toHaveValue(""); await expect(result).toHaveCount(0);
  await page.getByTestId("patch-sample").click();
  if (await page.locator(".mobile-menu").isVisible()) await page.locator(".mobile-menu").click();
  await page.locator('a[href="/army-knife/en/tools/cidr/"]').first().click();
  await expect(page.locator("#cidr-input")).toBeVisible(); await page.goBack();
  await expect(page.locator("#git-patch-input")).toHaveValue("");
});

test("Git patch delayed/manual/cancel controls and stale result removal", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("./en/tools/git-patch/"); await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  const long = PATCH_SAMPLE.replace("+Welcome!", "+" + "x".repeat(2100));
  await page.locator("#git-patch-input").fill(long);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.fastForward(799); await expect(page.getByTestId("patch-result")).toHaveCount(0);
  await page.clock.fastForward(1); await expect(page.getByTestId("patch-result")).toBeVisible();
  await page.locator("#git-patch-input").fill(long.replace("greeting.txt", "other.txt"));
  await expect(page.getByTestId("patch-result")).toHaveCount(0);
  await page.getByTestId("patch-cancel").click(); await page.clock.fastForward(1000);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await expect(page.getByTestId("patch-result")).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#git-patch-input").fill(long);
  await page.getByTestId("apply-now").focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("patch-result")).toBeVisible();
  await page.locator("#git-patch-input").fill(long.replace("greeting.txt", "next.txt"));
  await page.clock.fastForward(1000); await expect(page.getByTestId("patch-result")).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").check(); await page.clock.fastForward(800);
  await expect(page.getByTestId("patch-result")).toBeVisible();
});

test("Git patch rejects unsupported, truncated and oversized input without partial exports", async ({ page }) => {
  await page.goto("./en/tools/git-patch/");
  for (const [input, code] of [
    [PATCH_SAMPLE.replace("@@ -1,2 +1,3 @@", "@@ -1,9 +1,3 @@"), "SYNTAX"],
    ["diff --git a/x b/x\nnew file mode 100644\nindex 0000000..64700d8\n", "SYNTAX"],
    ["diff --git a/x b/x\nGIT binary patch\nliteral 1\nA\n", "UNSUPPORTED"],
    ["diff --cc a\n", "UNSUPPORTED"],
    ["diff --git a/x b/x\nold mode 100644\nnew mode 100755\n".repeat(51), "LIMIT"],
  ]) {
    await page.locator("#git-patch-input").fill(input!);
    await expect(page.getByRole("alert")).toHaveText(patchMessages.en[`errors.PATCH_${code}` as keyof typeof patchMessages.en]);
    await expect(page.getByTestId("patch-result")).toHaveCount(0);
  }
  await page.getByTestId("patch-sample").click();
  const prevented = await page.locator("#git-patch-input").evaluate((element) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(65537) } });
    element.dispatchEvent(event); return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(page.getByTestId("patch-result")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await page.getByTestId("patch-clear").click(); await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByTestId("patch-sample").click(); await expect(page.getByTestId("patch-result")).toBeVisible();
});
