import { redirect } from "next/navigation";
import { listFavoriteContacts, listFavoriteIds } from "@/lib/actions/favorites";
import { listDepartments } from "@/lib/actions/departments";
import { getOptionalSession } from "@/lib/auth";
import { ContactList } from "@/components/phonebook/ContactList";

export default async function FavoritesPage() {
  // The (app) layout no longer forces a session (the phonebook itself is
  // public), so pages that genuinely require login must check it themselves.
  const session = await getOptionalSession();
  if (!session) redirect("/login?next=/favorites");

  const [contacts, departments, favoriteIds] = await Promise.all([
    listFavoriteContacts(),
    listDepartments(),
    listFavoriteIds(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">รายการโปรด</h1>
        <p className="text-sm text-muted-foreground">รายชื่อที่คุณบันทึกไว้ ({contacts.length} รายการ)</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <ContactList
          contacts={contacts}
          departments={departments}
          favoriteIds={favoriteIds}
          emptyMessage="กดไอคอนดาวที่รายชื่อเพื่อเพิ่มเข้ารายการโปรด"
        />
      </div>
    </div>
  );
}
