import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listUsersForAdmin } from "@/lib/actions/admin";
import { listDepartments } from "@/lib/actions/departments";
import { UserRow } from "@/components/admin/UserRow";
import { Button } from "@/components/ui/Button";

export default async function AdminUsersPage() {
  const session = await requireRole(["admin"]);
  const [users, departments] = await Promise.all([listUsersForAdmin(), listDepartments()]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-muted-foreground">ทั้งหมด {users.length} บัญชี</p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <UserPlus className="size-4" /> เพิ่มผู้ใช้ใหม่
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface-muted text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">ผู้ใช้งาน</th>
              <th className="px-3 py-2.5">บทบาท</th>
              <th className="px-3 py-2.5">หน่วยงาน</th>
              <th className="px-3 py-2.5">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.user_id} user={u} departments={departments} isSelf={u.user_id === session.userId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
