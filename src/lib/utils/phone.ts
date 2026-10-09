/** Strips everything except digits. */
export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Validates a Thai-style phone number. Accepts mobile numbers (10 digits
 * starting with 0) and office/landline numbers (9-10 digits, optionally with
 * a leading 0), allowing spaces/dashes/parentheses/+66 as separators.
 */
export function isValidThaiPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return false;
  if (!/^[0-9+\-\s()]{6,20}$/.test(trimmed)) return false;

  let digits = digitsOnly(trimmed);
  if (digits.startsWith("66") && trimmed.includes("+")) {
    digits = "0" + digits.slice(2);
  }
  return /^0[0-9]{8,9}$/.test(digits);
}

/** Internal extension: 1-6 digits, optionally with a dash. */
export function isValidExtension(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return false;
  return /^[0-9\-]{1,10}$/.test(trimmed) && digitsOnly(trimmed).length >= 1;
}

export function formatThaiPhone(raw: string): string {
  const digits = digitsOnly(raw);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return raw;
}
