"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { updateDepartmentAction, deleteDepartmentAction } from "@/lib/actions/departments";
import type { Department } from "@/lib/supabase/types";

export function DepartmentRow({ department, allDepartments, depth }: { department: Department; allDepartments: Department[]; depth: number }) {
  const router = useRouter();
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(department.name);
  const [parentId, setParentId] = useState(department.parent_id ?? "");

  function handleSave() {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("parent_id", parentId);
    formData.set("sort_order", String(department.sort_order));
    startTransition(async () => {
      const res = await updateDepartmentAction(department.id, formData);
      if (res.success) {
        show("success", "บันทึกการเปลี่ยนแปลงแล้ว");
        setEditing(false);
        router.refresh();
      } else {
        show("error", res.error ?? "บันทึกไม่สำเร็จ");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteDepartmentAction(department.id);
      setConfirmDelete(false);
      if (res.success) {
        show("success", "ลบหน่วยงานแล้ว");
        router.refresh();
      } else {
        show("error", res.error ?? "ลบไม่สำเร็จ");
      }
    });
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 last:border-b-0">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="!h-9 w-48" />
        <Select value={parentId} onChange={(e) => setParentId(e.target.value)} className="!h-9 w-48">
          <option value="">— ไม่มีหน่วยงานแม่ —</option>
          {allDepartments
            .filter((d) => d.id !== department.id)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </Select>
        <Button size="sm" onClick={handleSave} loading={pending}>
          <Check className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5 last:border-b-0">
        <span className="text-sm text-foreground" style={{ paddingLeft: `${depth * 1.25}rem` }}>
          {depth > 0 && "— "}
          {department.name}
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label="แก้ไข">
            <Pencil className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} aria-label="ลบ">
            <Trash2 className="size-4 text-danger" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`ลบหน่วยงาน "${department.name}"?`}
        description="จะไม่สามารถลบได้หากยังมีหน่วยงานย่อยหรือรายชื่อผูกอยู่กับหน่วยงานนี้"
        confirmLabel="ลบ"
        danger
        loading={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
