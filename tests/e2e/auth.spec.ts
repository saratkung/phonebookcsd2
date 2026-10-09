import { test, expect } from "@playwright/test";

// Requires `npm run seed` to have created viewer.demo@example.org (DemoPass123!)

test("login with invalid credentials shows a Thai error message", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("nobody@example.org");
  await page.getByLabel("รหัสผ่าน").fill("wrongpassword");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page.getByRole("alert")).toContainText("ไม่ถูกต้อง");
});

test("login with valid credentials redirects to the phonebook", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("viewer.demo@example.org");
  await page.getByLabel("รหัสผ่าน").fill("DemoPass123!");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /สมุดโทรศัพท์/ })).toBeVisible();
});

test("logout returns to the login page and blocks protected routes", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("viewer.demo@example.org");
  await page.getByLabel("รหัสผ่าน").fill("DemoPass123!");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(page).toHaveURL("/login");

  await page.goto("/manage");
  await expect(page).toHaveURL(/\/login/);
});
