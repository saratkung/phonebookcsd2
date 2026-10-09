import { redirect } from "next/navigation";
import { requireSession, canEditContacts } from "@/lib/auth";
import { listDepartments } from "@/lib/actions/departments";
import { createContactAction } from "@/lib/actions/contacts";
import { ContactForm } from "@/components/contacts/ContactForm";

export default async function NewContactPage() {
  const session = await requireSession();
  if (!canEditContacts(session.profile.role)) redirect("/");

  const departments = await listDepartments();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-foreground">เพิ่มรายชื่อใหม่</h1>
      <div className="rounded-xl border border-border bg-surface p-5">
        <ContactForm
          departments={departments}
          canChooseAnyDepartment={session.profile.role === "admin"}
          defaultDepartmentId={session.profile.department_id}
          action={createContactAction}
        />
      </div>
    </div>
  );
}
