"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import type { Profile, UserRole } from "@/lib/supabase/types";

export interface AdminUserRow extends Profile {
  email: string | null;
}

export interface AdminMutationResult {
  success: boolean;
  error?: string;
}

/**
 * Lists all accounts. Requires admin (re-checked server-side, never trusts
 * the caller's claimed role). Uses the service-role client ONLY to resolve
 * each auth user's email for display — profile data itself still comes
 * through the normal RLS path implicitly because we already verified the
 * caller is an admin above.
 */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error("โหลดรายชื่อผู้ใช้ไม่สำเร็จ");

  const admin = createAdminClient();
  const emailByUserId = new Map<string, string | null>();
  let page = 1;
  // supabase-js admin.listUsers paginates; walk until exhausted (bounded —
  // fine for an org directory's user count).
  while (true) {
    const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (listError) break;
    for (const u of data.users) emailByUserId.set(u.id, u.email ?? null);
    if (data.users.length < 200) break;
    page += 1;
    if (page > 20) break;
  }

  return (profiles ?? []).map((p) => ({ ...p, email: emailByUserId.get(p.user_id) ?? null }));
}

export async function updateUserRoleAction(userId: string, role: UserRole): Promise<AdminMutationResult> {
  const session = await requireRole(["admin"]).catch(() => null);
  if (!session) return { success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };

  if (session.userId === userId) {
    return { success: false, error: "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("user_id", userId);
  if (error) return { success: false, error: "บันทึกไม่สำเร็จ: " + error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function setUserActiveAction(userId: string, isActive: boolean): Promise<AdminMutationResult> {
  const session = await requireRole(["admin"]).catch(() => null);
  if (!session) return { success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };

  if (session.userId === userId && !isActive) {
    return { success: false, error: "ไม่สามารถปิดใช้งานบัญชีของตัวเองได้" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("user_id", userId);
  if (error) return { success: false, error: "บันทึกไม่สำเร็จ: " + error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function setUserDepartmentAction(
  userId: string,
  departmentId: string | null
): Promise<AdminMutationResult> {
  const session = await requireRole(["admin"]).catch(() => null);
  if (!session) return { success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ department_id: departmentId }).eq("user_id", userId);
  if (error) return { success: false, error: "บันทึกไม่สำเร็จ: " + error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Creates a new account: an admin-only invite flow. The new user receives a
 * temporary password they must change (Supabase sends no email here — the
 * admin must relay the temporary password out-of-band, matching "no
 * self-service signup without approval").
 */
export async function createUserAction(
  _prev: AdminMutationResult,
  formData: FormData
): Promise<AdminMutationResult> {
  const callerSession = await requireRole(["admin"]).catch(() => null);
  if (!callerSession) return { success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer") as UserRole;
  const departmentId = String(formData.get("department_id") ?? "") || null;
  const tempPassword = String(formData.get("temp_password") ?? "");

  if (!email || !displayName || !tempPassword) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }
  if (tempPassword.length < 8) {
    return { success: false, error: "รหัสผ่านชั่วคราวต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (createError || !created.user) {
    return { success: false, error: "สร้างบัญชีไม่สำเร็จ: " + (createError?.message ?? "") };
  }

  // The DB trigger auto-creates a profile row (role=viewer, is_active=false).
  // Promote it to the requested role/department/active state using the
  // caller's own (RLS-respecting) session so the audit trail correctly
  // attributes this change to the admin who performed it.
  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role, department_id: departmentId, is_active: true, display_name: displayName })
    .eq("user_id", created.user.id);

  if (updateError) {
    return { success: false, error: "สร้างบัญชีสำเร็จ แต่ตั้งค่าสิทธิ์ไม่สำเร็จ: " + updateError.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
