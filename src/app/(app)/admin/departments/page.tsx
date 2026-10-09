import { requireRole } from "@/lib/auth";
import { listDepartments } from "@/lib/actions/departments";
import { DepartmentRow } from "@/components/admin/DepartmentRow";
import { CreateDepartmentForm } from "@/components/admin/CreateDepartmentForm";
import type { Department } from "@/lib/supabase/types";

function flattenTree(departments: Department[]): { department: Department; depth: number }[] {
  const byParent = new Map<string | null, Department[]>();
  for (const d of departments) {
    const key = d.parent_id ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(d);
  }

  const result: { department: Department; depth: number }[] = [];
  function visit(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      result.push({ department: child, depth });
      visit(child.id, depth + 1);
    }
  }
  visit(null, 0);
  return result;
}

export default async function AdminDepartmentsPage() {
  await requireRole(["admin"]);
  const departments = await listDepartments();
  const tree = flattenTree(departments);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">จัดการหน่วยงาน</h1>
        <p className="text-sm text-muted-foreground">ทั้งหมด {departments.length} หน่วยงาน</p>
      </div>

      <CreateDepartmentForm departments={departments} />

      <div className="rounded-xl border border-border bg-surface">
        {tree.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">ยังไม่มีหน่วยงานในระบบ</p>
        ) : (
          tree.map(({ department, depth }) => (
            <DepartmentRow key={department.id} department={department} allDepartments={departments} depth={depth} />
          ))
        )}
      </div>
    </div>
  );
}
