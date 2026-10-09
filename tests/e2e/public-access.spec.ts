import { test, expect } from "@playwright/test";

// The phonebook (search + contact detail) is intentionally public — no
// login required to browse. Everything else still requires auth.

test("anonymous visitor can search the phonebook without logging in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/"); // not redirected to /login
  await expect(page.getByRole("heading", { name: /สมุดโทรศัพท์/ })).toBeVisible();
  await page.getByLabel("ค้นหารายชื่อ").fill("สมชาย");
  await expect(page.getByText("สมชาย ใจดี")).toBeVisible({ timeout: 5000 });
});

test("anonymous visitor can open a contact's detail page and see phone numbers", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("ค้นหารายชื่อ").fill("สมชาย");
  await expect(page).toHaveURL(/q=/);
  await page.getByRole("link", { name: /สมชาย ใจดี/ }).click();
  await expect(page).toHaveURL(/\/contacts\//);
  await expect(page.getByText("0812345671")).toBeVisible();
});

test("anonymous visitor does not see favorite, edit, or deactivate controls", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("ค้นหารายชื่อ").fill("สมชาย");
  await expect(page).toHaveURL(/q=/);
  await page.getByRole("link", { name: /สมชาย ใจดี/ }).click();
  await expect(page).toHaveURL(/\/contacts\//);
  await expect(page.getByRole("button", { name: /รายการโปรด/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "แก้ไข" })).toHaveCount(0);
});

test("header shows a staff login link instead of a user menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "เข้าสู่ระบบสำหรับเจ้าหน้าที่" })).toBeVisible();
});

test("protected routes still redirect anonymous visitors to /login", async ({ page }) => {
  await page.goto("/manage");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/favorites");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/contacts/new");
  await expect(page).toHaveURL(/\/login/);
});
