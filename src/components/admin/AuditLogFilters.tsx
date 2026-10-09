"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SlidersHorizontal } from "lucide-react";
import type { AuditAction, Profile } from "@/lib/supabase/types";

const ACTION_LABELS: Record<AuditAction, string> = {
  contact_create: "เพิ่มรายชื่อ",
  contact_update: "แก้ไขรายชื่อ",
  contact_deactivate: "ปิดใช้งานรายชื่อ",
  contact_reactivate: "เปิดใช้งานรายชื่อ",
  contact_import: "นำเข้าข้อมูล",
  profile_role_change: "เปลี่ยนบทบาทผู้ใช้",
  profile_activate: "เปิดใช้งานบัญชี",
  profile_deactivate: "ปิดใช้งานบัญชี",
  department_create: "เพิ่มหน่วยงาน",
  department_update: "แก้ไขหน่วยงาน",
  department_delete: "ลบหน่วยงาน",
};

export function AuditLogFilters({ actors }: { actors: Profile[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["actor", "action", "from", "to"].some((k) => searchParams.get(k));

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="audit-actor" className="mb-1 block text-xs text-muted-foreground">
          ผู้ดำเนินการ
        </label>
        <Select id="audit-actor" defaultValue={searchParams.get("actor") ?? ""} onChange={(e) => update("actor", e.target.value)} className="!h-9 w-40">
          <option value="">ทั้งหมด</option>
          {actors.map((a) => (
            <option key={a.user_id} value={a.user_id}>
              {a.display_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="audit-action" className="mb-1 block text-xs text-muted-foreground">
          ประเภทการกระทำ
        </label>
        <Select id="audit-action" defaultValue={searchParams.get("action") ?? ""} onChange={(e) => update("action", e.target.value)} className="!h-9 w-44">
          <option value="">ทั้งหมด</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="audit-from" className="mb-1 block text-xs text-muted-foreground">
          จากวันที่
        </label>
        <Input id="audit-from" type="date" defaultValue={searchParams.get("from") ?? ""} onChange={(e) => update("from", e.target.value)} className="!h-9 w-36" />
      </div>
      <div>
        <label htmlFor="audit-to" className="mb-1 block text-xs text-muted-foreground">
          ถึงวันที่
        </label>
        <Input id="audit-to" type="date" defaultValue={searchParams.get("to") ?? ""} onChange={(e) => update("to", e.target.value)} className="!h-9 w-36" />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <SlidersHorizontal className="size-3.5" /> ล้างตัวกรอง
        </Button>
      )}
    </div>
  );
}

export { ACTION_LABELS };
