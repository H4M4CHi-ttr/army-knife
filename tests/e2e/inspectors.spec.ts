import { expect, test, type Page } from "@playwright/test";

const ids = ["text-stats", "string-literals", "http-reference", "git-conflicts", "color-converter"] as const;
type Tool = typeof ids[number];

async function enable(page: Page, id: Tool, locale: string) {
  await page.goto("./" + locale + "/tools/" + id + "/");
  if (await page.getByTestId("tool-disabled").isVisible()) {
    await page.getByTestId("disabled-settings").click();
    const toggle = page.getByTestId("toggle-" + id);
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await page.getByTestId("settings-close").click();
  }
  await expect(page.locator("#" + id + "-input")).toBeVisible();
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool", id);
}

for (const locale of ["ja","en","zh-CN","zh-TW","ko"]) {
  test("five local inspectors in "+locale+" (Vapor, mobile-safe)", async ({page}) => {
    await enable(page, "text-stats", locale);
    await page.locator("#text-stats-input").fill("👩‍💻");
    await expect(page.getByTestId("text-stats-metrics")).toContainText("11");
    await page.getByTestId("inspect-case").selectOption("lower");
    await page.locator("#text-stats-input").fill("HELLO WORLD");
    await expect(page.getByTestId("text-stats-output")).toHaveText("hello world");

    await enable(page, "string-literals", locale);
    await page.locator("#string-literals-input").fill('Hello "world"');
    await expect(page.getByTestId("string-literals-output")).toHaveText('"Hello \\"world\\""');
    await page.getByTestId("inspect-format").selectOption("sql");
    await page.locator("#string-literals-input").fill("It's OK");
    await expect(page.getByTestId("string-literals-output")).toHaveText("'It''s OK'");

    await enable(page, "http-reference", locale);
    await page.locator("#http-reference-input").fill("404");
    await expect(page.getByTestId("http-reference-output")).toContainText("Not Found");
    await page.getByTestId("inspect-reference-kind").selectOption("mime");
    await page.locator("#http-reference-input").fill("application/json; charset=utf-8");
    await expect(page.getByTestId("http-reference-output")).toContainText("application/json");

    await enable(page, "git-conflicts", locale);
    await page.locator("#git-conflicts-input").fill("<<<<<<< HEAD\nours\n||||||| base\nancestor\n=======\ntheirs\n>>>>>>> topic");
    await expect(page.getByTestId("git-conflicts-output")).toHaveCount(1);
    await expect(page.getByTestId("git-conflicts-output")).toContainText("ours");
    await expect(page.getByTestId("git-conflicts-output")).toContainText("theirs");
    await page.locator("#git-conflicts-input").fill("<<<<<<< HEAD\nours");
    await expect(page.getByTestId("git-conflicts-diagnostics")).toBeVisible();

    await enable(page, "color-converter", locale);
    await page.locator("#color-converter-input").fill("#33669980");
    await expect(page.getByTestId("color-converter-output")).toContainText("#33669980");
    await page.locator("#color-converter-input").fill("not-a-color");
    await expect(page.getByRole("alert")).toBeVisible();
    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
  });
}

test("inspector inputs stay in memory and are not sent", async ({page}) => {
  const requests: Array<{url:string,method:string,body:string|null}> = [];
  page.on("request", req => requests.push({url:req.url(),method:req.method(),body:req.postData()}));
  await enable(page, "git-conflicts", "en");
  const secret = "NEVER_PERSIST_INSPECTOR_2026_";
  await page.locator("#git-conflicts-input").fill("<<<<<<< HEAD\n"+secret+"\n=======\nother\n>>>>>>> b");
  await expect(page.getByTestId("git-conflicts-output")).toContainText(secret);
  const persisted = await page.evaluate(() => ({
    local: {...localStorage}, session: {...sessionStorage}, url: location.href,
  }));
  expect(JSON.stringify(persisted)).not.toContain(secret);
  expect(JSON.stringify(requests)).not.toContain(secret);
  expect(requests.every((request) => request.method === "GET" && request.body === null)).toBe(true);
});
