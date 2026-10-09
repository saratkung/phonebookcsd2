import type { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(email);
  await page.getByLabel("รหัสผ่าน").fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await page.waitForURL("/");
}

export const DEMO_ACCOUNTS = {
  admin: { email: "admin.demo@example.org", password: "DemoPass123!" },
  editor: { email: "editor.demo@example.org", password: "DemoPass123!" },
  viewer: { email: "viewer.demo@example.org", password: "DemoPass123!" },
};
