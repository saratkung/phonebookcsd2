"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

export async function listFavoriteIds(): Promise<string[]> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("contact_id")
    .eq("user_id", session.userId);
  if (error) throw new Error("โหลดรายการโปรดไม่สำเร็จ");
  return (data ?? []).map((f) => f.contact_id);
}

export async function listFavoriteContacts() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: favs, error: favError } = await supabase
    .from("favorites")
    .select("contact_id, created_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });
  if (favError) throw new Error("โหลดรายการโปรดไม่สำเร็จ");

  const ids = (favs ?? []).map((f) => f.contact_id);
  if (ids.length === 0) return [];

  const { data: contacts, error: contactError } = await supabase
    .from("contacts_view")
    .select("*")
    .in("id", ids);
  if (contactError) throw new Error("โหลดข้อมูลรายชื่อโปรดไม่สำเร็จ");

  const byId = new Map((contacts ?? []).map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
}

export async function toggleFavoriteAction(
  contactId: string
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return { success: false, isFavorite: false, error: "กรุณาเข้าสู่ระบบ" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", session.userId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", session.userId)
      .eq("contact_id", contactId);
    if (error) return { success: false, isFavorite: true, error: error.message };
    revalidatePath("/");
    revalidatePath("/favorites");
    return { success: true, isFavorite: false };
  }

  const { error } = await supabase.from("favorites").insert({ user_id: session.userId, contact_id: contactId });
  if (error) return { success: false, isFavorite: false, error: error.message };
  revalidatePath("/");
  revalidatePath("/favorites");
  return { success: true, isFavorite: true };
}
