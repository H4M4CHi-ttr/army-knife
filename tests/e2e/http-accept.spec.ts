import { readdir } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { acceptMessages } from "../../src/i18n/http-accept";
import { ACCEPT_SAMPLE } from "../../src/lib/tools/http-accept-sample";

const PRIVATE = "PRIVATE_ACCEPT_4819";
async function assets(dir: string, prefix = "/army-knife/"): Promise<string[]> {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry =>
    entry.isDirectory() ? assets(`${dir}/${entry.name}`, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`],
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

for (const locale of ['ja', 'en', 'zh-CN', 'zh-TW', 'ko'] as const) {
  test(`Accept specificity, exact weights, keyboard and themes in ${locale}`, async ({ page }, testInfo) => {
    const m = acceptMessages[locale];
    await page.goto(`./${locale}/tools/http-accept/`);
    await expect(page.locator('#page-guide')).toHaveAttribute('data-locale', locale);
    await expect(page.locator('#page-guide')).toContainText(m['tool.http-accept.description']);
    await expect(page.locator('h1')).toHaveText(m['tool.http-accept.name']);
    const result = page.getByTestId('accept-result');
    await expect(result).toHaveCount(0);
    await page.getByTestId('accept-sample').focus(); await page.keyboard.press('Enter');
    await expect(page.getByTestId('accept-selected')).toHaveText('application/json');
    await expect(page.getByTestId('accept-offer-1')).toContainText(m['accept.excluded']);
    await page.locator('#accept-input').fill('TEXT/PLAIN;Q=0.001;CHARSET="UTF-8", */*;q=0.9');
    await page.locator('#accept-offers').fill('text/plain;charset=utf-8\nimage/png');
    await expect(page.getByTestId('accept-offer-1')).toContainText('0.001');
    expect(await page.getByTestId('accept-offer-1').locator('td').nth(1).locator('code').evaluate(element => element.getClientRects().length)).toBe(1);
    await expect(page.getByTestId('accept-selected')).toHaveText('image/png');
    await page.locator('#accept-input').fill(''); await expect(page.getByTestId('accept-none')).toBeVisible();
    await expect(result).toContainText(m['accept.no406']);
    await page.getByTestId('accept-absent').focus(); await page.keyboard.press('Space');
    await expect(page.locator('#accept-input')).toBeDisabled();
    await expect(page.getByTestId('accept-selected')).toHaveText('text/plain;charset=utf-8');
    await page.getByTestId('accept-sample').click();
    for (const theme of ['light', 'dark'] as const) {
      await page.getByTestId('settings-button').click(); await page.getByTestId(`theme-${theme}`).click(); await page.getByTestId('settings-close').click();
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      const capture = process.env.ARMY_KNIFE_CAPTURE_SCREENSHOTS === '1' && testInfo.project.name.startsWith('chromium-') && ((locale === 'en' && theme === 'light') || (locale === 'ja' && theme === 'dark'));
      const path = capture ? `docs/screenshots/http-accept-${locale}-${theme}-${testInfo.project.name.endsWith('small') ? 'small' : 'desktop'}.png` : undefined;
      await testInfo.attach(`http-accept-${locale}-${theme}`, { body: await page.screenshot({ fullPage: true, path }), contentType: 'image/png' });
    }
    await page.getByTestId('accept-clear').focus(); await page.keyboard.press('Enter');
    await expect(result).toHaveCount(0); await expect(page.locator('#accept-input')).toHaveValue(''); await expect(page.locator('#accept-offers')).toHaveValue('');
  });
}

test('Accept exact explicit JSON download, inert values and memory-only lifecycle', async ({ page }) => {
  await page.goto('./en/tools/http-accept/');
  await page.locator('#accept-input').fill('text/plain;q=0.001, */*;q=0');
  await page.locator('#accept-offers').fill('text/plain\nimage/png');
  const pending = page.waitForEvent('download');
  await page.getByTestId('accept-result').getByRole('button', { name: 'Download', exact: true }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe('army-knife-http-accept.json');
  const chunks: Buffer[] = []; for await (const chunk of (await download.createReadStream())!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString('utf8'))).toEqual({
    acceptAbsent: false, emptyAcceptSlots: 0, emptyOfferLines: 0,
    ranges: [
      { index: 1, source: 'text/plain;q=0.001', type: 'text', subtype: 'plain', parameters: [], quality: 1 },
      { index: 2, source: '*/*;q=0', type: '*', subtype: '*', parameters: [], quality: 0 },
    ], offers: [
      { index: 1, source: 'text/plain', type: 'text', subtype: 'plain', parameters: [], quality: 1, governingRanges: [1], reason: 'matched' },
      { index: 2, source: 'image/png', type: 'image', subtype: 'png', parameters: [], quality: 0, governingRanges: [2], reason: 'excluded' },
    ], rankedOfferIndexes: [1], selectedOfferIndex: 1,
  });
  const hostile = `text/plain;profile="<script>${PRIVATE}</script><img src=https://example.invalid/${PRIVATE}>"`;
  await page.locator('#accept-input').fill(hostile); await page.locator('#accept-offers').fill(hostile);
  await expect(page.getByTestId('accept-result')).toContainText(PRIVATE);
  await expect(page.getByTestId('accept-result').locator('script, img, a')).toHaveCount(0);
  expect(JSON.stringify(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href, cookie: document.cookie })))).not.toContain(PRIVATE);
  await page.reload(); await expect(page.locator('#accept-input')).toHaveValue(''); await expect(page.locator('#accept-offers')).toHaveValue('');
  await expect(page.getByTestId('accept-result')).toHaveCount(0);
  await page.getByTestId('accept-sample').click(); await page.locator('.back-link').click(); await page.getByTestId('tool-card-http-accept').click();
  await expect(page.locator('#accept-input')).toHaveValue(''); await expect(page.locator('#accept-offers')).toHaveValue('');
  await page.getByTestId('accept-sample').click(); await page.getByTestId('settings-button').click(); await page.getByTestId('locale-select').selectOption('ja');
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByTestId('accept-result')).toHaveCount(0);
  await expect(page.locator('#accept-input')).toHaveValue(''); await expect(page.locator('#accept-offers')).toHaveValue('');
});

test('Accept rejects malformed, conflicting and oversized input without stale exports', async ({ page }) => {
  await page.goto('./en/tools/http-accept/');
  for (const value of ['Accept: text/plain', 'text/plain\n', 'text/plain;x="unclosed', 'text/plain;q=0.0001', 'application/*+json', 'text/plain;x=y;X=y', 'text/plain,text/plain;q=0', 'text/plain' + ','.repeat(64)]) {
    await page.getByTestId('accept-sample').click(); await page.locator('#accept-offers').fill('text/plain'); await page.locator('#accept-input').fill(value);
    await expect(page.getByTestId('accept-result')).toHaveCount(0); await expect(page.locator('.output-actions')).toHaveCount(0); await expect(page.getByRole('alert')).toBeVisible();
  }
  for (const id of ['accept-input', 'accept-offers']) {
    await page.getByTestId('accept-sample').click();
    await page.locator(`#${id}`).evaluate(element => {
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => 'x'.repeat(8193) } }); element.dispatchEvent(event);
    });
    await expect(page.getByTestId('accept-result')).toHaveCount(0); await expect(page.locator('.output-actions')).toHaveCount(0);
    await page.locator(id === 'accept-input' ? '#accept-offers' : '#accept-input').fill('text/plain');
    await expect(page.getByTestId('accept-result')).toHaveCount(0);
  }
  await page.getByTestId('accept-sample').click(); await expect(page.getByTestId('accept-selected')).toHaveText('application/json');
});

test('Accept combined-input debounce, cancel, manual apply, preference-only persistence', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-09T00:00:00Z') }); await page.goto('./en/tools/http-accept/');
  await page.clock.pauseAt(new Date('2026-11-09T01:00:00Z'));
  const long = ACCEPT_SAMPLE + ' '.repeat(2100);
  await page.locator('#accept-offers').fill('text/plain'); await page.locator('#accept-input').fill(long);
  await expect(page.getByTestId('apply-control')).toHaveAttribute('data-status', 'pending');
  await page.clock.runFor(400); await page.locator('#accept-input').fill(long + ' ');
  await page.clock.runFor(799); await expect(page.getByTestId('accept-result')).toHaveCount(0);
  await page.clock.runFor(1); await expect(page.getByTestId('accept-selected')).toHaveText('text/plain');
  await page.locator('#accept-input').fill(long); await page.getByTestId('accept-cancel').click();
  await page.clock.runFor(1000); await expect(page.getByTestId('accept-result')).toHaveCount(0);
  await page.getByTestId('apply-now').click(); await expect(page.getByTestId('accept-selected')).toHaveText('text/plain');
  await page.locator('#accept-input').fill(long + ' '); await page.getByTestId('auto-apply-toggle').uncheck();
  await page.clock.runFor(1000); await expect(page.getByTestId('accept-result')).toHaveCount(0);
  await page.getByTestId('apply-now').click(); await expect(page.getByTestId('accept-selected')).toHaveText('text/plain');
  await page.reload(); await page.locator('#accept-offers').fill('text/plain'); await page.locator('#accept-input').fill(long);
  await expect(page.getByTestId('apply-control')).toHaveAttribute('data-status', 'manual');
  await page.getByTestId('accept-sample').click(); await expect(page.getByTestId('accept-selected')).toHaveText('application/json');
});
