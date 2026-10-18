import { defineConfig } from "@playwright/test";

const compose = process.env.E2E_COMPOSE === "1";
const baseURL = compose ? "http://localhost:3000" : "http://localhost:3109";

export default defineConfig({
  testDir: "./e2e",
  testMatch: compose ? "compose.spec.js" : ["image.spec.js", "streams.spec.js"],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },
  projects: compose ? [{ name: "compose" }] : [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: compose ? undefined : {
    command: "npm run build && npm run start -- --port 3109",
    url: baseURL,
    env: { NEXT_PUBLIC_INFERENCE_API_URL: "http://localhost:8000" },
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
