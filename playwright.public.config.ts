import { defineConfig } from "@playwright/test";
import productionTests from "./playwright.config";

/** Read-only checks at the existing destination, after its successful deployment. */
export default defineConfig({
  ...productionTests,
  testDir: "./tests/public",
  webServer: undefined,
  reporter: [["list"], ["html", { outputFolder: "public-playwright-report", open: "never" }], ["github"]],
  outputDir: "public-test-results",
  use: {
    ...productionTests.use,
    baseURL: "https://h4m4chi-ttr.github.io/army-knife/",
  },
});
