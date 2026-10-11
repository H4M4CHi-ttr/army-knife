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
    (paths) => new Set(["/army-knife/", ...paths]),
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
  await page.goto("./");
  await expect(page.getByTestId("tool-card-csv")).toBeVisible();
}

async function tool(page: Page, id: string): Promise<void> {
  await page.goto(`./#/tool/${id}`);
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
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
  await page.getByTestId("settings-close").click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByTestId("tool-card-json-format")).toBeVisible();
  await expect(page.getByTestId("tool-card-contrast")).toHaveCount(0);
  await settings(page);
  await page.getByTestId("toggle-json-format").click();
  await page.getByTestId("settings-close").click();
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
  await page.getByRole("button", { name: "Run", exact: true }).click();
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
  await page.getByRole("button", { name: "Run", exact: true }).click();
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
  await page.getByRole("button", { name: "Run", exact: true }).click();
  expect(await downloadResult(page)).toBe(`beta\n${PRIVATE_MARKER}`);
});

test("CIDR and Unicode report meaningful boundaries and discard stale results", async ({
  page,
}, testInfo) => {
  await tool(page, "cidr");
  await page.locator("#cidr-input").fill("::/0");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const ipv6 = JSON.parse(await downloadResult(page));
  expect(ipv6.addressCount).toBe("340282366920938463463374607431768211456");
  expect(ipv6.broadcast).toBeNull();
  await assertNoOverflow(page);
  await screenshot(page, testInfo, "subnet-ipv6");
  await page.locator("#cidr-input").fill("192.0.2.10/31");
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const pointToPoint = JSON.parse(await downloadResult(page));
  expect(pointToPoint.usableHostCount).toBe("2");

  await tool(page, "unicode");
  await page.locator("#unicode-input").fill(`A😀\r\nB\u200b${PRIVATE_MARKER}\u202e`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
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
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const result = JSON.parse(await downloadResult(page));
  expect(result.changes).toEqual([{ kind: "replace", path: "/a~1b/~0value", before: 1, after: 2 }]);
  await page.locator("#json-left").fill('{"id":9007199254740993}');
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(/precision|preserved safely/i);
});

test("only preferences persist; input text never enters storage or location", async ({ page }) => {
  await dashboard(page);
  await settings(page);
  await page.getByTestId("theme-light").click();
  await page.getByTestId("settings-close").click();
  await tool(page, "unicode");
  await page.locator("#unicode-input").fill(`secret = "${PRIVATE_MARKER}";\u200b`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
  const storage = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    href: location.href,
  }));
  expect(Object.keys(storage.local)).toEqual([PREFERENCE_KEY]);
  expect(Object.keys(JSON.parse(storage.local[PREFERENCE_KEY] as string)).sort()).toEqual([
    "enabledTools",
    "favorites",
    "locale",
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
  await settings(page);
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
    await page.getByTestId("locale-select").selectOption(entry.locale);
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
