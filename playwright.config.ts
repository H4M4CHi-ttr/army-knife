import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ...(process.env.CI ? [["github"] as const] : []),
  ],
  use: {
    baseURL: "http://127.0.0.1:4173/army-knife/",
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "light",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "firefox-desktop",
      use: { browserName: "firefox", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "chromium-small",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
    {
      name: "firefox-small",
      use: { browserName: "firefox", viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "node scripts/serve-dist.mjs --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/army-knife/",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
