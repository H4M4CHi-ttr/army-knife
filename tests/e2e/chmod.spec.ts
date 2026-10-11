import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { test as base, expect, type Page, type Request, type TestInfo } from "@playwright/test";
import { chmodMessages } from "../../src/i18n/chmod";

const PRIVATE_MARKER = "PRIVATE_CM_8642";
const PREFERENCE_KEY = "army-knife:preferences:v1";

async function staticAssets(directory: string, prefix = "/army-knife/"): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const pathname = `${prefix}${entry.name}`;
      return entry.isDirectory()
        ? staticAssets(resolve(directory, entry.name), `${pathname}/`)
        : entry.isFile()
          ? [pathname]
          : [];
    }),
  );
  return paths.flat();
}

let allowedAssets: Promise<Set<string>> | undefined;
function assetAllowlist(): Promise<Set<string>> {
  allowedAssets ??= staticAssets(resolve(process.cwd(), "dist")).then(
    (paths) =>
      new Set([
        ...paths,
        ...paths.filter((path) => path.endsWith("/index.html")).map((path) => path.slice(0, -10)),
      ]),
  );
  return allowedAssets;
}

interface Audit {
  requests: { url: string; method: string; headers: Record<string, string>; body: string | null }[];
  sockets: string[];
  errors: string[];
}

const test = base.extend<{ chmodAudit: Audit }>({
  chmodAudit: [
    async ({ context, page, baseURL }, use, testInfo) => {
      const audit: Audit = { requests: [], sockets: [], errors: [] };
      const record = (request: Request): void => {
        audit.requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          body: request.postData(),
        });
      };
      context.on("request", record);
      const observePage = (currentPage: Page): void => {
        currentPage.on("websocket", (socket) => audit.sockets.push(socket.url()));
        currentPage.on("pageerror", (error) => audit.errors.push(error.message));
        currentPage.on("console", (message) => {
          if (message.type() === "error") audit.errors.push(message.text());
        });
      };
      observePage(page);
      context.on("page", observePage);
      await use(audit);
      context.off("request", record);
      context.off("page", observePage);
      const origin = new URL(baseURL as string).origin;
      const allowlist = await assetAllowlist();
      for (const request of audit.requests) {
        const url = new URL(request.url);
        expect(url.origin, `Unexpected origin: ${request.url}`).toBe(origin);
        expect(request.method, `Unexpected method: ${request.url}`).toBe("GET");
        expect(url.search, `Only fixed asset URLs may be requested: ${request.url}`).toBe("");
        expect(allowlist.has(url.pathname), `Not an exact dist asset: ${request.url}`).toBe(true);
        expect(request.body).toBeNull();
        expect(JSON.stringify(request), "Private input appeared in a request").not.toContain(
          PRIVATE_MARKER,
        );
      }
      expect(audit.sockets, "Permission calculations must not open WebSockets").toEqual([]);
      expect(audit.errors, "Unexpected browser errors").toEqual([]);
      await testInfo.attach("chmod-privacy-audit", {
        body: JSON.stringify({
          requests: audit.requests.length,
          sockets: audit.sockets,
          errors: audit.errors,
        }),
        contentType: "application/json",
      });
    },
    { auto: true },
  ],
});

async function openTool(page: Page): Promise<void> {
  await page.goto("./en/tools/chmod/");
  await expect(page.getByTestId("chmod-mode")).toBeVisible();
}

async function assertMode(page: Page, octal: string, symbolic: string): Promise<void> {
  await expect(page.getByTestId("chmod-octal")).toHaveText(octal);
  await expect(page.getByTestId("chmod-symbolic")).toHaveText(symbolic);
}

async function assertNoOutput(page: Page, testId: string): Promise<void> {
  await expect
    .poll(async () => {
      const output = page.getByTestId(testId);
      return (await output.count()) === 0 || (await output.textContent())?.trim() === "";
    })
    .toBe(true);
}

async function assertNoOverflow(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(geometry.content, `Horizontal overflow at ${geometry.viewport}px`).toBeLessThanOrEqual(
    geometry.viewport + 1,
  );
}

async function reviewScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

test("octal modes produce symbolic permissions and synchronize keyboard matrix toggles", async ({
  page,
}) => {
  await openTool(page);
  const mode = page.getByTestId("chmod-mode");
  await expect(mode).toHaveValue("");
  await assertNoOutput(page, "chmod-octal");
  await mode.fill("0644");
  await assertMode(page, "0644", "rw-r--r--");
  await mode.fill("644");
  await assertMode(page, "0644", "rw-r--r--");
  for (const bit of ["u-r", "u-w", "g-r", "o-r"])
    await expect(page.getByTestId(`chmod-bit-${bit}`)).toBeChecked();
  for (const bit of ["u-x", "g-w", "g-x", "o-w", "o-x", "setuid", "setgid", "sticky"])
    await expect(page.getByTestId(`chmod-bit-${bit}`)).not.toBeChecked();
  const groupWrite = page.getByTestId("chmod-bit-g-w");
  await groupWrite.focus();
  await page.keyboard.press("Space");
  await expect(groupWrite).toBeFocused();
  await expect(groupWrite).toBeChecked();
  await assertMode(page, "0664", "rw-rw-r--");
  await page.keyboard.press("Space");
  await assertMode(page, "0644", "rw-r--r--");
  await mode.fill("0755");
  await assertMode(page, "0755", "rwxr-xr-x");
  await page.getByTestId("chmod-bit-setuid").check();
  await assertMode(page, "4755", "rwsr-xr-x");
  await mode.fill("1777");
  await assertMode(page, "1777", "rwxrwxrwt");
  await expect(page.getByTestId("chmod-bit-sticky")).toBeChecked();
  await mode.fill("4644");
  await assertMode(page, "4644", "rwSr--r--");
});

test("symbolic clauses preview explicit changes and distinguish file and directory set-ID behavior", async ({
  page,
}) => {
  await openTool(page);
  const mode = page.getByTestId("chmod-mode");
  const expression = page.getByTestId("chmod-expression");
  const preview = page.getByTestId("chmod-preview-octal");
  await mode.fill("0644");
  await expression.fill("u+x,g+w,o-r");
  await expect(preview).toHaveText("0760");
  await assertMode(page, "0644", "rw-r--r--");
  await page.getByTestId("chmod-use-preview").click();
  await assertMode(page, "0760", "rwxrw----");
  await mode.fill("6755");
  await expression.fill("u=rw");
  await expect(preview).toHaveText("2655");
  await assertMode(page, "6755", "rwsr-sr-x");
  await page.getByTestId("chmod-directory").check();
  await expect(preview).toHaveText("6655");
  await assertMode(page, "6755", "rwsr-sr-x");
  await page.getByTestId("chmod-use-preview").click();
  await assertMode(page, "6655", "rwSr-sr-x");
});

test("umask previews keep regular file and directory defaults distinct and reject invalid masks", async ({
  page,
}) => {
  await openTool(page);
  const umask = page.getByTestId("chmod-umask");
  await expect(umask).toHaveValue("");
  await umask.fill("022");
  await expect(page.getByTestId("chmod-umask-file")).toHaveText("0644");
  await expect(page.getByTestId("chmod-umask-directory")).toHaveText("0755");
  await umask.fill("027");
  await expect(page.getByTestId("chmod-umask-file")).toHaveText("0640");
  await expect(page.getByTestId("chmod-umask-directory")).toHaveText("0750");
  for (const invalid of ["028", "1022", PRIVATE_MARKER, ""]) {
    await umask.fill(invalid);
    await assertNoOutput(page, "chmod-umask-file");
    await assertNoOutput(page, "chmod-umask-directory");
  }
  const oversized = `022${" ".repeat(13)}777`;
  await umask.fill(oversized);
  await expect(umask).toHaveValue(oversized.slice(0, 17));
  await assertNoOutput(page, "chmod-umask-file");
  await assertNoOutput(page, "chmod-umask-directory");
});

test("invalid modes and unsupported expressions remove stale results and clearing resets all fields", async ({
  page,
}) => {
  await openTool(page);
  const mode = page.getByTestId("chmod-mode");
  const expression = page.getByTestId("chmod-expression");
  await mode.fill("0644");
  await expression.fill("g+w");
  await expect(page.getByTestId("chmod-preview-octal")).toHaveText("0664");
  for (const invalid of ["0888", "10000", "-1", PRIVATE_MARKER, ""]) {
    await mode.fill(invalid);
    await assertNoOutput(page, "chmod-octal");
    await assertNoOutput(page, "chmod-symbolic");
    await assertNoOutput(page, "chmod-preview-octal");
    await assertNoOutput(page, "chmod-command");
  }
  const oversized = `0644${" ".repeat(12)}755`;
  await mode.fill(oversized);
  await expect(mode).toHaveValue(oversized.slice(0, 17));
  await assertNoOutput(page, "chmod-octal");
  await assertNoOutput(page, "chmod-symbolic");
  await mode.fill("0644");
  for (const unsupported of ["+x", "a+X", "g=u", "u+r-w", `u+${PRIVATE_MARKER}`]) {
    await expression.fill(unsupported);
    await assertMode(page, "0644", "rw-r--r--");
    await assertNoOutput(page, "chmod-preview-octal");
  }
  await expression.fill("g+w");
  await page.getByTestId("chmod-umask").fill("027");
  await page.getByTestId("chmod-directory").check();
  await page.getByTestId("chmod-clear").click();
  await expect(mode).toHaveValue("");
  await expect(expression).toHaveValue("");
  await expect(page.getByTestId("chmod-umask")).toHaveValue("");
  await expect(page.getByTestId("chmod-directory")).not.toBeChecked();
  for (const id of [
    "octal",
    "symbolic",
    "preview-octal",
    "umask-file",
    "umask-directory",
    "command",
  ])
    await assertNoOutput(page, `chmod-${id}`);
});

test("permission inputs disappear on navigation and reload while only deliberate preferences persist", async ({
  page,
}) => {
  await openTool(page);
  await page.getByTestId("chmod-mode").fill("6755");
  await page.getByTestId("chmod-expression").fill(`u+${PRIVATE_MARKER}`);
  await page.getByTestId("chmod-umask").fill("027");
  await page.getByTestId("chmod-directory").check();
  await page.getByTestId("settings-button").click();
  await page.getByTestId("theme-dark").click();
  await page.getByTestId("settings-close").click();
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
    "theme",
    "version",
  ]);
  expect(storage.session).toEqual({});
  expect(JSON.stringify(storage)).not.toContain(PRIVATE_MARKER);
  expect(JSON.stringify(storage)).not.toContain("6755");
  expect(JSON.stringify(storage)).not.toContain("027");
  await page.getByTestId("settings-button").click();
  await page.getByTestId("locale-select").selectOption("ja");
  await expect(page).toHaveURL(/\/army-knife\/ja\/tools\/chmod\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.getByTestId("chmod-mode")).toHaveValue("");
  await expect(page.getByTestId("chmod-expression")).toHaveValue("");
  await expect(page.getByTestId("chmod-umask")).toHaveValue("");
  await page.getByTestId("chmod-mode").fill("4755");
  await page.getByTestId("chmod-expression").fill(`u+${PRIVATE_MARKER}`);
  await page.getByTestId("chmod-umask").fill("022");
  await page.getByTestId("chmod-directory").check();
  await page.locator(".back-link").click();
  await expect(page.getByTestId("tool-card-chmod")).toBeVisible();
  await page.getByTestId("tool-card-chmod").click();
  await expect(page.getByTestId("chmod-mode")).toHaveValue("");
  await expect(page.getByTestId("chmod-expression")).toHaveValue("");
  await expect(page.getByTestId("chmod-umask")).toHaveValue("");
  await expect(page.getByTestId("chmod-directory")).not.toBeChecked();
  await page.getByTestId("chmod-mode").fill("1777");
  await page.getByTestId("chmod-expression").fill("o-t");
  await page.getByTestId("chmod-umask").fill("022");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByTestId("chmod-mode")).toHaveValue("");
  await expect(page.getByTestId("chmod-expression")).toHaveValue("");
  await expect(page.getByTestId("chmod-umask")).toHaveValue("");
});

test("all five locales and both themes remain reactive and fit each browser viewport", async ({
  page,
}, testInfo) => {
  await openTool(page);
  await page.getByTestId("chmod-mode").fill("6755");
  await page.getByTestId("chmod-expression").fill("u=rw");
  await page.getByTestId("chmod-umask").fill("027");
  for (const locale of ["ja", "zh-CN", "zh-TW", "ko", "en"] as const) {
    await page.getByTestId("settings-button").click();
    await page.getByTestId("locale-select").selectOption(locale);
    await expect(page).toHaveURL(new RegExp(`/army-knife/${locale}/tools/chmod/$`));
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByTestId("chmod-mode")).toHaveValue("");
    await expect(page.getByTestId("chmod-expression")).toHaveValue("");
    await expect(page.getByTestId("chmod-umask")).toHaveValue("");
    await page.getByTestId("chmod-mode").fill("6755");
    await page.getByTestId("chmod-expression").fill("u=rw");
    await page.getByTestId("chmod-umask").fill("027");
    const translations = chmodMessages[locale];
    await expect(page.locator('label[for="chmod-mode"]')).toHaveText(
      translations["chmod.octalInput"],
    );
    await expect(page.locator('label[for="chmod-expression"]')).toHaveText(
      translations["chmod.expression"],
    );
    await expect(page.locator('label[for="chmod-umask"]')).toHaveText(
      translations["chmod.umaskInput"],
    );
    await expect(page.locator("#chmod-preview-heading")).toHaveText(translations["chmod.preview"]);
    await expect(page.locator("#chmod-umask-heading")).toHaveText(translations["chmod.umask"]);
    await assertMode(page, "6755", "rwsr-sr-x");
    await expect(page.getByTestId("chmod-preview-octal")).toHaveText("2655");
    await expect(page.getByTestId("chmod-umask-file")).toHaveText("0640");
    await assertNoOverflow(page);
  }
  await reviewScreenshot(page, testInfo, "chmod-light");
  await page.getByTestId("settings-button").click();
  await page.getByTestId("theme-dark").click();
  await page.getByTestId("settings-close").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await assertMode(page, "6755", "rwsr-sr-x");
  await assertNoOverflow(page);
  await reviewScreenshot(page, testInfo, "chmod-dark");
});

test("command text reaches the clipboard only after an explicit copy action", async ({
  page,
  context,
  browserName,
  baseURL,
}) => {
  if (browserName === "chromium")
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(baseURL as string).origin,
    });
  await openTool(page);
  if (browserName === "chromium") {
    const oversizedMode = `0644${" ".repeat(12)}755`;
    await page.evaluate((value) => navigator.clipboard.writeText(value), oversizedMode);
    await page.getByTestId("chmod-mode").focus();
    await page.keyboard.press("Control+v");
    await expect(page.getByTestId("chmod-mode")).toHaveValue(oversizedMode.slice(0, 17));
    await assertNoOutput(page, "chmod-octal");
    const oversizedUmask = `022${" ".repeat(13)}777`;
    await page.evaluate((value) => navigator.clipboard.writeText(value), oversizedUmask);
    await page.getByTestId("chmod-umask").focus();
    await page.keyboard.press("Control+v");
    await expect(page.getByTestId("chmod-umask")).toHaveValue(oversizedUmask.slice(0, 17));
    await assertNoOutput(page, "chmod-umask-file");
    await assertNoOutput(page, "chmod-umask-directory");
    await page.getByTestId("chmod-umask").clear();
    await page.evaluate(() => navigator.clipboard.writeText("UNCHANGED_CLIPBOARD"));
  }
  await page.getByTestId("chmod-mode").fill("0644");
  const command = page.getByTestId("chmod-command");
  await expect(command).toHaveText("chmod 00644 -- ./path");
  const expected = await command.textContent();
  if (browserName === "chromium")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("UNCHANGED_CLIPBOARD");
  const copy = page.getByTestId("chmod-copy-command");
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect(copy).toHaveText("Copied");
  if (browserName === "chromium")
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected?.trim());
});
