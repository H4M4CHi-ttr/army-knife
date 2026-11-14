import { expect, test } from "@playwright/test";
import { sshKeyMessages } from "../../src/i18n/ssh-key";
import { SSH_KEY_SAMPLE, SSH_KEY_SAMPLE_FINGERPRINT } from "../../src/lib/tools/ssh-key-sample";

const PRIVATE = "PRIVATE_SSH_PUBLIC_20261115";
for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
  test("published SSH public-key operation in " + locale, async ({ page, context }, testInfo) => {
    const errors: string[] = [], requests: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    context.on("request", request => requests.push(JSON.stringify({ url: request.url(), headers: request.headers(), body: request.postData() })));
    const response = await page.goto("./" + locale + "/tools/ssh-key/"); expect(response?.status()).toBe(200);
    const m = sshKeyMessages[locale], input = page.locator("#ssh-key-input"), reference = page.locator("#ssh-key-expected");
    const result = page.getByTestId("ssh-key-result");
    await expect(page.locator("h1")).toHaveText(m["tool.ssh-key.name"]);
    await expect(page.locator("#page-guide")).toContainText(m["ssh.scope"]);
    await page.getByTestId("ssh-key-sample").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("ssh-key-fingerprint").locator("pre")).toHaveText(SSH_KEY_SAMPLE_FINGERPRINT);
    await expect(page.getByTestId("ssh-key-match")).toHaveText(m["ssh.match"]);
    for (const theme of ["light", "dark"] as const) {
      await page.getByTestId("settings-button").click(); await page.getByTestId("theme-" + theme).click();
      await page.getByTestId("settings-close").click(); await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await testInfo.attach("published-ssh-key-" + locale + "-" + theme, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
    await reference.fill("SHA256:" + "A".repeat(43));
    await expect(page.getByTestId("ssh-key-match")).toHaveText(m["ssh.mismatch"]);
    await reference.fill("");
    await expect(page.getByTestId("ssh-key-match")).toHaveText(m["ssh.noReference"]);
    await reference.fill(PRIVATE);
    await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toHaveText(m["errors.SSH_FINGERPRINT"]);
    await reference.fill(SSH_KEY_SAMPLE_FINGERPRINT);
    const comment = PRIVATE + ' <img src="https://example.invalid/no-request"> \u202e';
    const record = SSH_KEY_SAMPLE.split(" ").slice(0, 2).join(" ") + " " + comment + "\r\n";
    await page.locator("#ssh-key-input-file").setInputFiles({ name: "synthetic-public.pub", mimeType: "text/plain", buffer: Buffer.from(record) });
    await expect(page.getByTestId("ssh-key-match")).toHaveText(m["ssh.match"]);
    await expect(page.getByTestId("ssh-key-comment")).toContainText("\\u202e");
    await expect(result.locator("img, script, a")).toHaveCount(0);
    expect(JSON.parse((await page.getByTestId("ssh-key-json").textContent())!)).toMatchObject({ comment, fingerprint: SSH_KEY_SAMPLE_FINGERPRINT });
    const state = () => page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie }));
    expect(await state()).not.toContain(PRIVATE);
    await input.fill("ssh-dss unsupported");
    await expect(result).toHaveCount(0); await expect(page.getByRole("alert")).toHaveText(m["errors.SSH_TYPE"]);
    await page.getByTestId("ssh-key-clear").click(); await page.reload();
    await expect(input).toHaveValue(""); await expect(reference).toHaveValue("");
    expect(requests.join("\n")).not.toContain(PRIVATE); expect(errors).toEqual([]);
  });
}
