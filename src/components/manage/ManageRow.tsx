"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { setContactActiveState } from "@/lib/actions/contacts";
import type { Contact } from "@/lib/supabase/types";

export function ManageRow({ contact, departmentName }: { contact: Contact; departmentName: string | null }) {
  const router = useRouter();
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const fullName = [contact.prefix, contact.first_name, contact.last_name].filter(Boolean).join(" ");

  function handleToggleActive() {
    startTransition(async () => {
      const result = await setContactActiveState(contact.id, !contact.is_active);
      setConfirmOpen(false);
      if (result.success) {
        show("success", contact.is_active ? "ปิดใช้งานรายชื่อแล้ว" : "เปิดใช้งานรายชื่อแล้ว");
        router.refresh();
      } else {
        show("error", result.error ?? "ดำเนินการไม่สำเร็จ");
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
        <div className="min-w-0 flex-1">
          <Link href={`/contacts/${contact.id}`} className="font-medium text-foreground hover:text-accent">
            {fullName}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {[contact.position, departmentName].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {!contact.is_active && <Badge tone="warning">ปิดใช้งาน</Badge>}
        <div className="flex shrink-0 items-center gap-1">
          <Link href={`/contacts/${contact.id}/edit`}>
            <Button variant="ghost" size="sm" aria-label="แก้ไข">
              <Pencil className="size-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            aria-label={contact.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
            onClick={() => setConfirmOpen(true)}
          >
            {contact.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={contact.is_active ? `ปิดใช้งานรายชื่อ "${fullName}"?` : `เปิดใช้งานรายชื่อ "${fullName}" อีกครั้ง?`}
        description={
          contact.is_active
            ? "รายชื่อจะไม่แสดงในสมุดโทรศัพท์สำหรับผู้ใช้ทั่วไป แต่ประวัติข้อมูลจะยังคงอยู่"
            : "รายชื่อจะกลับมาแสดงผลตามปกติ"
        }
        confirmLabel={contact.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
        danger={contact.is_active}
        loading={pending}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
