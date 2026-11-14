import { readdir } from "node:fs/promises";
import { expect, test as base, type Download, type Page } from "@playwright/test";
import { sshKeyMessages } from "../../src/i18n/ssh-key";
import { SSH_KEY_SAMPLE, SSH_KEY_SAMPLE_FINGERPRINT } from "../../src/lib/tools/ssh-key-sample";
import publicKeys from "../fixtures/ssh-key-public.json" with { type: "json" };

const PRIVATE = "PRIVATE_SSH_20261115";
const edOnly = SSH_KEY_SAMPLE.split(" ").slice(0, 2).join(" ");
async function assets(dir: string, prefix = "/army-knife/"): Promise<string[]> {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry =>
    entry.isDirectory() ? assets(dir + "/" + entry.name, prefix + entry.name + "/") : [prefix + entry.name],
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
async function open(page: Page, locale = "en") {
  const response = await page.goto("./" + locale + "/tools/ssh-key/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("#ssh-key-input")).toBeVisible();
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", "ssh-key");
}
async function readDownload(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
async function privateState(page: Page) {
  expect(await page.evaluate(() => JSON.stringify({
    url: location.href, local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie,
  }))).not.toContain(PRIVATE);
}

test("SSH public-key five locales, keyboard, guides and responsive themes", async ({ page }, testInfo) => {
  for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
    const m = sshKeyMessages[locale];
    await open(page, locale);
    await expect(page.locator("h1")).toHaveText(m["tool.ssh-key.name"]);
    await expect(page.locator("#ssh-key-input")).toHaveValue("");
    await expect(page.locator("#ssh-key-expected")).toHaveValue("");
    await expect(page.locator("#page-guide")).toHaveAttribute("data-locale", locale);
    await expect(page.locator("#page-guide")).toContainText(m["ssh.exampleResult"]);
    await page.getByTestId("ssh-key-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("ssh-key-fingerprint").locator("pre")).toHaveText(SSH_KEY_SAMPLE_FINGERPRINT);
    await expect(page.getByTestId("ssh-key-match")).toHaveText(m["ssh.match"]);
    await page.getByTestId("ssh-key-result").locator("summary").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("ssh-key-result").locator("details")).toHaveAttribute("open", "");
    expect(JSON.parse((await page.getByTestId("ssh-key-json").textContent())!).matches).toBe(true);
    await page.keyboard.press("Enter");
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click();
      await page.getByTestId("settings-close").click(); await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if ((locale === "en" && theme === "light") || (locale === "ja" && theme === "dark")) {
        const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === "1" && testInfo.project.name.startsWith("chromium-");
        const path = capture ? "docs/screenshots/ssh-key-" + locale + "-" + theme + "-" +
          (testInfo.project.name.endsWith("small") ? "small" : "desktop") + ".png" : undefined;
        await page.evaluate(() => window.scrollTo(0, 0));
        await testInfo.attach("ssh-key-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true, path }), contentType: "image/png" });
      }
    }
    await page.locator("#ssh-key-input").fill("ssh-dss unsupported");
    await expect(page.getByTestId("ssh-key-result")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveText(m["errors.SSH_TYPE"]);
  }
});

test("SSH public-key real formats and CRLF imports retain exact exports and inert comments", async ({ page }) => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    (window as Window & { __sshCopies: string[] }).__sshCopies = copies;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  });
  await open(page);
  const result = page.getByTestId("ssh-key-result"), reference = page.locator("#ssh-key-expected");
  for (const fixture of publicKeys) {
    await page.locator("#ssh-key-input-file").setInputFiles({
      name: "synthetic-" + fixture.type + ".pub", mimeType: "text/plain", buffer: Buffer.from(fixture.input + "\r\n"),
    });
    await reference.fill(fixture.fingerprint);
    await expect(page.getByTestId("ssh-key-fingerprint").locator("pre")).toHaveText(fixture.fingerprint);
    await expect(page.getByTestId("ssh-key-match")).toHaveText(sshKeyMessages.en["ssh.match"]);
    expect(JSON.parse((await page.getByTestId("ssh-key-json").textContent())!)).toMatchObject({
      type: fixture.type, keyBits: fixture.keyBits, curve: fixture.curve, exponent: fixture.exponent,
      fingerprint: fixture.fingerprint, matches: true, comment: "army-knife-public-fixture",
    });
    if (fixture.type === "ssh-rsa") {
      await expect(result).toContainText("9007199254740993");
      const pending = page.waitForEvent("download");
      await result.locator(".result-header").first().getByRole("button", { name: "Download", exact: true }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe("army-knife-ssh-key.json");
      expect(JSON.parse(await readDownload(download))).toMatchObject({ exponent: "9007199254740993", keyBits: 2048 });
    }
  }
  const comment = PRIVATE + ' <img src="https://example.invalid/no-request"> \u202e';
  await page.locator("#ssh-key-input-file").setInputFiles({ name: "synthetic-" + PRIVATE + ".pub", mimeType: "text/plain",
    buffer: Buffer.from(edOnly + " " + comment + "\r\n") });
  await reference.fill(SSH_KEY_SAMPLE_FINGERPRINT);
  await expect(page.getByTestId("ssh-key-fingerprint").locator("pre")).toHaveText(SSH_KEY_SAMPLE_FINGERPRINT);
  await expect(page.getByTestId("ssh-key-comment")).toContainText("\\u202e");
  await expect(result.locator("img, script, a")).toHaveCount(0);
  expect(await page.evaluate(() => (window as Window & { __sshCopies: string[] }).__sshCopies)).toEqual([]);
  await page.getByTestId("ssh-key-fingerprint").getByRole("button", { name: "Copy", exact: true }).click();
  await result.locator(".result-header").first().getByRole("button", { name: "Copy", exact: true }).click();
  const copies = await page.evaluate(() => (window as Window & { __sshCopies: string[] }).__sshCopies);
  expect(copies[0]).toBe(SSH_KEY_SAMPLE_FINGERPRINT);
  expect(JSON.parse(copies[1]!)).toMatchObject({ comment, matches: true, fingerprint: SSH_KEY_SAMPLE_FINGERPRINT });
  const pending = page.waitForEvent("download");
  await page.getByTestId("ssh-key-fingerprint").getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("army-knife-ssh-fingerprint.txt");
  expect(await readDownload(download)).toBe(SSH_KEY_SAMPLE_FINGERPRINT);
  await reference.fill("SHA256:" + "A".repeat(43));
  await expect(page.getByTestId("ssh-key-match")).toHaveText(sshKeyMessages.en["ssh.mismatch"]);
  await reference.fill("");
  await expect(page.getByTestId("ssh-key-match")).toHaveText(sshKeyMessages.en["ssh.noReference"]);
  await privateState(page);
});

test("SSH public-key malformed records and both field limits remove stale exports", async ({ page }) => {
  await open(page);
  const result = page.getByTestId("ssh-key-result"), input = page.locator("#ssh-key-input");
  const invalid: [string, keyof typeof sshKeyMessages.en][] = [
    ["ssh-dss unsupported", "errors.SSH_TYPE"],
    ["example.invalid " + SSH_KEY_SAMPLE, "errors.SSH_TYPE"],
    ["-----BEGIN OPENSSH PRIVATE KEY-----\n" + PRIVATE + "\n-----END OPENSSH PRIVATE KEY-----", "errors.SSH_FORMAT"],
    [SSH_KEY_SAMPLE + "\n" + SSH_KEY_SAMPLE, "errors.SSH_FORMAT"],
    ["ssh-rsa " + SSH_KEY_SAMPLE.split(" ")[1], "errors.SSH_STRUCTURE"],
    ["ssh-ed25519 AB==", "errors.SSH_BASE64"],
    [edOnly + " " + "界".repeat(1366), "errors.SSH_LIMIT"],
  ];
  for (const [value, code] of invalid) {
    await page.getByTestId("ssh-key-sample").click(); await expect(result).toBeVisible();
    await input.fill(value); await expect(result).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveText(sshKeyMessages.en[code]);
    await expect(page.getByRole("alert")).not.toContainText(PRIVATE);
    await expect(page.locator(".output-actions")).toHaveCount(0);
  }
  for (const [name, buffer] of [
    ["oversize.pub", Buffer.alloc(16385, 32)], ["invalid-utf8.pub", Buffer.from([0xff])],
    ["bom.pub", Buffer.from("\ufeff" + SSH_KEY_SAMPLE)],
  ] as const) {
    await page.getByTestId("ssh-key-sample").click(); await expect(result).toBeVisible();
    await page.locator("#ssh-key-input-file").setInputFiles({ name, mimeType: "text/plain", buffer });
    await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator(".output-actions")).toHaveCount(0);
  }
  for (const [id, size] of [["ssh-key-input", 16385], ["ssh-key-expected", 129]] as const) {
    await page.getByTestId("ssh-key-sample").click(); await expect(result).toBeVisible();
    await page.locator("#" + id).evaluate((element, size) => {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(size) } });
      element.dispatchEvent(event);
    }, size);
    await expect(result).toHaveCount(0); await expect(page.locator(".output-actions")).toHaveCount(0);
  }
  await page.getByTestId("ssh-key-sample").click(); await expect(result).toBeVisible();
  await page.locator("#ssh-key-expected").fill(PRIVATE);
  await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toHaveText(sshKeyMessages.en["errors.SSH_FINGERPRINT"]);
  await privateState(page);
});

test("SSH public-key queued work cancels and applies manually while short input starts immediately", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await open(page); await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
  const input = page.locator("#ssh-key-input"), result = page.getByTestId("ssh-key-result");
  const source = edOnly + " " + PRIVATE.repeat(120);
  await input.fill(source);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "pending");
  await page.clock.runFor(799); await expect(result).toHaveCount(0);
  await page.clock.runFor(1); await expect(result).toBeVisible();
  await input.fill(source + " "); await expect(result).toHaveCount(0);
  await page.getByTestId("ssh-key-cancel").focus(); await page.keyboard.press("Enter");
  await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await expect(page.getByTestId("apply-control")).toHaveAttribute("data-status", "cancelled");
  await page.getByTestId("auto-apply-toggle").uncheck();
  await input.fill(source + "  "); await page.clock.runFor(1000); await expect(result).toHaveCount(0);
  await page.getByTestId("apply-now").focus(); await page.keyboard.press("Enter"); await expect(result).toBeVisible();
  await input.fill(edOnly); await expect(result).toBeVisible();
  await expect(page.getByTestId("ssh-key-fingerprint").locator("pre")).toHaveText(SSH_KEY_SAMPLE_FINGERPRINT);
  await privateState(page);
});

test("SSH public-key inputs clear on navigation, language changes and reload with preference-only persistence", async ({ page }) => {
  await open(page);
  const input = page.locator("#ssh-key-input"), result = page.getByTestId("ssh-key-result");
  await input.fill(edOnly + " " + PRIVATE); await page.locator("#ssh-key-expected").fill(SSH_KEY_SAMPLE_FINGERPRINT);
  await expect(result).toBeVisible(); await privateState(page);
  await page.reload(); await expect(input).toHaveValue(""); await expect(page.locator("#ssh-key-expected")).toHaveValue("");
  await expect(result).toHaveCount(0);
  await input.fill(edOnly + " " + PRIVATE); await expect(result).toBeVisible();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-ssh-key").click();
  await expect(input).toHaveValue(""); await expect(page.locator("#ssh-key-expected")).toHaveValue("");
  await expect(result).toHaveCount(0);
  await page.getByTestId("ssh-key-sample").click(); await expect(result).toBeVisible();
  await page.getByTestId("settings-button").click(); await page.getByTestId("locale-select").selectOption("ja");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(input).toHaveValue(""); await expect(result).toHaveCount(0);
  await input.fill(edOnly + " " + PRIVATE); await expect(result).toBeVisible();
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-cidr").click();
  await expect(input).toHaveCount(0);
  await page.locator(".back-link").click(); await page.getByTestId("tool-card-ssh-key").click();
  await expect(input).toHaveValue("");
  await expect(page.locator("#ssh-key-expected")).toHaveValue(""); await expect(result).toHaveCount(0);
  await privateState(page);
});
