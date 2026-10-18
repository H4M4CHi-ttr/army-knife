import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base, expect, type Page, type Request, type TestInfo } from "@playwright/test";

const PRIVATE_MARKER = "PRIVATE_INPUT_M4RKR_7261";
const PREFERENCE_KEY = "army-knife:preferences:v1";

async function staticAssetPaths(directory: string, prefix = "/army-knife/"): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const pathname = `${prefix}${entry.name}`;
      if (entry.isDirectory())
        return staticAssetPaths(resolve(directory, entry.name), `${pathname}/`);
      return entry.isFile() ? [pathname] : [];
    }),
  );
  return nested.flat();
}

// Exact build outputs, not a permissive path pattern: a GET with user data
// encoded in a made-up asset filename must also fail the privacy gate.
let allowedPaths: Promise<Set<string>> | undefined;
function assetAllowlist(): Promise<Set<string>> {
  allowedPaths ??= staticAssetPaths(resolve(process.cwd(), "dist")).then(
    (paths) =>
      new Set([
        ...paths,
        ...paths.filter((path) => path.endsWith("/index.html")).map((path) => path.slice(0, -10)),
      ]),
  );
  return allowedPaths;
}

interface NetworkAudit {
  requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[];
  sockets: string[];
  errors: string[];
}

const test = base.extend<{ networkAudit: NetworkAudit }>({
  networkAudit: [
    async ({ context, page, baseURL }, use) => {
      const audit: NetworkAudit = { requests: [], sockets: [], errors: [] };
      const requestListener = (request: Request): void => {
        audit.requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          body: request.postData(),
        });
      };
      context.on("request", requestListener);
      page.on("websocket", (socket) => audit.sockets.push(socket.url()));
      page.on("pageerror", (error) => audit.errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") audit.errors.push(message.text());
      });
      await use(audit);
      context.off("request", requestListener);
      const origin = new URL(baseURL as string).origin;
      const assets = await assetAllowlist();
      for (const request of audit.requests) {
        const url = new URL(request.url);
        if (url.protocol === "blob:" || url.protocol === "data:") continue;
        expect(url.origin, `Unexpected network origin: ${request.url}`).toBe(origin);
        expect(request.method, `Unexpected network method: ${request.url}`).toBe("GET");
        expect(url.search, `App assets must have fixed URLs: ${request.url}`).toBe("");
        expect(
          assets.has(url.pathname),
          `Only exact build assets may be requested: ${request.url}`,
        ).toBe(true);
        expect(
          JSON.stringify(request),
          "User input appeared in a URL, header, or request body",
        ).not.toContain(PRIVATE_MARKER);
        expect(request.body).toBeNull();
      }
      expect(audit.sockets, "The app must not open WebSockets").toEqual([]);
      expect(audit.errors, "Unexpected browser runtime or loading errors").toEqual([]);
    },
    { auto: true },
  ],
});

async function dashboard(page: Page): Promise<void> {
  await page.goto("./en/");
  await expect(page.getByTestId("tool-card-csv")).toBeVisible();
}

async function tool(page: Page, id: string): Promise<void> {
  await page.goto(`./en/tools/${id}/`);
  const inputId = id.startsWith("json-")
    ? "json-left"
    : id === "sets"
      ? "sets-left"
      : id === "env"
        ? "env-left"
        : `${id}-input`;
  await expect(page.locator(`#${inputId}`)).toBeVisible();
}

async function settings(page: Page): Promise<void> {
  await page.getByTestId("settings-button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function enableTool(page: Page, id: string): Promise<void> {
  await settings(page);
  const toggle = page.getByTestId(`toggle-${id}`);
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("settings-close").click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}

async function downloadResult(page: Page): Promise<string> {
  const button = page.getByRole("button", { name: "Download", exact: true });
  await expect(button).toBeEnabled();
  const downloadEvent = page.waitForEvent("download");
  await button.click();
  const download = await downloadEvent;
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  expect(path).not.toBeNull();
  return readFile(path as string, "utf8");
}

async function assertNoOverflow(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(
    geometry.content,
    `Viewport ${geometry.width}px has page-level horizontal overflow`,
  ).toBeLessThanOrEqual(geometry.width + 1);
}

async function screenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  // Input and download actions can scroll the viewport or a result table.
  // Normalize the review capture so fixed/sticky UI stays at the page's top.
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    for (const table of document.querySelectorAll(".table-scroll")) table.scrollLeft = 0;
  });
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

test("DevToys tools start off and deliberate settings survive reload", async ({ page }) => {
  await dashboard(page);
  for (const id of ["sets", "json-format", "contrast"])
    await expect(page.getByTestId(`tool-card-${id}`)).toHaveCount(0);
  await enableTool(page, "json-format");
  await expect(page.getByTestId("tool-card-json-format")).toBeVisible();
  await settings(page);
  await page.getByTestId("theme-dark").click();
  await page.getByTestId("locale-select").selectOption("ja");
  await expect(page).toHaveURL(/\/army-knife\/ja\/$/);
  await expect(page.getByTestId("tool-card-json-format")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByTestId("tool-card-json-format")).toBeVisible();
  await expect(page.getByTestId("tool-card-contrast")).toHaveCount(0);
  await settings(page);
  await page.getByTestId("toggle-json-format").click();
  await page.getByTestId("settings-close").click();
  await page.evaluate(() => document.fonts.ready);
  await page.reload();
  await expect(page.getByTestId("tool-card-json-format")).toHaveCount(0);
});

test("CSV and log tools execute the real WASM module and retain exact string values", async ({
  page,
  networkAudit,
}) => {
  await tool(page, "csv");
  const literalHtml = `<img src=https://example.invalid/${PRIVATE_MARKER}>`;
  await page
    .locator("#csv-input")
    .fill(
      `id,name,amount\n9007199254740993,${PRIVATE_MARKER},10\n2,"quoted, cell",\n3,${literalHtml},20`,
    );
  const csv = JSON.parse(await downloadResult(page));
  expect(csv.operation).toBe("csv");
  expect(csv.rows).toBe(3);
  expect(csv.columns).toBe(3);
  expect(csv.profiles[2].empty).toBe(1);
  expect(csv.preview[0][0]).toBe("9007199254740993");
  expect(csv.preview[1][1]).toBe("quoted, cell");
  expect(csv.preview[2][1]).toBe(literalHtml);
  await expect(page.locator('img[src*="example.invalid"]')).toHaveCount(0);
  expect(
    networkAudit.requests.some((request) => new URL(request.url).pathname.endsWith(".wasm")),
  ).toBe(true);
  await assertNoOverflow(page);

  await tool(page, "logs");
  await page
    .locator("#logs-input")
    .fill(`INFO ${PRIVATE_MARKER}\nERROR repeated\nWARN caution\nERROR repeated`);
  const logs = JSON.parse(await downloadResult(page));
  expect(logs.operation).toBe("logs");
  expect(logs.totalLines).toBe(4);
  expect(logs.matchedLines).toBe(4);
  expect(logs.levels).toMatchObject({ info: 1, error: 2, warn: 1 });
  expect(logs.topLines[0]).toMatchObject({ text: "ERROR repeated", count: 2 });
  await assertNoOverflow(page);
});

test("list operations require opting in and return complete local results", async ({ page }) => {
  await dashboard(page);
  await enableTool(page, "sets");
  await tool(page, "sets");
  await page.locator("#sets-left").fill(`alpha\nbeta\nbeta\n${PRIVATE_MARKER}`);
  await page.locator("#sets-right").fill(`beta\ngamma\n${PRIVATE_MARKER}`);
  expect(await downloadResult(page)).toBe(`beta\n${PRIVATE_MARKER}`);
});

test("CIDR and Unicode report meaningful boundaries and discard stale results", async ({
  page,
}, testInfo) => {
  await tool(page, "cidr");
  await page.locator("#cidr-input").fill("::/0");
  const ipv6 = JSON.parse(await downloadResult(page));
  expect(ipv6.addressCount).toBe("340282366920938463463374607431768211456");
  expect(ipv6.broadcast).toBeNull();
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "subnet-ipv6");
  await page.locator("#cidr-input").fill("192.0.2.10/31");
  await expect(page.locator(".cidr-network code")).toHaveText("192.0.2.10/31");
  const pointToPoint = JSON.parse(await downloadResult(page));
  expect(pointToPoint.usableHostCount).toBe("2");

  await tool(page, "unicode");
  await page.locator("#unicode-input").fill(`A😀\r\nB\u200b${PRIVATE_MARKER}\u202e`);
  const unicode = JSON.parse(await downloadResult(page));
  expect(unicode.totalFindings).toBe(2);
  expect(unicode.findings[0]).toMatchObject({ codePoint: "U+200B", line: 2, column: 2 });
  expect(unicode.findings[1].kind).toBe("bidi");
  expect(unicode.visualized).not.toContain("\u202e");
  await assertNoOverflow(page);
});

test("JSON diff respects structure, escapes pointers, and rejects lossy numbers", async ({
  page,
}) => {
  await tool(page, "json-diff");
  await page.locator("#json-left").fill(`{"a/b":{"~value":1},"marker":"${PRIVATE_MARKER}"}`);
  await page.locator("#json-right").fill(`{"marker":"${PRIVATE_MARKER}","a/b":{"~value":2}}`);
  const result = JSON.parse(await downloadResult(page));
  expect(result.changes).toEqual([{ kind: "replace", path: "/a~1b/~0value", before: 1, after: 2 }]);
  await page.locator("#json-left").fill('{"id":9007199254740993}');
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText(/precision|preserved safely/i);
});

test("only preferences persist; input text never enters storage or location", async ({ page }) => {
  await dashboard(page);
  await settings(page);
  await page.getByTestId("theme-light").click();
  await page.getByTestId("settings-close").click();
  await tool(page, "unicode");
  await page.locator("#unicode-input").fill(`secret = "${PRIVATE_MARKER}";\u200b`);
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
  const storage = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    href: location.href,
  }));
  expect(Object.keys(storage.local)).toEqual([PREFERENCE_KEY]);
  expect(Object.keys(JSON.parse(storage.local[PREFERENCE_KEY] as string)).sort()).toEqual([
    "autoApply",
    "enabledTools",
    "favorites",
    "knownTools",
    "locale",
    "searchMode",
    "theme",
    "version",
  ]);
  expect(storage.session).toEqual({});
  expect(JSON.stringify(storage)).not.toContain(PRIVATE_MARKER);
  await page.reload();
  await expect(page.locator("#unicode-input")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});

test("all five languages load the correct local UI and programming fonts", async ({ page }) => {
  await dashboard(page);
  const cases = [
    {
      locale: "en",
      sans: "Noto Sans Variable",
      mono: "Army Knife Mono J",
      text: "const value = 42;",
    },
    {
      locale: "ja",
      sans: "Noto Sans JP Variable",
      mono: "Army Knife Mono J",
      text: "日本語とひらがな",
    },
    {
      locale: "zh-CN",
      sans: "Noto Sans SC Variable",
      mono: "Army Knife Mono SC",
      text: "简体中文与数据",
    },
    {
      locale: "zh-TW",
      sans: "Noto Sans TC Variable",
      mono: "Army Knife Mono TC",
      text: "繁體中文與資料",
    },
    { locale: "ko", sans: "Noto Sans KR Variable", mono: "Army Knife Mono K", text: "한글과자료" },
  ];
  for (const entry of cases) {
    await settings(page);
    const previous = await page.getByTestId("locale-select").inputValue();
    await page.getByTestId("locale-select").selectOption(entry.locale);
    if (previous === entry.locale) await page.getByTestId("settings-close").click();
    await expect(page).toHaveURL(new RegExp(`/army-knife/${entry.locale}/$`));
    await expect(page.locator("html")).toHaveAttribute("lang", entry.locale);
    await expect(page.locator(`link[data-font-locale="${entry.locale}"]`)).toHaveAttribute(
      "media",
      "all",
    );
    const loaded = await page.evaluate(async ({ sans, mono, text }) => {
      const ui = await document.fonts.load(`16px "${sans}"`, text);
      const code = await document.fonts.load(`16px "${mono}"`, text);
      return {
        ui: ui.map((font) => font.status),
        code: code.map((font) => font.status),
        family: getComputedStyle(document.documentElement).getPropertyValue("--font-mono"),
      };
    }, entry);
    expect(loaded.ui.length).toBeGreaterThan(0);
    expect(loaded.code.length).toBeGreaterThan(0);
    expect(loaded.ui.every((status) => status === "loaded")).toBe(true);
    expect(loaded.code.every((status) => status === "loaded")).toBe(true);
    expect(loaded.family).toContain(entry.mono);
  }
});

test("settings are keyboard accessible and restore focus on Escape", async ({ page }) => {
  await dashboard(page);
  const trigger = page.getByTestId("settings-button");
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 16; index += 1) {
    await page.keyboard.press(index % 3 === 0 ? "Shift+Tab" : "Tab");
    await expect
      .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("light and dark workbenches fit the viewport and produce review screenshots", async ({
  page,
}, testInfo) => {
  await dashboard(page);
  await expect(page.locator('link[data-font-locale="en"]')).toHaveAttribute("media", "all");
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "dashboard-light");
  await settings(page);
  await page.getByTestId("theme-dark").click();
  await page.getByTestId("settings-close").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "dashboard-dark");
});

test("delayed apply counts down, restarts on edits, and applies the latest input automatically", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-10-11T12:00:00Z") });
  await tool(page, "json-diff");
  await page.clock.pauseAt(new Date("2026-10-11T12:10:00Z"));
  const longValue = "x".repeat(9_000);
  await page.locator("#json-left").fill(JSON.stringify({ value: longValue, revision: 1 }));
  await page.locator("#json-right").fill(JSON.stringify({ value: longValue, revision: 2 }));
  const control = page.getByTestId("apply-control");
  const apply = page.getByTestId("apply-now");
  await expect(control).toHaveAttribute("data-mode", "deferred");
  await expect(control).toHaveAttribute("data-status", "pending");
  await expect(apply).toContainText("0.8s");
  await page.clock.runFor(400);
  await expect(apply).toContainText("0.4s");
  await expect(page.locator(".apply-progress")).toHaveAttribute("style", /scaleX\(0\.5\)/);
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "auto-apply-countdown");
  await page.locator("#json-right").fill(JSON.stringify({ value: longValue, revision: 3 }));
  await expect(apply).toContainText("0.8s");
  await page.clock.runFor(799);
  await expect(page.locator(".result-panel")).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(control).toHaveAttribute("data-status", "applied");
  const result = JSON.parse(await downloadResult(page));
  expect(result.changes).toEqual([{ kind: "replace", path: "/revision", before: 1, after: 3 }]);
});

test("manual mode persists, a manual apply bypasses waiting, and stale results cannot be downloaded", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-11T12:00:00Z") });
  await tool(page, "logs");
  await page.clock.pauseAt(new Date("2026-10-11T12:10:00Z"));
  await page.getByTestId("auto-apply-toggle").uncheck();
  await page.locator("#logs-input").fill(`INFO ${PRIVATE_MARKER}\nERROR first`);
  await page.clock.runFor(2_000);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await page.getByTestId("apply-now").click();
  const first = JSON.parse(await downloadResult(page));
  expect(first.totalLines).toBe(2);
  await page.locator("#logs-input").fill("WARN replacement");
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await page.getByTestId("auto-apply-toggle").check();
  await page.clock.runFor(320);
  await expect(page.getByTestId("apply-now")).toContainText("0.5s");
  await page.getByTestId("apply-now").click();
  const latest = JSON.parse(await downloadResult(page));
  expect(latest.totalLines).toBe(1);
  expect(latest.levels.warn).toBe(1);
  await page.clock.runFor(2_000);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "applied");
  await page.getByTestId("auto-apply-toggle").uncheck();
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).autoApply, PREFERENCE_KEY),
  ).toBe(false);
  await page.clock.resume();
  await page.reload();
  await expect(page.getByTestId("auto-apply-toggle")).not.toBeChecked();
  await expect(page.locator("#logs-input")).toHaveValue("");
});

test("HAR analysis runs in real WASM and treats unknown sizes as unknown", async ({
  page,
}, testInfo) => {
  await tool(page, "har");
  await page.locator("#har-input").fill(
    JSON.stringify({
      log: {
        version: "1.2",
        entries: [
          {
            request: {
              method: "GET",
              url: `https://example.invalid/page?secret=${PRIVATE_MARKER}`,
            },
            response: {
              status: 200,
              headersSize: 100,
              bodySize: 900,
              content: { mimeType: "text/html" },
            },
            time: 120,
          },
          {
            request: { method: "POST", url: "https://api.example.invalid/upload" },
            response: {
              status: 503,
              headersSize: 80,
              bodySize: 0,
              content: { mimeType: "application/json" },
            },
            time: 800,
          },
          {
            request: { method: "GET", url: "https://example.invalid/cached" },
            response: {
              status: 304,
              headersSize: -1,
              bodySize: 0,
              content: { mimeType: "text/html" },
            },
            time: 2,
          },
        ],
      },
    }),
  );
  const result = JSON.parse(await downloadResult(page));
  expect(result.operation).toBe("har");
  expect(result.requests).toBe(3);
  expect(result.httpErrors).toBe(1);
  expect(result.responseTransfer).toEqual({
    knownBytes: "1080",
    knownEntries: 2,
    unknownEntries: 1,
  });
  expect(result.hosts[0].key).toBe("example.invalid");
  expect(result.slowest[0]).toMatchObject({ method: "POST", timeMs: 800, status: 503 });
  await expect(page.getByTestId("har-result")).toContainText("Partial size total");
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "har-analysis");
});

test("dotenv comparison shows missing keys and duplicates and keeps values hidden until requested", async ({
  page,
}, testInfo) => {
  await tool(page, "env");
  await page
    .locator("#env-left")
    .fill(`A=1\nDB_HOST=old\nDB_HOST=local\nSECRET=${PRIVATE_MARKER}\nONLY_LEFT=yes`);
  await page
    .locator("#env-right")
    .fill(`A=1\nDB_HOST=remote\nSECRET=${PRIVATE_MARKER}\nONLY_RIGHT=on`);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-mode", "instant");
  const result = JSON.parse(await downloadResult(page));
  expect(result.complete).toBe(true);
  expect(result.summary).toEqual({ "left-only": 1, "right-only": 1, changed: 1, equal: 2 });
  expect(result.left.duplicateKeys).toBe(1);
  expect(result.changes.find((entry: { key: string }) => entry.key === "DB_HOST").left.value).toBe(
    "local",
  );
  await expect(page.locator(".env-table")).not.toContainText('"local"');
  await page.getByTestId("env-reveal-values").check();
  await expect(page.locator(".env-table")).toContainText('"local"');
  await page.getByTestId("env-include-equal").check();
  await expect(page.locator(".env-table")).toContainText(PRIVATE_MARKER);
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "env-comparison");
  await page.locator("#env-left").fill("VALID=1\nnot an assignment");
  expect(JSON.parse(await downloadResult(page)).complete).toBe(false);
});

test("URL query edits update immediately and preserve repeated keys, order, and bare flags", async ({
  page,
}, testInfo) => {
  await tool(page, "url");
  await page
    .locator("#url-input")
    .fill("https://example.invalid:8443/a?tag=one&tag=two&q=hello+world&flag#frag");
  await expect(page.getByTestId("query-value-2")).toHaveValue("hello world");
  await page.getByTestId("query-value-1").fill("three & four");
  await expect(page.getByTestId("url-output")).toContainText("tag=one&tag=three+%26+four");
  await page.getByTestId("query-add").click();
  await page.getByTestId("query-key-4").fill("marker");
  await page.getByTestId("query-value-4").fill(PRIVATE_MARKER);
  await page.getByTestId("query-remove-0").click();
  const result = await downloadResult(page);
  const url = new URL(result);
  expect(url.searchParams.getAll("tag")).toEqual(["three & four"]);
  expect(url.searchParams.get("marker")).toBe(PRIVATE_MARKER);
  expect(url.hash).toBe("#frag");
  expect(result).toContain("&flag&marker=");
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "url-query-editor");
});

test("EXPLAIN JSON preserves per-loop metrics and ignores unrelated large integers without rounding", async ({
  page,
}, testInfo) => {
  await tool(page, "explain");
  const input = JSON.stringify([
    {
      Plan: {
        "Node Type": "Sort",
        "Plan Rows": 10,
        "Actual Rows": 100,
        "Actual Loops": 3,
        "Actual Total Time": 12,
        "Total Cost": 20,
        Plans: [
          {
            "Node Type": "Seq Scan",
            "Relation Name": PRIVATE_MARKER,
            "Plan Rows": 10,
            "Actual Rows": 100,
            "Actual Loops": 3,
            "Actual Total Time": 10,
            "Total Cost": 18,
          },
        ],
      },
      "Planning Time": 1,
      "Execution Time": 13,
      "Query Identifier": "large-query-id",
    },
  ]).replace('"large-query-id"', "9007199254740993");
  await page.locator("#explain-input").fill(input);
  const result = JSON.parse(await downloadResult(page));
  expect(result.nodes).toHaveLength(2);
  expect(result.nodes[1]).toMatchObject({
    actualRows: 100,
    actualLoops: 3,
    rowRatio: 10,
    actualTotalTimeMs: 10,
  });
  expect(result.statements[0]).toMatchObject({ planningTimeMs: 1, executionTimeMs: 13 });
  await page.locator("#explain-filter").fill("Seq Scan");
  await expect(page.locator(".explain-nodes tbody tr")).toHaveCount(1);
  await page.locator("#explain-filter").fill("");
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "postgres-explain");
});

test("Vapor output reacts to language and color changes while VDOM settings stay accessible", async ({
  page,
}, testInfo) => {
  await dashboard(page);
  await enableTool(page, "contrast");
  await page.goto("./en/tools/contrast/");
  await expect(page.locator(".color-controls")).toBeVisible();
  await page.getByRole("textbox", { name: "Text color HEX", exact: true }).fill("#000000");
  await page.getByRole("textbox", { name: "Background color HEX", exact: true }).fill("#FFFFFF");
  expect(JSON.parse(await downloadResult(page))).toMatchObject({
    foreground: "#000000",
    background: "#FFFFFF",
    ratio: 21,
  });
  await settings(page);
  await page.getByTestId("locale-select").selectOption("ja");
  await expect(page).toHaveURL(/\/army-knife\/ja\/tools\/contrast\/$/);
  await page.locator('.color-controls input:not([type="color"])').nth(0).fill("#000000");
  await page.locator('.color-controls input:not([type="color"])').nth(1).fill("#FFFFFF");
  await expect(page.getByTestId("instant-updates")).toContainText("入力を即時反映");
  await expect(page.getByRole("button", { name: "コピー", exact: true })).toBeVisible();
  await expect(page.locator(".contrast-ratio strong")).toContainText("21.00");
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "contrast-vapor-ja");
});


test("large paste stays out of the live editor and the full text reaches local WASM", async ({
  page,
}, testInfo) => {
  await tool(page, "logs");
  await page.getByTestId("auto-apply-toggle").uncheck();
  const metrics = await page.locator("#logs-input").evaluate((node) => {
    const field = node as HTMLTextAreaElement;
    const content = "INFO " + "x".repeat(5 * 1024 * 1024 - 5);
    // Isolate native textarea DOM layout, then measure the new paste path.
    const raw = document.createElement("textarea");
    raw.className = field.className;
    raw.style.width = "500px";
    document.body.append(raw);
    const before = performance.now();
    raw.value = content;
    const nativeSet5MiBMs = performance.now() - before;
    // A 5 MiB, soft-wrapped single line can itself freeze the test runner
    // while computing scrollHeight. Probe native layout at a bounded size.
    raw.value = "x".repeat(128 * 1024);
    const layoutStart = performance.now();
    void raw.scrollHeight;
    const nativeLayout128KiBMs = performance.now() - layoutStart;
    raw.remove();
    // Firefox deliberately hides data placed on a synthetic ClipboardEvent.
    // A cancelable Event with a stubbed clipboardData exercises the same Vue
    // handler in both browsers without relying on synthetic clipboard access.
    const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, "clipboardData", {
      value: { getData: (type: string) => (type === "text/plain" ? content : "") },
    });
    const started = performance.now();
    field.dispatchEvent(event);
    return {
      characters: content.length,
      nativeSet5MiBMs,
      nativeLayout128KiBMs,
      interceptedPasteDispatchMs: performance.now() - started,
      preventedDomInsertion: event.defaultPrevented,
    };
  });
  expect(metrics.preventedDomInsertion).toBe(true);
  await expect(page.getByTestId("large-input-summary")).toBeVisible();
  await expect(page.getByTestId("large-input-loading")).toHaveCount(0);
  const chars = await page.locator("#logs-input").evaluate((node) =>
    (node as HTMLTextAreaElement).value.length,
  );
  expect(chars).toBeLessThanOrEqual(2_048);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "manual");
  await page.getByTestId("apply-now").click();
  const report = JSON.parse(await downloadResult(page));
  expect(report.totalLines).toBe(1);
  expect(report.topLines[0].text).toContain("INFO");
  await testInfo.attach("large-text-5mib-timing.json", {
    body: JSON.stringify({ ...metrics, previewCharacters: chars }, null, 2),
    contentType: "application/json",
  });
  await page.getByRole("button", { name: "Replace text" }).click();
  await expect(page.getByTestId("large-input-summary")).toHaveCount(0);
  await expect(page.locator("#logs-input")).toHaveValue("");
});

test("multi-line 1 MiB paste is bounded while preserving all original lines", async ({ page }) => {
  await tool(page, "logs");
  await page.getByTestId("auto-apply-toggle").uncheck();
  const expectedLines = await page.locator("#logs-input").evaluate((node) => {
    const line = "INFO " + "x".repeat(64) + "\n";
    const repeats = Math.floor(1024 * 1024 / line.length);
    const content = line.repeat(repeats);
    const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, "clipboardData", {
      value: { getData: (type: string) => (type === "text/plain" ? content : "") },
    });
    (node as HTMLTextAreaElement).dispatchEvent(event);
    return repeats;
  });
  await expect(page.getByTestId("large-input-summary")).toBeVisible();
  await expect(page.getByTestId("large-input-loading")).toHaveCount(0);
  await page.getByTestId("apply-now").click();
  const report = JSON.parse(await downloadResult(page));
  expect(report.totalLines).toBe(expectedLines); // Rust str::lines omits a final empty line
  expect(report.matchedLines).toBe(expectedLines);
});

test("oversized 20 MiB paste is rejected before DOM insertion", async ({ page }) => {
  await tool(page, "logs");
  const prevented = await page.locator("#logs-input").evaluate((node) => {
    const content = "X".repeat(20 * 1024 * 1024);
    const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, "clipboardData", {
      value: { getData: (type: string) => (type === "text/plain" ? content : "") },
    });
    node.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(page.locator("#logs-input")).toHaveValue("");
  await expect(page.getByRole("alert")).toContainText("size limit");
  await expect(page.getByTestId("large-input-summary")).toHaveCount(0);
});

test("large UTF-8 files decode in a local worker and malformed files are rejected", async ({
  page,
}) => {
  await tool(page, "logs");
  await page.getByTestId("auto-apply-toggle").uncheck();
  const input = page.locator("#logs-input-file");
  await input.setInputFiles({
    name: "large.log",
    mimeType: "text/plain",
    buffer: Buffer.from("INFO " + "a".repeat(1024 * 1024)),
  });
  await expect(page.getByTestId("large-input-summary")).toBeVisible();
  await expect(page.getByTestId("large-input-loading")).toHaveCount(0);
  await page.getByTestId("apply-now").click();
  expect(JSON.parse(await downloadResult(page)).totalLines).toBe(1);
  await input.setInputFiles({
    name: "invalid.log",
    mimeType: "text/plain",
    buffer: Buffer.alloc(256 * 1024, 0xff),
  });
  await expect(page.getByTestId("large-input-loading")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("UTF-8");
  // A failed file import must not overwrite the last valid document.
  await expect(page.getByTestId("large-input-summary")).toBeVisible();
});
