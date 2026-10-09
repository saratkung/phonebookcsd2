import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listDepartments } from "@/lib/actions/departments";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

export default async function NewUserPage() {
  await requireRole(["admin"]);
  const departments = await listDepartments();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 md:p-6">
      <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> กลับ
      </Link>
      <h1 className="text-xl font-semibold text-foreground">เพิ่มผู้ใช้ใหม่</h1>
      <div className="rounded-xl border border-border bg-surface p-5">
        <CreateUserForm departments={departments} />
      </div>
    </div>
  );
}
