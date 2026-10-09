"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDepartmentAction } from "@/lib/actions/departments";
import type { Department } from "@/lib/supabase/types";

export function CreateDepartmentForm({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      show("warning", "กรุณากรอกชื่อหน่วยงาน");
      return;
    }
    const formData = new FormData();
    formData.set("name", name);
    formData.set("parent_id", parentId);
    startTransition(async () => {
      const res = await createDepartmentAction(formData);
      if (res.success) {
        show("success", "เพิ่มหน่วยงานแล้ว");
        setName("");
        setParentId("");
        router.refresh();
      } else {
        show("error", res.error ?? "เพิ่มไม่สำเร็จ");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex-1 min-w-[10rem]">
        <label htmlFor="new-dept-name" className="mb-1 block text-xs text-muted-foreground">
          ชื่อหน่วยงานใหม่
        </label>
        <Input id="new-dept-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ฝ่ายเทคโนโลยีสารสนเทศ" />
      </div>
      <div className="min-w-[10rem]">
        <label htmlFor="new-dept-parent" className="mb-1 block text-xs text-muted-foreground">
          สังกัดหน่วยงาน (ถ้ามี)
        </label>
        <Select id="new-dept-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">— หน่วยงานหลัก —</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" loading={pending}>
        <Plus className="size-4" /> เพิ่มหน่วยงาน
      </Button>
    </form>
  );
}
