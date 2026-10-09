import { z } from "zod";
import { isValidExtension, isValidThaiPhone } from "@/lib/utils/phone";

export const REQUIRED_CSV_COLUMNS = ["first_name", "last_name"] as const;

export const CSV_COLUMNS = [
  "prefix",
  "first_name",
  "last_name",
  "nickname",
  "rank",
  "position",
  "department_name",
  "mobile_phone",
  "mobile_visibility",
  "office_phone",
  "extension",
  "email",
  "work_location",
  "notes",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

export interface ImportRowInput {
  rowNumber: number;
  raw: Record<string, string>;
}

export interface ImportRowValidated {
  rowNumber: number;
  data: {
    prefix: string | null;
    first_name: string;
    last_name: string;
    nickname: string | null;
    rank: string | null;
    position: string | null;
    department_name: string | null;
    department_id: string | null;
    mobile_phone: string | null;
    mobile_visibility: "public" | "private";
    office_phone: string | null;
    extension: string | null;
    email: string | null;
    work_location: string | null;
    notes: string | null;
  };
  errors: string[];
  isDuplicateInFile: boolean;
  isDuplicateInDb: boolean;
}

const empty = (v: string | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

export function validateImportRow(
  rowNumber: number,
  raw: Record<string, string>,
  departmentNameToId: Map<string, string>
): ImportRowValidated {
  const errors: string[] = [];

  const first_name = empty(raw.first_name);
  const last_name = empty(raw.last_name);
  if (!first_name) errors.push("ไม่มีชื่อ (first_name)");
  if (!last_name) errors.push("ไม่มีนามสกุล (last_name)");

  const mobile_phone = empty(raw.mobile_phone);
  if (mobile_phone && !isValidThaiPhone(mobile_phone)) {
    errors.push(`เบอร์มือถือไม่ถูกต้อง: "${mobile_phone}"`);
  }

  const office_phone = empty(raw.office_phone);
  if (office_phone && !isValidThaiPhone(office_phone)) {
    errors.push(`เบอร์สำนักงานไม่ถูกต้อง: "${office_phone}"`);
  }

  const extension = empty(raw.extension);
  if (extension && !isValidExtension(extension)) {
    errors.push(`เบอร์ภายในไม่ถูกต้อง: "${extension}"`);
  }

  const email = empty(raw.email)?.toLowerCase() ?? null;
  if (email && !z.string().email().safeParse(email).success) {
    errors.push(`อีเมลไม่ถูกต้อง: "${email}"`);
  }

  const department_name = empty(raw.department_name);
  let department_id: string | null = null;
  if (department_name) {
    const found = departmentNameToId.get(department_name.trim().toLowerCase());
    if (!found) {
      errors.push(`ไม่พบหน่วยงาน "${department_name}" ในระบบ`);
    } else {
      department_id = found;
    }
  }

  const mobile_visibility_raw = empty(raw.mobile_visibility)?.toLowerCase();
  const mobile_visibility: "public" | "private" = mobile_visibility_raw === "private" ? "private" : "public";
  if (mobile_visibility_raw && mobile_visibility_raw !== "public" && mobile_visibility_raw !== "private") {
    errors.push(`mobile_visibility ต้องเป็น public หรือ private เท่านั้น ("${mobile_visibility_raw}")`);
  }

  return {
    rowNumber,
    data: {
      prefix: empty(raw.prefix),
      first_name: first_name ?? "",
      last_name: last_name ?? "",
      nickname: empty(raw.nickname),
      rank: empty(raw.rank),
      position: empty(raw.position),
      department_name,
      department_id,
      mobile_phone,
      mobile_visibility,
      office_phone,
      extension,
      email,
      work_location: empty(raw.work_location),
      notes: empty(raw.notes),
    },
    errors,
    isDuplicateInFile: false,
    isDuplicateInDb: false,
  };
}
