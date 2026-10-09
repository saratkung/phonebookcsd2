/**
 * Bootstraps the very first admin account. Run this once after migrations
 * are applied — there is no self-service signup, so this script is the only
 * way to create the initial administrator.
 *
 * Usage (from the project root, with .env.local populated):
 *   npx tsx scripts/create-admin.ts --email admin@example.org --name "ผู้ดูแลระบบ" --password "TempPass123!"
 *
 * The script uses SUPABASE_SERVICE_ROLE_KEY — never run this from anywhere
 * but a trusted machine/terminal, and never commit the key.
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const value = args[i + 1];
    if (key && value) out[key] = value;
  }
  return out;
}

async function main() {
  const { email, name, password } = parseArgs();

  if (!email || !name || !password) {
    console.error(
      'ใช้งาน: npx tsx scripts/create-admin.ts --email <email> --name "<ชื่อที่แสดง>" --password "<รหัสผ่านชั่วคราว>"'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ใน .env.local ก่อน");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });

  if (createError || !created.user) {
    console.error("สร้างบัญชีไม่สำเร็จ:", createError?.message);
    process.exit(1);
  }

  // The DB trigger (handle_new_auth_user) already created a profile row
  // with role='viewer', is_active=false. Promote it to an active admin.
  const { error: updateError } = await admin
    .from("profiles")
    .update({ role: "admin", is_active: true, display_name: name })
    .eq("user_id", created.user.id);

  if (updateError) {
    console.error("สร้างบัญชีสำเร็จแต่ตั้งสิทธิ์ไม่สำเร็จ:", updateError.message);
    process.exit(1);
  }

  console.log("สร้างบัญชีผู้ดูแลระบบเรียบร้อยแล้ว");
  console.log(`  อีเมล: ${email}`);
  console.log("  กรุณาเปลี่ยนรหัสผ่านทันทีหลังจากเข้าสู่ระบบครั้งแรก");
}

main();
