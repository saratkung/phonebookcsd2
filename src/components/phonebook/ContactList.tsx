"use client";

import { useState } from "react";
import { SearchX } from "lucide-react";
import { ContactRow } from "./ContactRow";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Contact, Department } from "@/lib/supabase/types";

export function ContactList({
  contacts,
  departments,
  favoriteIds,
  emptyMessage,
}: {
  contacts: Contact[];
  departments: Department[];
  favoriteIds: string[];
  emptyMessage?: string;
}) {
  const [favSet] = useState(() => new Set(favoriteIds));
  const departmentsById = new Map(departments.map((d) => [d.id, d.name]));

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="ไม่พบรายชื่อที่ตรงกับการค้นหา"
        description={emptyMessage ?? "ลองค้นหาด้วยคำอื่น หรือล้างตัวกรองเพื่อดูรายชื่อทั้งหมด"}
      />
    );
  }

  return (
    <div>
      {contacts.map((c) => (
        <ContactRow
          key={c.id}
          contact={c}
          departmentName={c.department_id ? departmentsById.get(c.department_id) ?? null : null}
          isFavorite={favSet.has(c.id)}
        />
      ))}
    </div>
  );
}
