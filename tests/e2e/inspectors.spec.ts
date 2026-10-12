import { test, expect, type Page } from "@playwright/test";

const ids = ["sri", "encoding", "magic", "user-agent", "set-cookie"] as const;

async function openInspector(page: Page, id: (typeof ids)[number], locale = "en") {
  await page.goto("./" + locale + "/tools/" + id + "/");
  if (id === "sri" || id === "encoding") {
    await expect(page.getByTestId("tool-disabled")).toBeVisible();
    await page.getByTestId("disabled-settings").click();
    const toggle = page.getByTestId("toggle-" + id);
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await page.getByTestId("settings-close").click();
  }
  if (id === "user-agent" || id === "set-cookie")
    await expect(page.locator("#" + id + "-input")).toBeVisible();
  else await expect(page.locator("#" + id + "-file")).toHaveCount(1);
}

test("SRI uses exact file bytes and raw hex in local worker", async ({ page }) => {
  await openInspector(page, "sri");
  await page.locator("#sri-file").setInputFiles({ name: "empty.js", mimeType: "text/javascript", buffer: Buffer.alloc(0) });
  await expect(page.getByTestId("sri-integrity"))
    .toHaveText("sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");
  await page.locator("#sri-hex").fill("00 FF 0A");
  await expect(page.getByTestId("selected-file")).toContainText("No file selected");
  await expect(page.getByTestId("sri-integrity")).toContainText("sha256-");
  await expect(page.locator(".code-output")).toContainText([
    "sha256-", "/assets/app.js",
  ]);
});

test("BOM inspector counts all EOL kinds and allows deliberate conversion", async ({ page }) => {
  await openInspector(page, "encoding");
  await page.locator("#encoding-file").setInputFiles({
    name: "mixed.txt", mimeType: "application/octet-stream",
    buffer: Buffer.from([0xef,0xbb,0xbf,65,13,10,66,10,67,13]),
  });
  await expect(page.getByTestId("encoding-preview")).toContainText("A");
  await expect(page.locator(".metric-grid")).toContainText(["UTF-8", "1"]);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download UTF-8 conversion" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toContain("mixed.txt.utf8.txt");
  expect(await download.failure()).toBeNull();
});

test("Magic Bytes identifies a PNG and warns for disguised extension", async ({ page }) => {
  await openInspector(page, "magic");
  await page.locator("#magic-file").setInputFiles({
    name: "disguised.exe", mimeType: "application/octet-stream",
    buffer: Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
  });
  await expect(page.locator(".inspector-list")).toContainText("PNG");
  await expect(page.locator(".inspector-warnings")).toContainText("extension");
});

test("User-Agent heuristic and no page-level overflow", async ({ page }) => {
  await openInspector(page, "user-agent");
  await page.locator("#user-agent-input").fill(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0 Safari/537.36 Edg/129.0",
  );
  await expect(page.locator(".metric-grid")).toContainText("Edg/129.0");
  await expect(page.locator(".metric-grid")).toContainText("Blink");
  const geometry = await page.evaluate(() => ({
    view: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(geometry.content).toBeLessThanOrEqual(geometry.view + 1);
});

test("Cookie values are omitted from all results and not persisted or transmitted", async ({ page }) => {
  const captured: string[] = [];
  page.on("request", (r) => captured.push(JSON.stringify({
    url: r.url(), body: r.postData(), headers: r.headers(),
  })));
  await openInspector(page, "set-cookie");
  const marker = "PRIVATE_INSPECTOR_XM631";
  await page.locator("#set-cookie-input").fill(
    "Set-Cookie: __Host-session=" + marker +
    "; Secure; Path=/; HttpOnly; SameSite=Lax\n" +
    "Set-Cookie: other=secondary; SameSite=None",
  );
  await expect(page.locator(".inspector-cookie")).toHaveCount(2);
  await expect(page.locator(".inspector-cookie").last()).toContainText("SameSite=None");
  await expect(page.locator(".inspector-cookie").last()).toContainText("Secure");
  const output = await page.evaluate(() => ({
    result: document.querySelector(".result-panel")?.textContent,
    prefs: localStorage.getItem("army-knife:preferences:v1"),
    path: location.href,
  }));
  expect(JSON.stringify(output)).not.toContain(marker);
  for (const request of captured) {
    expect(request).not.toContain(marker);
    const parsed = JSON.parse(request);
    const url = new URL(parsed.url);
    expect(url.origin).toBe("http://127.0.0.1:4173");
    expect(url.search).toBe("");
    expect(parsed.body).toBeNull();
  }
});

test("Localized inspector controls are available in five languages", async ({ page }) => {
  for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"]) {
    await openInspector(page, "user-agent", locale);
    await page.getByRole("button", { name: /Sample|サンプル|示例|範例|예제/ }).first().click();
    await expect(page.locator(".metric-grid")).toContainText("Edg/");
  }
});
