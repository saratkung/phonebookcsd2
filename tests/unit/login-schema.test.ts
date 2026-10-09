import { describe, it, expect } from "vitest";
import { loginSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.org", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.org", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
