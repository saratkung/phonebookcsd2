import { test, expect } from "@playwright/test";
import { login, DEMO_ACCOUNTS } from "./helpers";

// Relies on scripts/seed.ts sample contacts, e.g. "สมชาย ใจดี" / 0812345671.

test.beforeEach(async ({ page }) => {
  await login(page, DEMO_ACCOUNTS.viewer.email, DEMO_ACCOUNTS.viewer.password);
});

test("searching a partial Thai name returns the matching contact", async ({ page }) => {
  await page.getByLabel("ค้นหารายชื่อ").fill("สมชาย");
  await expect(page.getByText("สมชาย ใจดี")).toBeVisible({ timeout: 5000 });
});

test("searching by a partial phone number returns the matching contact", async ({ page }) => {
  await page.getByLabel("ค้นหารายชื่อ").fill("2345671");
  await expect(page.getByText("สมชาย ใจดี")).toBeVisible({ timeout: 5000 });
});

test("searching for a non-existent name shows the empty state", async ({ page }) => {
  await page.getByLabel("ค้นหารายชื่อ").fill("ไม่มีตัวตนแน่นอน999");
  await expect(page.getByText("ไม่พบรายชื่อที่ตรงกับการค้นหา")).toBeVisible({ timeout: 5000 });
});

test("clearing filters resets the search", async ({ page }) => {
  await page.getByLabel("ค้นหารายชื่อ").fill("สมชาย");
  await expect(page.getByText("ล้างตัวกรองทั้งหมด")).toBeVisible();
  await page.getByText("ล้างตัวกรองทั้งหมด").click();
  await expect(page.getByLabel("ค้นหารายชื่อ")).toHaveValue("");
});

test("opening a contact's detail page shows their phone numbers", async ({ page }) => {
  await page.getByLabel("ค้นหารายชื่อ").fill("สมชาย");
  await page.getByText("สมชาย ใจดี").first().click();
  await expect(page).toHaveURL(/\/contacts\//);
  await expect(page.getByText("0812345671")).toBeVisible();
});
