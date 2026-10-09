import { notFound } from "next/navigation";
import { getContactById } from "@/lib/actions/contacts";
import { getDepartmentById } from "@/lib/actions/departments";
import { listFavoriteIds } from "@/lib/actions/favorites";
import { requireSession, canEditContacts } from "@/lib/auth";
import { ContactActionsBar } from "@/components/contacts/ContactActionsBar";
import { DetailField } from "@/components/contacts/DetailField";
import { RecordView } from "@/components/phonebook/RecordView";
import { Badge } from "@/components/ui/Badge";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const contact = await getContactById(id);
  if (!contact) notFound();

  const [department, favoriteIds] = await Promise.all([
    contact.department_id ? getDepartmentById(contact.department_id) : Promise.resolve(null),
    listFavoriteIds(),
  ]);

  const fullName = [contact.prefix, contact.first_name, contact.last_name].filter(Boolean).join(" ");
  const roleCanEdit = canEditContacts(session.profile.role);
  const canEdit =
    roleCanEdit &&
    (session.profile.role === "admin" ||
      !contact.department_id ||
      contact.department_id === session.profile.department_id);

  const updatedAt = new Date(contact.updated_at).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 md:p-6">
      <RecordView id={contact.id} name={fullName} position={contact.position} />

      <ContactActionsBar
        contactId={contact.id}
        fullName={fullName}
        isFavorite={favoriteIds.includes(contact.id)}
        isActive={contact.is_active}
        canEdit={canEdit}
      />

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{fullName}</h1>
            {contact.nickname && <p className="text-sm text-muted-foreground">ชื่อเล่น: {contact.nickname}</p>}
          </div>
          {!contact.is_active && <Badge tone="warning">ปิดใช้งาน</Badge>}
        </div>

        <div className="flex flex-col">
          <DetailField label="ยศ / คำนำหน้า" value={contact.prefix} />
          <DetailField label="ตำแหน่ง" value={contact.position} />
          <DetailField label="หน่วยงาน" value={department?.name ?? null} />
          <DetailField label="เบอร์มือถือ" value={contact.mobile_phone} type="phone" />
          <DetailField label="เบอร์สำนักงาน" value={contact.office_phone} type="phone" />
          <DetailField label="เบอร์ภายใน" value={contact.extension} />
          <DetailField label="อีเมล" value={contact.email} type="email" />
          <DetailField label="สถานที่ปฏิบัติงาน" value={contact.work_location} />
          <DetailField label="หมายเหตุ" value={contact.notes} />
          <DetailField label="แก้ไขล่าสุด" value={updatedAt} />
        </div>
      </div>
    </div>
  );
}
