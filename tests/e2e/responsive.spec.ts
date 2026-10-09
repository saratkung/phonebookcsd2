import { test, expect } from "@playwright/test";
import { login, DEMO_ACCOUNTS } from "./helpers";

test("mobile viewport shows the bottom navigation instead of the sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, DEMO_ACCOUNTS.viewer.email, DEMO_ACCOUNTS.viewer.password);
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toBeVisible();
});

test("desktop viewport shows the sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page, DEMO_ACCOUNTS.viewer.email, DEMO_ACCOUNTS.viewer.password);
  await expect(page.getByText("สมุดโทรศัพท์").first()).toBeVisible();
});
