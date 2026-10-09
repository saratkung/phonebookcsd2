"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createUserAction, type AdminMutationResult } from "@/lib/actions/admin";
import type { Department } from "@/lib/supabase/types";

const initialState: AdminMutationResult = { success: false };

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function CreateUserForm({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const { show } = useToast();
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  useEffect(() => {
    if (state.success) {
      show("success", "สร้างบัญชีผู้ใช้เรียบร้อยแล้ว กรุณาส่งรหัสผ่านชั่วคราวให้ผู้ใช้ผ่านช่องทางที่ปลอดภัย");
      router.push("/admin/users");
    } else if (state.error) {
      show("error", state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="ชื่อที่แสดง" htmlFor="display_name" required>
        <Input id="display_name" name="display_name" required />
      </Field>
      <Field label="อีเมล" htmlFor="email" required>
        <Input id="email" name="email" type="email" required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="บทบาท" htmlFor="role" required>
          <Select id="role" name="role" defaultValue="viewer">
            <option value="viewer">ผู้ใช้งานทั่วไป</option>
            <option value="editor">เจ้าหน้าที่ข้อมูล</option>
            <option value="admin">ผู้ดูแลระบบ</option>
          </Select>
        </Field>
        <Field label="หน่วยงาน" htmlFor="department_id">
          <Select id="department_id" name="department_id" defaultValue="">
            <option value="">— ไม่ระบุ —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="รหัสผ่านชั่วคราว" htmlFor="temp_password" required>
        <div className="flex gap-2">
          <Input id="temp_password" name="temp_password" defaultValue={generateTempPassword()} required minLength={8} />
        </div>
        <p className="text-xs text-muted-foreground">
          แจ้งรหัสผ่านนี้ให้ผู้ใช้ผ่านช่องทางที่ปลอดภัย (ไม่ใช่อีเมลแบบเปิด) ผู้ใช้ควรเปลี่ยนรหัสผ่านทันทีที่เข้าสู่ระบบครั้งแรก
        </p>
      </Field>

      <Button type="submit" loading={pending} className="w-full">
        <UserPlus className="size-4" /> สร้างบัญชี
      </Button>
    </form>
  );
}
