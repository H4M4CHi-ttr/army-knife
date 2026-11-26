import { readFile } from "node:fs/promises";
import { expect, test, type Route } from "@playwright/test";
import { parsePublicAssets } from "../../scripts/public-assets";
import { csvKeyDiffMessages } from "../../src/i18n/csv-key-diff";

const specimen = "SYNTHETIC_CSV_KEY_DIFF_9427";
const titles = {
  en: "CSV/TSV key diff",
  ja: "CSV・TSV キー差分",
  "zh-CN": "CSV/TSV 键值差异",
  "zh-TW": "CSV/TSV 鍵值差異",
  ko: "CSV/TSV 키 비교",
};

for (const [locale, title] of Object.entries(titles)) {
  test(`CSV/TSV key comparison, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const response = await page.goto(`./${locale}/tools/csv-key-diff/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(title);
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#csv-key-diff-before")).toHaveValue("");
    await expect(page.getByTestId("csv-key-diff-result")).toHaveCount(0);

    await page.getByTestId("csv-key-diff-sample").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("checkbox", { name: "id", exact: true })).toBeChecked();
    await expect(page.getByTestId("csv-key-diff-summary")).toBeVisible();
    const rows = page.getByTestId("csv-key-diff-row");
    await expect(rows).toHaveCount(3);
    await expect.poll(() => rows.evaluateAll(elements => elements.map(element => element.getAttribute("data-change"))))
      .toEqual(["updated", "removed", "added"]);
    await expect(rows.and(page.locator('[data-change="removed"]'))).toContainText("002");
    const updated = rows.and(page.locator('[data-change="updated"]'));
    await expect(updated).toContainText("001");
    await expect(updated).toContainText("legacy");
    await expect(updated).toContainText("region");
    await expect(rows.and(page.locator('[data-change="added"]'))).toContainText("003");
    const columns = page.getByTestId("csv-key-diff-columns");
    await expect(columns.locator('[data-change="removed"] code')).toHaveText("legacy");
    await expect(columns.locator('[data-change="added"] code')).toHaveText("region");

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
        const name = `csv-key-diff-${locale}-${theme}-${testInfo.project.name.slice(9)}`;
        const path = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" ? `docs/screenshots/${name}.png` : undefined;
        await testInfo.attach(name, {
          body: await page.screenshot({ fullPage: true, animations: "disabled", path }),
          contentType: "image/png",
        });
      }
    }
  });
}

test("mixed CSV and TSV compare exact composite keys despite row and column reordering", async ({ page }) => {
  await page.goto("./en/tools/csv-key-diff/");
  await page.locator("#csv-key-diff-before-format").selectOption("csv");
  await page.locator("#csv-key-diff-after-format").selectOption("tsv");
  await page.locator("#csv-key-diff-before").fill("id,area,status\n001,A,old\n1,A,keep\n001,B,keep\n9007199254740993,C,keep");
  await page.locator("#csv-key-diff-after-file").setInputFiles({
    name: "synthetic-after.tsv",
    mimeType: "text/tab-separated-values",
    buffer: Buffer.from("status\tarea\tid\nkeep\tC\t9007199254740993\nkeep\tB\t001\nkeep\tA\t1\nnew\tA\t001"),
  });
  const result = page.getByTestId("csv-key-diff-result");
  await expect(result).toHaveCount(0);
  await page.getByRole("checkbox", { name: "id", exact: true }).check();
  await expect(page.getByRole("alert")).toBeVisible();
  const area = page.getByRole("checkbox", { name: "area", exact: true });
  await area.focus();
  await page.keyboard.press("Space");
  await expect(area).toBeChecked();
  const row = page.getByTestId("csv-key-diff-row");
  await expect(row).toHaveCount(1);
  await expect(row).toHaveAttribute("data-change", "updated");
  await expect(row).toContainText("001");
  await expect(row).toContainText("old");
  await expect(row).toContainText("new");
});

test("malformed tables and ambiguous or incomplete keys suppress results and download", async ({ page }) => {
  await page.goto("./en/tools/csv-key-diff/");
  const after = page.locator("#csv-key-diff-after");
  const messages = csvKeyDiffMessages.en;
  for (const [invalid, error] of [
    ["id,name\n001,Ada\n001,Ben", "CSV_DIFF_DUPLICATE_KEY"],
    ["id,name\n,Ada", "CSV_DIFF_EMPTY_KEY"],
    ["id,name\n001", "CSV_DIFF_WIDTH"],
    ["external_id,name\n001,Ada", "CSV_DIFF_MISSING_KEY"],
    ["id,id\n001,Ada", "CSV_DIFF_HEADER"],
    ["id,name\n001,\"unclosed", "CSV_DIFF_MALFORMED"],
  ] as const) {
    await page.getByTestId("csv-key-diff-sample").click();
    await expect(page.getByTestId("csv-key-diff-result")).toBeVisible();
    await after.fill(invalid);
    await expect(page.getByRole("alert")).toContainText(messages[`errors.${error}`]);
    await expect(page.getByTestId("csv-key-diff-result")).toHaveCount(0);
    await expect(page.getByTestId("csv-key-diff-download")).toHaveCount(0);
  }
  await page.getByTestId("csv-key-diff-clear").click();
  await expect(page.locator("#csv-key-diff-before")).toHaveValue("");
  await expect(after).toHaveValue("");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("deferred comparison supports cancellation, manual apply and result invalidation", async ({ page, context }) => {
  await page.clock.install({ time: new Date("2026-11-26T00:00:00Z") });
  await page.goto("./en/tools/csv-key-diff/");
  await page.clock.pauseAt(new Date("2026-11-26T00:01:00Z"));
  await page.getByTestId("csv-key-diff-sample").click();
  const result = page.getByTestId("csv-key-diff-result");
  await expect(result).toBeVisible();

  const after = page.locator("#csv-key-diff-after");
  const largeValue = "x".repeat(8192);
  await after.fill(`id,name,region\n001,${largeValue},UK`);
  const control = page.getByTestId("apply-control");
  await expect(control).toHaveAttribute("data-status", "pending");
  await expect(result).toHaveCount(0);
  await page.getByTestId("csv-key-diff-cancel").click();
  await page.clock.fastForward(1000);
  await expect(control).toHaveAttribute("data-status", "cancelled");
  await expect(result).toHaveCount(0);

  await page.getByTestId("auto-apply-toggle").uncheck();
  await after.fill(`id,name,region\n001,${largeValue},EU`);
  await page.clock.fastForward(1000);
  await expect(result).toHaveCount(0);
  // Hold the actual worker module request so cancellation can happen before a reply.
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
    await expect(result).toHaveCount(0);
  } finally {
    await context.unroute(workerModule, holdWorker);
    // Terminating the worker may already have closed its intercepted request.
    await heldWorker?.continue().catch(() => {});
  }
  await page.clock.fastForward(1000);
  await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").click();
  await expect(result).toBeVisible();
  await expect(result.getByText("x".repeat(160) + "…", { exact: true })).toBeVisible();
  await expect(result.getByText(csvKeyDiffMessages.en["csvDiff.previewLimited"])).toBeVisible();

  await after.fill(`id,name,region\n001,${largeValue},UK`);
  await expect(result).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").check();
  await expect(control).toHaveAttribute("data-status", "pending");
  await page.clock.fastForward(799);
  await expect(result).toHaveCount(0);
  await page.clock.fastForward(1);
  await expect(result).toBeVisible();
});

test("downloads the complete quoted report and keeps synthetic input in memory", async ({ page, context, baseURL }) => {
  const allowed = parsePublicAssets(await readFile("dist/public-assets.json", "utf8"));
  const requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[] = [];
  const diagnostics: string[] = [];
  context.on("request", request => requests.push({
    url: request.url(), method: request.method(), headers: request.headers(), body: request.postData(),
  }));
  page.on("pageerror", error => diagnostics.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" || message.text().includes(specimen)) diagnostics.push(message.text());
  });
  page.on("websocket", socket => diagnostics.push(socket.url()));
  await page.goto("./en/tools/csv-key-diff/");

  const before = page.locator("#csv-key-diff-before");
  const after = page.locator("#csv-key-diff-after");
  const result = page.getByTestId("csv-key-diff-result");
  await before.fill(`id,name\n001,"<em>${specimen}</em>, ""quoted"""\n002,Lin`);
  await after.fill("id,name\n001,=1+1\n003,Jo");
  await page.getByRole("checkbox", { name: "id", exact: true }).check();
  await expect(result).toBeVisible();
  await expect(result).toContainText(`<em>${specimen}</em>`);
  await expect(result.locator("em")).toHaveCount(0);

  const pending = page.waitForEvent("download");
  await page.getByTestId("csv-key-diff-download").click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("csv-key-diff.csv");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toBe([
    "kind,change,row,column,before,after",
    'key,updated,1,"id","001","001"',
    `cell,updated,1,"name","<em>${specimen}</em>, ""quoted""","'=1+1"`,
    'key,removed,2,"id","002",',
    'cell,removed,2,"name","Lin",',
    'key,added,3,"id",,"003"',
    'cell,added,3,"name",,"Jo"',
    "",
  ].join("\r\n"));

  expect(JSON.stringify(await page.evaluate(() => ({
    local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie,
  })))).not.toContain(specimen);
  await page.reload();
  await expect(before).toHaveValue("");
  await expect(after).toHaveValue("");
  await expect(result).toHaveCount(0);
  for (const request of requests) {
    const url = new URL(request.url);
    expect(url.origin).toBe(new URL(baseURL!).origin);
    expect(url.search).toBe("");
    expect(allowed.has(url.pathname)).toBe(true);
    expect(request.method).toBe("GET");
    expect(request.body).toBeNull();
  }
  expect(JSON.stringify(requests)).not.toContain(specimen);
  expect(diagnostics).toEqual([]);
});
