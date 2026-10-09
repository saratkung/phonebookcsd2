import { redirect, notFound } from "next/navigation";
import { requireSession, canEditContacts } from "@/lib/auth";
import { listDepartments } from "@/lib/actions/departments";
import { getContactById, updateContactAction } from "@/lib/actions/contacts";
import { ContactForm } from "@/components/contacts/ContactForm";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (!canEditContacts(session.profile.role)) redirect("/");

  const contact = await getContactById(id);
  if (!contact) notFound();

  if (
    session.profile.role === "editor" &&
    contact.department_id &&
    contact.department_id !== session.profile.department_id
  ) {
    redirect(`/contacts/${id}`);
  }

  const departments = await listDepartments();
  const boundAction = updateContactAction.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-foreground">แก้ไขรายชื่อ</h1>
      <div className="rounded-xl border border-border bg-surface p-5">
        <ContactForm
          contact={contact}
          departments={departments}
          canChooseAnyDepartment={session.profile.role === "admin"}
          defaultDepartmentId={session.profile.department_id}
          action={boundAction}
        />
      </div>
    </div>
  );
}
