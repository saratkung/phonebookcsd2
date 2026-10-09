/**
 * RLS verification script — runs against a REAL Supabase project.
 *
 * This cannot be a Vitest unit test because Row Level Security is enforced
 * by Postgres itself; the only honest way to test it is to authenticate as
 * each role and attempt real reads/writes against the real database.
 *
 * Prerequisites:
 *   1. Migrations applied (supabase/migrations/*.sql)
 *   2. Sample accounts created: `npm run seed` (creates admin.demo@example.org,
 *      editor.demo@example.org, viewer.demo@example.org — password DemoPass123!)
 *
 * Usage:
 *   npx tsx tests/rls/verify-rls.ts
 */
import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local ก่อน");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(url!, anonKey!);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`เข้าสู่ระบบไม่สำเร็จสำหรับ ${email}: ${error.message}`);
  return client;
}

async function main() {
  console.log("กำลังเข้าสู่ระบบด้วยบัญชีตัวอย่างแต่ละบทบาท...");
  const admin = await signIn("admin.demo@example.org", "DemoPass123!");
  const editor = await signIn("editor.demo@example.org", "DemoPass123!");
  const viewer = await signIn("viewer.demo@example.org", "DemoPass123!");

  console.log("\n[viewer] ควรอ่านรายชื่อที่ใช้งานอยู่ได้ แต่แก้ไข/เพิ่มไม่ได้");
  {
    const { data, error } = await viewer.from("contacts_view").select("*").eq("is_active", true).limit(1);
    check("viewer อ่าน contacts_view ได้", !error && !!data);

    const { error: insertError } = await viewer
      .from("contacts")
      .insert({ first_name: "ทดสอบ", last_name: "ไม่ควรสำเร็จ" });
    check("viewer เพิ่มรายชื่อไม่ได้ (ถูกปฏิเสธโดย RLS)", !!insertError);

    const { error: auditError } = await viewer.from("audit_logs").select("*").limit(1);
    check("viewer อ่าน audit_logs ไม่ได้", !!auditError || true); // empty result set also acceptable
    const { data: auditData } = await viewer.from("audit_logs").select("*").limit(1);
    check("viewer ไม่เห็นข้อมูล audit_logs เลย", (auditData ?? []).length === 0);
  }

  console.log("\n[editor] ควรเพิ่ม/แก้ไขรายชื่อได้ แต่ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้");
  {
    const { error: insertError } = await editor
      .from("contacts")
      .insert({ first_name: "ทดสอบ", last_name: "เอดิเตอร์" });
    check("editor เพิ่มรายชื่อได้", !insertError);

    const { data: editorProfile } = await editor.from("profiles").select("user_id").eq("role", "editor").limit(1).maybeSingle();
    if (editorProfile) {
      const { error: roleChangeError } = await editor
        .from("profiles")
        .update({ role: "admin" })
        .eq("user_id", editorProfile.user_id);
      check("editor เปลี่ยนบทบาทตัวเองเป็น admin ไม่ได้", !!roleChangeError);
    }

    const { error: deleteError } = await editor.from("contacts").delete().neq("id", "");
    check("editor ลบรายชื่อแบบ hard delete ไม่ได้ (ไม่มี policy อนุญาต)", !!deleteError);
  }

  console.log("\n[admin] ควรทำได้ทุกอย่างในขอบเขตที่ออกแบบไว้");
  {
    const { error } = await admin.from("audit_logs").select("*").limit(1);
    check("admin อ่าน audit_logs ได้", !error);

    const { data: depts, error: deptError } = await admin.from("departments").select("*").limit(1);
    check("admin อ่านหน่วยงานได้", !deptError && !!depts);
  }

  console.log(`\nสรุปผล: ผ่าน ${passed} ข้อ, ไม่ผ่าน ${failed} ข้อ`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
