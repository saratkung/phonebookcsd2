"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateUserRoleAction, setUserActiveAction, setUserDepartmentAction, type AdminUserRow } from "@/lib/actions/admin";
import type { Department, UserRole } from "@/lib/supabase/types";

export function UserRow({
  user,
  departments,
  isSelf,
}: {
  user: AdminUserRow;
  departments: Department[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  function handleRoleChange(role: UserRole) {
    startTransition(async () => {
      const res = await updateUserRoleAction(user.user_id, role);
      if (res.success) {
        show("success", "เปลี่ยนบทบาทแล้ว");
        router.refresh();
      } else {
        show("error", res.error ?? "ดำเนินการไม่สำเร็จ");
      }
    });
  }

  function handleDepartmentChange(departmentId: string) {
    startTransition(async () => {
      const res = await setUserDepartmentAction(user.user_id, departmentId || null);
      if (res.success) {
        show("success", "เปลี่ยนหน่วยงานแล้ว");
        router.refresh();
      } else {
        show("error", res.error ?? "ดำเนินการไม่สำเร็จ");
      }
    });
  }

  function handleToggleActive() {
    const nextActive = !user.is_active;
    startTransition(async () => {
      const res = await setUserActiveAction(user.user_id, nextActive);
      setConfirmDeactivate(false);
      if (res.success) {
        show("success", nextActive ? "เปิดใช้งานบัญชีแล้ว" : "ปิดใช้งานบัญชีแล้ว");
        router.refresh();
      } else {
        show("error", res.error ?? "ดำเนินการไม่สำเร็จ");
      }
    });
  }

  return (
    <>
      <tr className="border-t border-border">
        <td className="px-3 py-2.5">
          <p className="font-medium text-foreground">
            {user.display_name} {isSelf && <span className="text-xs text-muted-foreground">(คุณ)</span>}
          </p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </td>
        <td className="px-3 py-2.5">
          <Select
            value={user.role}
            disabled={isSelf || pending}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            className="!h-9 w-36"
          >
            <option value="viewer">ผู้ใช้งานทั่วไป</option>
            <option value="editor">เจ้าหน้าที่ข้อมูล</option>
            <option value="admin">ผู้ดูแลระบบ</option>
          </Select>
        </td>
        <td className="px-3 py-2.5">
          <Select
            value={user.department_id ?? ""}
            disabled={pending}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="!h-9 w-40"
          >
            <option value="">— ไม่ระบุ —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </td>
        <td className="px-3 py-2.5">
          <button
            type="button"
            disabled={isSelf || pending}
            onClick={() => (user.is_active ? setConfirmDeactivate(true) : handleToggleActive())}
            className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
              user.is_active ? "bg-green-100 text-success" : "bg-red-100 text-danger"
            }`}
          >
            {user.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          </button>
        </td>
      </tr>

      <ConfirmDialog
        open={confirmDeactivate}
        title={`ปิดใช้งานบัญชีของ "${user.display_name}"?`}
        description="ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง"
        confirmLabel="ปิดใช้งาน"
        danger
        loading={pending}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </>
  );
}
