"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSession, AuthError, canEditContacts } from "@/lib/auth";
import { contactSchema, type ContactFormValues } from "@/lib/validation/contact";
import { digitsOnly } from "@/lib/utils/phone";
import type { Contact } from "@/lib/supabase/types";

export interface SearchContactsParams {
  q?: string;
  departmentId?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SearchContactsResult {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

function escapePgFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Full-text-ish search across name/nickname/rank/position (search_text) and
 * phone numbers (phone_digits), scoped by department (including sub-units)
 * and active state. Runs entirely in Postgres — never loads the whole table
 * to the client.
 */
export async function searchContacts(params: SearchContactsParams): Promise<SearchContactsResult> {
  // Public, read-only: no session required. RLS still enforces is_active and
  // masks mobile_visibility='private' numbers for non-staff (see
  // supabase/migrations/0006_public_read_access.sql and contacts_view).
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("contacts_view").select("*", { count: "exact" });

  if (!params.includeInactive) {
    query = query.eq("is_active", true);
  }

  const q = (params.q ?? "").trim();
  if (q.length > 0) {
    const normalized = escapePgFilterValue(q.toLowerCase());
    const digits = digitsOnly(q);
    const filters = [`search_text.ilike."%${normalized}%"`];
    if (digits.length >= 2) {
      filters.push(`phone_digits.ilike."%${digits}%"`);
    }
    query = query.or(filters.join(","));
  }

  if (params.departmentId) {
    const { data: deptIds, error: deptErr } = await supabase.rpc("department_and_descendants", {
      dept_id: params.departmentId,
    });
    if (deptErr) throw new Error("ไม่สามารถกรองตามหน่วยงานได้");
    const ids = (deptIds ?? []).map((d: { id: string }) => d.id);
    query = query.in("department_id", ids.length > 0 ? ids : [params.departmentId]);
  }

  const { data, error, count } = await query
    .order("rank_order", { ascending: true, nullsFirst: false })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error("ค้นหาข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
  }

  return { contacts: (data ?? []) as Contact[], total: count ?? 0, page, pageSize };
}

export async function getContactById(id: string): Promise<Contact | null> {
  // Public, read-only — see note in searchContacts() above.
  const supabase = await createClient();
  const { data, error } = await supabase.from("contacts_view").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("ไม่สามารถโหลดข้อมูลรายชื่อได้");
  return (data as Contact) ?? null;
}

export interface DuplicateCheckResult {
  possibleDuplicates: Contact[];
}

export async function checkDuplicateContact(
  firstName: string,
  lastName: string,
  mobilePhone: string | null,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  await requireSession();
  const supabase = await createClient();

  let query = supabase
    .from("contacts_view")
    .select("*")
    .ilike("first_name", firstName.trim())
    .ilike("last_name", lastName.trim());
  if (excludeId) query = query.neq("id", excludeId);

  const byName = await query;
  const results = new Map<string, Contact>();
  for (const c of (byName.data ?? []) as Contact[]) results.set(c.id, c);

  if (mobilePhone) {
    const digits = digitsOnly(mobilePhone);
    if (digits.length >= 8) {
      let phoneQuery = supabase.from("contacts_view").select("*").eq("phone_digits", digits);
      if (excludeId) phoneQuery = phoneQuery.neq("id", excludeId);
      const byPhone = await phoneQuery;
      for (const c of (byPhone.data ?? []) as Contact[]) results.set(c.id, c);
    }
  }

  return { possibleDuplicates: Array.from(results.values()) };
}

export interface MutationResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  contactId?: string;
}

function parseContactForm(formData: FormData) {
  const raw = {
    prefix: String(formData.get("prefix") ?? ""),
    first_name: String(formData.get("first_name") ?? ""),
    last_name: String(formData.get("last_name") ?? ""),
    nickname: String(formData.get("nickname") ?? ""),
    rank: String(formData.get("rank") ?? ""),
    position: String(formData.get("position") ?? ""),
    department_id: String(formData.get("department_id") ?? ""),
    mobile_phone: String(formData.get("mobile_phone") ?? ""),
    mobile_visibility: String(formData.get("mobile_visibility") ?? "public"),
    office_phone: String(formData.get("office_phone") ?? ""),
    extension: String(formData.get("extension") ?? ""),
    email: String(formData.get("email") ?? ""),
    work_location: String(formData.get("work_location") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    rank_order: String(formData.get("rank_order") ?? ""),
  };
  return contactSchema.safeParse(raw);
}

function fieldErrorsFromZod(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createContactAction(
  _prev: MutationResult,
  formData: FormData
): Promise<MutationResult> {
  let session;
  try {
    session = await requireSession();
  } catch (e) {
    return { success: false, error: e instanceof AuthError ? e.message : "เกิดข้อผิดพลาด" };
  }

  if (!canEditContacts(session.profile.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์เพิ่มรายชื่อ" };
  }

  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const values: ContactFormValues = parsed.data;
  if (session.profile.role === "editor" && values.department_id && values.department_id !== session.profile.department_id) {
    return { success: false, error: "คุณสามารถเพิ่มรายชื่อได้เฉพาะในหน่วยงานของคุณเท่านั้น" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("contacts").insert(values).select("id").single();

  if (error) {
    return { success: false, error: "บันทึกข้อมูลไม่สำเร็จ: " + error.message };
  }

  revalidatePath("/");
  revalidatePath("/manage");
  return { success: true, contactId: data.id };
}

export async function updateContactAction(
  contactId: string,
  _prev: MutationResult,
  formData: FormData
): Promise<MutationResult> {
  let session;
  try {
    session = await requireSession();
  } catch (e) {
    return { success: false, error: e instanceof AuthError ? e.message : "เกิดข้อผิดพลาด" };
  }

  if (!canEditContacts(session.profile.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์แก้ไขรายชื่อ" };
  }

  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const values: ContactFormValues = parsed.data;
  if (session.profile.role === "editor" && values.department_id && values.department_id !== session.profile.department_id) {
    return { success: false, error: "คุณสามารถแก้ไขรายชื่อได้เฉพาะในหน่วยงานของคุณเท่านั้น" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").update(values).eq("id", contactId);

  if (error) {
    return { success: false, error: "บันทึกข้อมูลไม่สำเร็จ: " + error.message };
  }

  revalidatePath("/");
  revalidatePath("/manage");
  revalidatePath(`/contacts/${contactId}`);
  return { success: true, contactId };
}

export async function setContactActiveState(contactId: string, isActive: boolean): Promise<MutationResult> {
  let session;
  try {
    session = await requireSession();
  } catch (e) {
    return { success: false, error: e instanceof AuthError ? e.message : "เกิดข้อผิดพลาด" };
  }

  if (!canEditContacts(session.profile.role)) {
    return { success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").update({ is_active: isActive }).eq("id", contactId);

  if (error) {
    return { success: false, error: "ดำเนินการไม่สำเร็จ: " + error.message };
  }

  revalidatePath("/");
  revalidatePath("/manage");
  revalidatePath(`/contacts/${contactId}`);
  return { success: true, contactId };
}
