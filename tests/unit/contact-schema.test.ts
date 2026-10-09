import { describe, it, expect } from "vitest";
import { contactSchema } from "@/lib/validation/contact";

const baseValid = {
  prefix: "นาย",
  first_name: "สมชาย",
  last_name: "ใจดี",
  nickname: "ชาย",
  rank: "",
  position: "นักวิชาการคอมพิวเตอร์",
  department_id: "",
  mobile_phone: "0812345678",
  mobile_visibility: "public" as const,
  office_phone: "",
  extension: "",
  email: "somchai@example.org",
  work_location: "",
  notes: "",
};

describe("contactSchema", () => {
  it("accepts a valid Thai contact", () => {
    const result = contactSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.first_name).toBe("สมชาย");
      expect(result.data.rank).toBeNull();
    }
  });

  it("rejects a contact missing first name", () => {
    const result = contactSchema.safeParse({ ...baseValid, first_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a contact missing last name", () => {
    const result = contactSchema.safeParse({ ...baseValid, last_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid mobile phone number", () => {
    const result = contactSchema.safeParse({ ...baseValid, mobile_phone: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    const result = contactSchema.safeParse({ ...baseValid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("normalizes blank optional fields to null", () => {
    const result = contactSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.office_phone).toBeNull();
      expect(result.data.notes).toBeNull();
    }
  });
});
