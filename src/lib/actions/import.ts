"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, canEditContacts } from "@/lib/auth";
import { REQUIRED_CSV_COLUMNS, validateImportRow, type ImportRowValidated } from "@/lib/validation/import";
import { digitsOnly } from "@/lib/utils/phone";

export interface PreviewResult {
  success: boolean;
  error?: string;
  missingColumns?: string[];
  rows?: ImportRowValidated[];
  validCount?: number;
  invalidCount?: number;
  duplicateCount?: number;
}

const MAX_ROWS = 2000;

export async function previewImportAction(formData: FormData): Promise<PreviewResult> {
  const session = await requireSession().catch(() => null);
  if (!session || !canEditContacts(session.profile.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์นำเข้าข้อมูล" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "กรุณาเลือกไฟล์ CSV" };
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { success: false, error: "รองรับเฉพาะไฟล์ .csv ในขณะนี้ (รองรับ .xlsx ในอนาคต)" };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return { success: false, error: "ไม่สามารถอ่านไฟล์ CSV ได้ กรุณาตรวจสอบรูปแบบไฟล์" };
  }

  const headers = parsed.meta.fields ?? [];
  const missingColumns = REQUIRED_CSV_COLUMNS.filter((c) => !headers.includes(c));
  if (missingColumns.length > 0) {
    return { success: false, missingColumns, error: `ไฟล์ขาดคอลัมน์ที่จำเป็น: ${missingColumns.join(", ")}` };
  }

  if (parsed.data.length === 0) {
    return { success: false, error: "ไฟล์ไม่มีข้อมูล" };
  }
  if (parsed.data.length > MAX_ROWS) {
    return { success: false, error: `ไฟล์มีจำนวนแถวเกิน ${MAX_ROWS} แถว กรุณาแบ่งไฟล์` };
  }

  const supabase = await createClient();
  const { data: departments } = await supabase.from("departments").select("id,name");
  const departmentNameToId = new Map<string, string>();
  for (const d of departments ?? []) departmentNameToId.set(d.name.trim().toLowerCase(), d.id);

  const rows = parsed.data.map((raw, idx) => validateImportRow(idx + 2, raw, departmentNameToId));

  // Duplicate detection within the file itself (same name, or same mobile digits).
  const seenNames = new Map<string, number>();
  const seenPhones = new Map<string, number>();
  for (const row of rows) {
    const nameKey = `${row.data.first_name.toLowerCase()}|${row.data.last_name.toLowerCase()}`;
    if (row.data.first_name && row.data.last_name) {
      if (seenNames.has(nameKey)) row.isDuplicateInFile = true;
      else seenNames.set(nameKey, row.rowNumber);
    }
    if (row.data.mobile_phone) {
      const digits = digitsOnly(row.data.mobile_phone);
      if (seenPhones.has(digits)) row.isDuplicateInFile = true;
      else seenPhones.set(digits, row.rowNumber);
    }
  }

  // Duplicate detection against existing DB contacts.
  const namesToCheck = rows
    .filter((r) => r.data.first_name && r.data.last_name)
    .map((r) => `${r.data.first_name.toLowerCase()}|${r.data.last_name.toLowerCase()}`);
  const phonesToCheck = rows
    .map((r) => (r.data.mobile_phone ? digitsOnly(r.data.mobile_phone) : null))
    .filter((p): p is string => !!p);

  const { data: existingContacts } = await supabase
    .from("contacts_view")
    .select("first_name,last_name,phone_digits");

  const existingNameSet = new Set(
    (existingContacts ?? []).map((c) => `${c.first_name.toLowerCase()}|${c.last_name.toLowerCase()}`)
  );
  const existingPhoneSet = new Set(
    (existingContacts ?? []).map((c) => c.phone_digits).filter((p): p is string => !!p)
  );

  for (const row of rows) {
    const nameKey = `${row.data.first_name.toLowerCase()}|${row.data.last_name.toLowerCase()}`;
    if (existingNameSet.has(nameKey)) row.isDuplicateInDb = true;
    if (row.data.mobile_phone) {
      const digits = digitsOnly(row.data.mobile_phone);
      // phone_digits stored column concatenates mobile+office+ext, so use substring containment.
      for (const existingDigits of existingPhoneSet) {
        if (existingDigits.includes(digits)) {
          row.isDuplicateInDb = true;
          break;
        }
      }
    }
  }
  void namesToCheck;
  void phonesToCheck;

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const invalidCount = rows.length - validCount;
  const duplicateCount = rows.filter((r) => r.isDuplicateInFile || r.isDuplicateInDb).length;

  return { success: true, rows, validCount, invalidCount, duplicateCount };
}

export interface ConfirmImportResult {
  success: boolean;
  error?: string;
  insertedCount?: number;
  skippedCount?: number;
  failedRows?: { rowNumber: number; reason: string }[];
}

export async function confirmImportAction(
  rows: ImportRowValidated[],
  skipDuplicates: boolean
): Promise<ConfirmImportResult> {
  const session = await requireSession().catch(() => null);
  if (!session || !canEditContacts(session.profile.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์นำเข้าข้อมูล" };
  }

  const supabase = await createClient();
  const failedRows: { rowNumber: number; reason: string }[] = [];
  let skippedCount = 0;

  const toInsert: {
    prefix: string | null;
    first_name: string;
    last_name: string;
    nickname: string | null;
    rank: string | null;
    position: string | null;
    department_id: string | null;
    mobile_phone: string | null;
    mobile_visibility: "public" | "private";
    office_phone: string | null;
    extension: string | null;
    email: string | null;
    work_location: string | null;
    notes: string | null;
  }[] = [];
  for (const row of rows) {
    if (row.errors.length > 0) {
      failedRows.push({ rowNumber: row.rowNumber, reason: row.errors.join("; ") });
      continue;
    }
    if (skipDuplicates && (row.isDuplicateInFile || row.isDuplicateInDb)) {
      skippedCount += 1;
      continue;
    }
    if (
      session.profile.role === "editor" &&
      row.data.department_id &&
      row.data.department_id !== session.profile.department_id
    ) {
      failedRows.push({ rowNumber: row.rowNumber, reason: "อยู่นอกเหนือหน่วยงานของคุณ" });
      continue;
    }
    toInsert.push({
      prefix: row.data.prefix,
      first_name: row.data.first_name,
      last_name: row.data.last_name,
      nickname: row.data.nickname,
      rank: row.data.rank,
      position: row.data.position,
      department_id: row.data.department_id,
      mobile_phone: row.data.mobile_phone,
      mobile_visibility: row.data.mobile_visibility,
      office_phone: row.data.office_phone,
      extension: row.data.extension,
      email: row.data.email,
      work_location: row.data.work_location,
      notes: row.data.notes,
    });
  }

  let insertedCount = 0;
  if (toInsert.length > 0) {
    const { error, count } = await supabase.from("contacts").insert(toInsert, { count: "exact" });
    if (error) {
      return { success: false, error: "นำเข้าข้อมูลไม่สำเร็จ: " + error.message };
    }
    insertedCount = count ?? toInsert.length;
  }

  await supabase.rpc("log_contact_import", {
    summary: { insertedCount, skippedCount, failedCount: failedRows.length, totalRows: rows.length },
  });

  revalidatePath("/");
  revalidatePath("/manage");

  return { success: true, insertedCount, skippedCount, failedRows };
}
