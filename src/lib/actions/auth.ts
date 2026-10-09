"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

export interface LoginResult {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
}

export async function loginAction(_prev: LoginResult, formData: FormData): Promise<LoginResult> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: LoginResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "email" | "password";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    return { error: message };
  }

  const nextPath = String(formData.get("next") ?? "/");
  redirect(nextPath.startsWith("/") ? nextPath : "/");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
