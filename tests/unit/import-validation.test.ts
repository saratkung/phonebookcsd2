import { describe, it, expect } from "vitest";
import { validateImportRow } from "@/lib/validation/import";

const deptMap = new Map<string, string>([["ฝ่ายเทคโนโลยีสารสนเทศ", "11111111-1111-1111-1111-111111111111"]]);

describe("validateImportRow", () => {
  it("validates a correct row with no errors", () => {
    const row = validateImportRow(
      2,
      {
        first_name: "สมชาย",
        last_name: "ใจดี",
        department_name: "ฝ่ายเทคโนโลยีสารสนเทศ",
        mobile_phone: "0812345678",
      },
      deptMap
    );
    expect(row.errors).toEqual([]);
    expect(row.data.department_id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("flags a row missing required name fields", () => {
    const row = validateImportRow(3, { first_name: "", last_name: "" }, deptMap);
    expect(row.errors.length).toBeGreaterThan(0);
    expect(row.errors.some((e) => e.includes("first_name"))).toBe(true);
    expect(row.errors.some((e) => e.includes("last_name"))).toBe(true);
  });

  it("flags an invalid mobile phone number", () => {
    const row = validateImportRow(4, { first_name: "ก", last_name: "ข", mobile_phone: "123" }, deptMap);
    expect(row.errors.some((e) => e.includes("เบอร์มือถือ"))).toBe(true);
  });

  it("flags an unknown department name", () => {
    const row = validateImportRow(5, { first_name: "ก", last_name: "ข", department_name: "ไม่มีจริง" }, deptMap);
    expect(row.errors.some((e) => e.includes("ไม่พบหน่วยงาน"))).toBe(true);
  });

  it("flags an invalid mobile_visibility value", () => {
    const row = validateImportRow(
      6,
      { first_name: "ก", last_name: "ข", mobile_visibility: "secret" },
      deptMap
    );
    expect(row.errors.some((e) => e.includes("mobile_visibility"))).toBe(true);
  });

  it("defaults mobile_visibility to public when omitted", () => {
    const row = validateImportRow(7, { first_name: "ก", last_name: "ข" }, deptMap);
    expect(row.data.mobile_visibility).toBe("public");
  });
});
