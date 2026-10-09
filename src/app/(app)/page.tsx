import { searchContacts } from "@/lib/actions/contacts";
import { listDepartments } from "@/lib/actions/departments";
import { listFavoriteIds } from "@/lib/actions/favorites";
import { getOptionalSession } from "@/lib/auth";
import { PhonebookControls } from "@/components/phonebook/PhonebookControls";
import { ContactList } from "@/components/phonebook/ContactList";
import { RecentlyViewedStrip } from "@/components/phonebook/RecentlyViewedStrip";
import { Pagination } from "@/components/ui/Pagination";

const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "องค์กร";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; all?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await getOptionalSession();
  const canSeeInactive = !!session && session.profile.role !== "viewer";
  const includeInactive = canSeeInactive && params.all === "1";
  const page = Math.max(1, Number(params.page) || 1);

  const [{ contacts, total, pageSize }, departments, favoriteIds] = await Promise.all([
    searchContacts({
      q: params.q,
      departmentId: params.dept,
      includeInactive,
      page,
    }),
    listDepartments(),
    session ? listFavoriteIds() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">สมุดโทรศัพท์ {orgName}</h1>
        <p className="text-sm text-muted-foreground">ทั้งหมด {total.toLocaleString("th-TH")} รายชื่อ</p>
      </div>

      <RecentlyViewedStrip />

      <PhonebookControls departments={departments} canSeeInactive={canSeeInactive} />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <ContactList
          contacts={contacts}
          departments={departments}
          favoriteIds={favoriteIds}
          canFavorite={!!session}
        />
        <Pagination page={page} pageSize={pageSize} total={total} />
      </div>
    </div>
  );
}
