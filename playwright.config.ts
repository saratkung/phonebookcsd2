import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Requires a running dev server pointed at a real Supabase
 * project with `npm run seed` applied (see README — ส่วนการทดสอบ).
 * These specs are NOT run as part of this delivery; there is no live
 * Supabase project configured in this environment.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
