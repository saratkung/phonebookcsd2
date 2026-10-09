function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `ตัวแปรสภาพแวดล้อม ${name} ไม่ถูกตั้งค่า โปรดคัดลอก .env.example เป็น .env.local แล้วกรอกค่าให้ครบ`
    );
  }
  return value;
}

export const supabaseUrl = () => requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = () => requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const supabaseServiceRoleKey = () => requireEnv("SUPABASE_SERVICE_ROLE_KEY");
