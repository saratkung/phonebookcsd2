import { test, expect } from "@playwright/test";
import { login, DEMO_ACCOUNTS } from "./helpers";

test("viewer does not see management or admin navigation", async ({ page }) => {
  await login(page, DEMO_ACCOUNTS.viewer.email, DEMO_ACCOUNTS.viewer.password);
  await expect(page.getByRole("link", { name: "จัดการรายชื่อ" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "ผู้ดูแลระบบ" })).toHaveCount(0);
});

test("viewer is redirected away from /manage even when navigating by URL directly", async ({ page }) => {
  await login(page, DEMO_ACCOUNTS.viewer.email, DEMO_ACCOUNTS.viewer.password);
  await page.goto("/manage");
  // The server action re-checks the role regardless of hidden UI — this must
  // not render the management table for a viewer.
  await expect(page.getByRole("heading", { name: "จัดการรายชื่อ" })).toHaveCount(0);
});

test("editor can add a new contact", async ({ page }) => {
  await login(page, DEMO_ACCOUNTS.editor.email, DEMO_ACCOUNTS.editor.password);
  await page.goto("/contacts/new");
  // Field labels render as "ชื่อ *" (required-marker span) so getByLabel
  // with exact text doesn't match — target the known input ids instead.
  await page.locator("#first_name").fill("ทดสอบ");
  await page.locator("#last_name").fill("อีทูอี");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page).toHaveURL(/\/contacts\//);
  // Next's route-announcer also echoes the new page's h1 text with
  // role="alert", colliding with a plain getByText match — scope to the heading.
  await expect(page.getByRole("heading", { name: "ทดสอบ อีทูอี" })).toBeVisible();
});

test("admin can see the admin section", async ({ page }) => {
  await login(page, DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password);
  await page.getByRole("link", { name: "ผู้ดูแลระบบ" }).click();
  await expect(page).toHaveURL("/admin");
});
