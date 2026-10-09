import { describe, it, expect } from "vitest";
import { digitsOnly, isValidThaiPhone, isValidExtension, formatThaiPhone } from "@/lib/utils/phone";

describe("digitsOnly", () => {
  it("strips non-digit characters", () => {
    expect(digitsOnly("081-234-5678")).toBe("0812345678");
    expect(digitsOnly("+66 81 234 5678")).toBe("66812345678");
  });
});

describe("isValidThaiPhone", () => {
  it("accepts a 10-digit mobile number", () => {
    expect(isValidThaiPhone("0812345678")).toBe(true);
    expect(isValidThaiPhone("081-234-5678")).toBe(true);
  });

  it("accepts a 9-digit landline number", () => {
    expect(isValidThaiPhone("021234567")).toBe(true);
  });

  it("accepts +66 international format", () => {
    expect(isValidThaiPhone("+66812345678")).toBe(true);
  });

  it("rejects numbers without a leading zero after normalization", () => {
    expect(isValidThaiPhone("12345")).toBe(false);
  });

  it("rejects empty or garbage input", () => {
    expect(isValidThaiPhone("")).toBe(false);
    expect(isValidThaiPhone("abcdefg")).toBe(false);
    expect(isValidThaiPhone("ชื่อ")).toBe(false);
  });

  it("rejects numbers that are too short or too long", () => {
    expect(isValidThaiPhone("012")).toBe(false);
    expect(isValidThaiPhone("0123456789012345")).toBe(false);
  });
});

describe("isValidExtension", () => {
  it("accepts short numeric extensions", () => {
    expect(isValidExtension("1234")).toBe(true);
    expect(isValidExtension("12-34")).toBe(true);
  });

  it("rejects empty or non-numeric extensions", () => {
    expect(isValidExtension("")).toBe(false);
    expect(isValidExtension("abcd")).toBe(false);
  });
});

describe("formatThaiPhone", () => {
  it("formats a 10-digit number as xxx-xxx-xxxx", () => {
    expect(formatThaiPhone("0812345678")).toBe("081-234-5678");
  });

  it("formats a 9-digit number as xx-xxx-xxxx", () => {
    expect(formatThaiPhone("021234567")).toBe("02-123-4567");
  });
});
