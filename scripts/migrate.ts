/**
 * Applies supabase/migrations/*.sql, in filename order, to the database at
 * DATABASE_URL (or constructed from SUPABASE_DB_PASSWORD + SUPABASE_DB_REGION
 * + the project URL in NEXT_PUBLIC_SUPABASE_URL, via the Supabase session
 * pooler — the direct db.<ref>.supabase.co host is IPv6-only on newer
 * projects and often doesn't resolve). Safe to re-run — every migration
 * file uses `create table if not exists` / `create or replace` / `drop ...
 * if exists`.
 *
 * Simplest override: paste the "Session pooler" connection string from
 * Supabase Dashboard > Settings > Database as DATABASE_URL in .env.local.
 *
 * Usage: npx tsx scripts/migrate.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

loadEnv({ path: join(process.cwd(), ".env.local") });

function buildConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const region = process.env.SUPABASE_DB_REGION;
  if (!password || !supabaseUrl || !region) {
    console.error(
      "กรุณาตั้งค่า DATABASE_URL (แนะนำ — คัดลอกจาก Dashboard > Settings > Database > Session pooler) " +
        "หรือ SUPABASE_DB_PASSWORD + SUPABASE_DB_REGION + NEXT_PUBLIC_SUPABASE_URL ใน .env.local"
    );
    process.exit(1);
  }
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
}

async function main() {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("ไม่พบไฟล์ migration ใน supabase/migrations");
    process.exit(1);
  }

  const client = new Client({ connectionString: buildConnectionString(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("เชื่อมต่อฐานข้อมูลสำเร็จ");

  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      process.stdout.write(`กำลังรัน ${file} ... `);
      await client.query(sql);
      console.log("เสร็จแล้ว");
    }
    console.log(`\nรัน migration ครบทั้งหมด ${files.length} ไฟล์สำเร็จ`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nเกิดข้อผิดพลาด:", err.message ?? err);
  process.exit(1);
});
