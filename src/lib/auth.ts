import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/types";

export interface SessionContext {
  userId: string;
  email: string | null;
  profile: Profile;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Loads the current authenticated user + their profile row, re-checking
 * authorization on the server (never trust a role claimed by the client).
 * Throws AuthError if not signed in, profile missing, or account disabled.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new AuthError("กรุณาเข้าสู่ระบบก่อนใช้งาน");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new AuthError("ไม่พบข้อมูลผู้ใช้ในระบบ กรุณาติดต่อผู้ดูแลระบบ");
  }

  if (!profile.is_active) {
    throw new AuthError("บัญชีของคุณถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
  }

  return { userId: userData.user.id, email: userData.user.email ?? null, profile };
}

export async function requireRole(roles: UserRole[]): Promise<SessionContext> {
  const session = await requireSession();
  if (!roles.includes(session.profile.role)) {
    throw new AuthError("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }
  return session;
}

export const canEditContacts = (role: UserRole) => role === "admin" || role === "editor";
export const canManageAdmin = (role: UserRole) => role === "admin";
