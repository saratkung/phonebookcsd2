/**
 * Seeds fictional sample data for local development/testing. ALL names,
 * emails and phone numbers below are invented — never put real personal
 * data in this file.
 *
 * Usage: npx tsx scripts/seed.ts
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ใน .env.local ก่อน");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DEPARTMENTS = [
  { key: "it", name: "ฝ่ายเทคโนโลยีสารสนเทศ", parent: null },
  { key: "it-dev", name: "งานพัฒนาระบบ", parent: "it" },
  { key: "it-infra", name: "งานโครงสร้างพื้นฐาน", parent: "it" },
  { key: "hr", name: "ฝ่ายบุคคล", parent: null },
  { key: "finance", name: "ฝ่ายการเงิน", parent: null },
] as const;

const SAMPLE_USERS = [
  { email: "admin.demo@example.org", name: "ผู้ดูแลระบบ ตัวอย่าง", role: "admin" as const, dept: null },
  { email: "editor.demo@example.org", name: "เจ้าหน้าที่ สมมติ", role: "editor" as const, dept: "it" },
  { email: "viewer.demo@example.org", name: "ผู้ใช้งาน ทั่วไป", role: "viewer" as const, dept: "hr" },
];

const SAMPLE_CONTACTS = [
  { prefix: "นาย", first: "สมชาย", last: "ใจดี", nick: "ชาย", rank: "-", position: "นักวิชาการคอมพิวเตอร์", dept: "it-dev", mobile: "0812345671", office: "021234501", ext: "1001", email: "somchai.demo@example.org" },
  { prefix: "นาง", first: "สมหญิง", last: "รักเรียน", nick: "หญิง", rank: "-", position: "เจ้าหน้าที่ธุรการ", dept: "hr", mobile: "0812345672", office: "021234502", ext: "1002", email: "somying.demo@example.org" },
  { prefix: "นาย", first: "วิชัย", last: "เก่งกล้า", nick: "ชัย", rank: "-", position: "หัวหน้างานโครงสร้างพื้นฐาน", dept: "it-infra", mobile: "0812345673", office: "021234503", ext: "1003", email: "wichai.demo@example.org" },
  { prefix: "นางสาว", first: "ปราณี", last: "มีสุข", nick: "นี", rank: "-", position: "นักบัญชี", dept: "finance", mobile: null, office: "021234504", ext: "1004", email: "pranee.demo@example.org" },
  { prefix: "นาย", first: "อนุชา", last: "ขยันยิ่ง", nick: "ชา", rank: "-", position: "โปรแกรมเมอร์", dept: "it-dev", mobile: "0812345675", office: "021234505", ext: "1005", email: "anucha.demo@example.org" },
];

async function main() {
  console.log("กำลังสร้างหน่วยงาน...");
  const deptIdByKey = new Map<string, string>();
  for (const d of DEPARTMENTS) {
    const parentId = d.parent ? deptIdByKey.get(d.parent) ?? null : null;
    const { data, error } = await admin
      .from("departments")
      .insert({ name: d.name, parent_id: parentId })
      .select("id")
      .single();
    if (error) throw error;
    deptIdByKey.set(d.key, data.id);
  }

  console.log("กำลังสร้างผู้ใช้ตัวอย่าง...");
  for (const u of SAMPLE_USERS) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: "DemoPass123!",
      email_confirm: true,
      user_metadata: { display_name: u.name },
    });
    if (error) {
      console.warn(`ข้าม ${u.email}: ${error.message}`);
      continue;
    }
    await admin
      .from("profiles")
      .update({ role: u.role, is_active: true, department_id: u.dept ? deptIdByKey.get(u.dept) : null, display_name: u.name })
      .eq("user_id", created.user!.id);
  }

  console.log("กำลังสร้างรายชื่อตัวอย่าง...");
  for (const c of SAMPLE_CONTACTS) {
    const { error } = await admin.from("contacts").insert({
      prefix: c.prefix,
      first_name: c.first,
      last_name: c.last,
      nickname: c.nick,
      rank: c.rank,
      position: c.position,
      department_id: deptIdByKey.get(c.dept) ?? null,
      mobile_phone: c.mobile,
      office_phone: c.office,
      extension: c.ext,
      email: c.email,
      work_location: "อาคารสำนักงานใหญ่",
    });
    if (error) console.warn(`ข้ามรายชื่อ ${c.first} ${c.last}: ${error.message}`);
  }

  console.log("เสร็จสิ้น! บัญชีตัวอย่าง (รหัสผ่าน: DemoPass123!):");
  for (const u of SAMPLE_USERS) console.log(`  - ${u.email} (${u.role})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
