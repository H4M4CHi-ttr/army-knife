import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Route } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { gitignoreMessages } from "../../src/i18n/gitignore";

const marker = "SYNTHETIC_GITIGNORE_PRIVATE_7396";
const titles = {
  en: ".gitignore rule tester", ja: ".gitignore ルールテスター", "zh-CN": ".gitignore 规则测试器",
  "zh-TW": ".gitignore 規則測試器", ko: ".gitignore 규칙 테스터",
};

for (const [locale, title] of Object.entries(titles)) {
  test(`gitignore sample, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const response = await page.goto(`./${locale}/tools/gitignore/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(title);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#gitignore-rules")).toHaveValue("");
    await expect(page.locator("#gitignore-paths")).toHaveValue("");
    await page.getByTestId("gitignore-sample").focus();
    await page.keyboard.press("Enter");
    const rows = page.getByTestId("gitignore-row");
    await expect(rows).toHaveCount(5);
    await expect(rows.nth(0)).toHaveAttribute("data-status", "ignored");
    await expect(rows.nth(0)).toContainText("build/keep.txt");
    await expect(rows.nth(0).locator("p code")).toHaveText(["build/", "build/"]);
    await expect(rows.nth(2)).toHaveAttribute("data-status", "included");
    await expect(rows.nth(2)).toContainText("!keep.log");
    await expect(rows.nth(3)).toHaveAttribute("data-status", "ignored");
    await expect(rows.nth(3)).toContainText("/docs/**/draft?.md");
    await expect(rows.nth(4)).toHaveAttribute("data-status", "included");

    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click();
      await page.getByTestId(`theme-${theme}`).click();
      await page.getByTestId("settings-close").click();
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const desktop = locale === "en" && theme === "light" && testInfo.project.name === "chromium-desktop";
      const narrow = locale === "ja" && theme === "dark" && testInfo.project.name === "chromium-small";
      if (desktop || narrow) {
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          window.scrollTo(0, 0);
        });
        const name = `gitignore-${locale}-${theme}-${testInfo.project.name.slice(9)}`;
        const path = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" ? `docs/screenshots/${name}.png` : undefined;
        await testInfo.attach(name, {
          body: await page.screenshot({ fullPage: true, animations: "disabled", path }),
          contentType: "image/png",
        });
      }
    }
  });
}

async function paste(input: Locator, text: string) {
  await input.evaluate((element: HTMLTextAreaElement, pasted) => {
    element.select();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => pasted } });
    element.dispatchEvent(event);
  }, text);
}

test("Windows mode, malformed rules, invalid paths and CRLF pastes", async ({ page }) => {
  await page.goto("./en/tools/gitignore/");
  const rules = page.locator("#gitignore-rules");
  const paths = page.locator("#gitignore-paths");
  const rows = page.getByTestId("gitignore-row");
  await paste(rules, "\uFEFF# example\r\n[malformed\r\ncache/\r\n!cache/keep.txt");
  await expect(rules).toBeEditable();
  await expect(rules).toHaveValue("\uFEFF# example\n[malformed\ncache/\n!cache/keep.txt");
  await paste(paths, "cache\\keep.txt\r\nC:\\code\\one.txt\r\n../error");
  await expect(paths).toBeEditable();
  await expect(rows.first()).toHaveAttribute("data-status", "included");
  await expect(rows.nth(2)).toHaveAttribute("data-status", "invalid");
  const windows = page.getByTestId("gitignore-windows");
  await windows.focus();
  await page.keyboard.press("Space");
  await expect(windows).toBeChecked();
  await expect(rows.first()).toHaveAttribute("data-status", "ignored");
  await expect(rows.first()).toContainText("Rule on line 3");
  await expect(rows.nth(1)).toHaveAttribute("data-status", "invalid");
  await expect(page.getByTestId("gitignore-invalid-rules")).toHaveText("Malformed patterns skipped on lines 2.");
  await paste(rules, "é".repeat(32768) + "\r\n");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(rows).toHaveCount(0);
  await rules.fill("cache/\n!cache/\n!cache/keep.txt");
  await expect(rows.first()).toHaveAttribute("data-status", "included");
});

test("deferred matching supports auto-apply, manual execution and both kinds of cancellation", async ({ page, context }) => {
  await page.clock.install({ time: new Date("2026-11-27T00:00:00Z") });
  await page.goto("./en/tools/gitignore/");
  await page.clock.pauseAt(new Date("2026-11-27T00:01:00Z"));
  await page.getByTestId("gitignore-sample").click();
  const result = page.getByTestId("gitignore-result");
  await expect(result).toBeVisible();
  const paths = page.locator("#gitignore-paths");
  const data = Array.from({ length: 40 }, (_, index) => `build/${index}-${"x".repeat(50)}.txt`).join("\n");
  await paths.fill(data);
  const control = page.getByTestId("apply-control");
  await expect(control).toHaveAttribute("data-status", "pending");
  await expect(result).toHaveCount(0);
  await page.getByTestId("gitignore-cancel").click();
  await page.clock.fastForward(1000);
  await expect(control).toHaveAttribute("data-status", "cancelled");
  await expect(result).toHaveCount(0);

  await page.getByTestId("auto-apply-toggle").uncheck();
  await paths.fill(data + "\nbuild/last.txt");
  await page.clock.fastForward(1000);
  await expect(control).toHaveAttribute("data-status", "manual");
  const workerModule = /\/inspectors\.worker-[^/]+\.js$/;
  let heldWorker: Route | undefined;
  const holdWorker = (route: Route) => { heldWorker = route; };
  await context.route(workerModule, holdWorker);
  try {
    await page.getByTestId("apply-now").focus();
    await page.keyboard.press("Enter");
    await expect(control).toHaveAttribute("data-status", "running");
    await expect.poll(() => heldWorker?.request().url()).toMatch(workerModule);
    await control.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(control).toHaveAttribute("data-status", "cancelled");
  } finally {
    await context.unroute(workerModule, holdWorker);
    await heldWorker?.continue().catch(() => {});
  }
  await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").click();
  await expect(page.getByTestId("gitignore-preview")).toContainText("first 32 of 41 paths");

  await paths.fill(data);
  await expect(result).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").check();
  await expect(control).toHaveAttribute("data-status", "pending");
  await page.clock.fastForward(799);
  await expect(result).toHaveCount(0);
  await page.clock.fastForward(1);
  await expect(page.getByTestId("gitignore-preview")).toContainText("first 32 of 40 paths");
  await expect(page.getByTestId("gitignore-row")).toHaveCount(32);
});

test("exports the complete report and restricts requests and storage to app assets and preferences", async ({ page, context, baseURL }) => {
  const allowed = parsePublicAssets(await readFile("dist/public-assets.json", "utf8"));
  const requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [];
  const diagnostics: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", event => console.error(event.violatedDirective));
  });
  context.on("request", request => requests.push({
    url: request.url(), method: request.method(), headers: request.headers(), body: request.postData(),
  }));
  page.on("pageerror", error => diagnostics.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" || message.text().includes(marker)) diagnostics.push(message.text());
  });
  page.on("websocket", socket => diagnostics.push(socket.url()));
  await page.goto("./en/tools/gitignore/");

  const rules = page.locator("#gitignore-rules");
  const paths = page.locator("#gitignore-paths");
  const result = page.getByTestId("gitignore-result");
  const path = `<em>${marker}<em>.tmp`;
  await rules.fill("*.tmp\n!" + path);
  const many = Array.from({ length: 39 }, (_, index) => `plain-${index}-${"p".repeat(50)}.tmp`);
  await paths.fill([...many, path].join("\n"));
  await expect(result.getByRole("heading", { level: 2 })).toHaveText("39 ignored · 1 included · 0 invalid");
  const pending = page.waitForEvent("download");
  await page.getByTestId("gitignore-download").click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("gitignore-results.json");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  const report = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(report.counts).toEqual({ ignored: 39, included: 1, invalid: 0 });
  expect(report.rows).toHaveLength(40);
  expect(report.rows.at(-1)).toEqual({ row: 40, path, status: "included", rule: { line: 2, pattern: "!" + path } });

  await paths.fill(path);
  await expect(result).toContainText(path);
  await expect(result.locator("em")).toHaveCount(0);
  const clientState = await page.evaluate(() => ({
    local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie,
  }));
  expect(Object.keys(clientState.local).every(key => key === "army-knife:preferences:v1")).toBe(true);
  expect(clientState.session).toEqual({});
  expect(JSON.stringify(clientState)).not.toContain(marker);
  await page.reload();
  await expect(rules).toHaveValue("");
  await expect(paths).toHaveValue("");
  await expect(result).toHaveCount(0);
  await expect(page.getByTestId("gitignore-windows")).not.toBeChecked();
  for (const request of requests) {
    const url = new URL(request.url);
    expect(url.origin).toBe(new URL(baseURL!).origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname)).toBe(true);
    expect(request.method).toBe("GET");
    expect(request.body).toBeNull();
  }
  expect(JSON.stringify(requests)).not.toContain(marker);
  expect(diagnostics).toEqual([]);
});

test("line limit errors invalidate the result on an edit", async ({ page }) => {
  await page.goto("./en/tools/gitignore/");
  await page.getByTestId("gitignore-sample").click();
  const paths = page.locator("#gitignore-paths");
  await expect(page.getByTestId("gitignore-result")).toBeVisible();
  await paths.fill("é".repeat(257));
  await expect(page.getByRole("alert")).toHaveText(gitignoreMessages.en["errors.GITIGNORE_LINE_LIMIT"]);
  await expect(page.getByTestId("gitignore-download")).toHaveCount(0);
});
