import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./test/e2e",
  outputDir: "./test/results/playwright-artifacts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "test/results/playwright-report", open: "never" }],
    ["json", { outputFile: "test/results/e2e-results.json" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev -p 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
