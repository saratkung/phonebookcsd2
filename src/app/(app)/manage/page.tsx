import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { searchContacts } from "@/lib/actions/contacts";
import { listDepartments } from "@/lib/actions/departments";
import { PhonebookControls } from "@/components/phonebook/PhonebookControls";
import { ManageRow } from "@/components/manage/ManageRow";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserX } from "lucide-react";

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; all?: string; page?: string }>;
}) {
  await requireRole(["admin", "editor"]);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ contacts, total, pageSize }, departments] = await Promise.all([
    searchContacts({ q: params.q, departmentId: params.dept, includeInactive: true, page }),
    listDepartments(),
  ]);

  const departmentsById = new Map(departments.map((d) => [d.id, d.name]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">จัดการรายชื่อ</h1>
          <p className="text-sm text-muted-foreground">ทั้งหมด {total.toLocaleString("th-TH")} รายชื่อ</p>
        </div>
        <div className="flex gap-2">
          <Link href="/manage/import">
            <Button variant="secondary">
              <Upload className="size-4" /> นำเข้าข้อมูล
            </Button>
          </Link>
          <Link href="/contacts/new">
            <Button>
              <Plus className="size-4" /> เพิ่มรายชื่อ
            </Button>
          </Link>
        </div>
      </div>

      <PhonebookControls departments={departments} canSeeInactive showInactiveToggle={false} />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {contacts.length === 0 ? (
          <EmptyState icon={UserX} title="ไม่พบรายชื่อ" description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง" />
        ) : (
          contacts.map((c) => (
            <ManageRow key={c.id} contact={c} departmentName={c.department_id ? departmentsById.get(c.department_id) ?? null : null} />
          ))
        )}
        <Pagination page={page} pageSize={pageSize} total={total} />
      </div>
    </div>
  );
}
