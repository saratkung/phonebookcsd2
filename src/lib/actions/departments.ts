"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Department } from "@/lib/supabase/types";

export async function listDepartments(): Promise<Department[]> {
  // Public, read-only — the department filter on the public phonebook needs
  // this without a session too.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error("โหลดรายชื่อหน่วยงานไม่สำเร็จ");
  return data ?? [];
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  // Public, read-only — the public contact-detail page needs this too.
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("โหลดข้อมูลหน่วยงานไม่สำเร็จ");
  return data ?? null;
}

export interface DeptMutationResult {
  success: boolean;
  error?: string;
}

export async function createDepartmentAction(formData: FormData): Promise<DeptMutationResult> {
  try {
    await requireRole(["admin"]);
  } catch {
    return { success: false, error: "คุณไม่มีสิทธิ์จัดการหน่วยงาน" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "");
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!name) return { success: false, error: "กรุณากรอกชื่อหน่วยงาน" };

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    name,
    parent_id: parentId || null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  });

  if (error) return { success: false, error: "บันทึกไม่สำเร็จ: " + error.message };

  revalidatePath("/admin/departments");
  revalidatePath("/");
  return { success: true };
}

export async function updateDepartmentAction(id: string, formData: FormData): Promise<DeptMutationResult> {
  try {
    await requireRole(["admin"]);
  } catch {
    return { success: false, error: "คุณไม่มีสิทธิ์จัดการหน่วยงาน" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "");
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!name) return { success: false, error: "กรุณากรอกชื่อหน่วยงาน" };
  if (parentId === id) return { success: false, error: "หน่วยงานไม่สามารถเป็นหน่วยงานแม่ของตัวเองได้" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({ name, parent_id: parentId || null, sort_order: Number.isFinite(sortOrder) ? sortOrder : 0 })
    .eq("id", id);

  if (error) return { success: false, error: "บันทึกไม่สำเร็จ: " + error.message };

  revalidatePath("/admin/departments");
  revalidatePath("/");
  return { success: true };
}

export async function deleteDepartmentAction(id: string): Promise<DeptMutationResult> {
  try {
    await requireRole(["admin"]);
  } catch {
    return { success: false, error: "คุณไม่มีสิทธิ์จัดการหน่วยงาน" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("departments").delete().eq("id", id);

  if (error) {
    const message = error.message.includes("foreign key")
      ? "ไม่สามารถลบได้ เนื่องจากยังมีหน่วยงานย่อยหรือรายชื่อผูกอยู่"
      : "ลบไม่สำเร็จ: " + error.message;
    return { success: false, error: message };
  }

  revalidatePath("/admin/departments");
  revalidatePath("/");
  return { success: true };
}
