"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Select } from "@/components/ui/Input";
import type { Department } from "@/lib/supabase/types";

export function PhonebookControls({
  departments,
  canSeeInactive,
  showInactiveToggle = true,
}: {
  departments: Department[];
  canSeeInactive: boolean;
  showInactiveToggle?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debouncedQ = useDebouncedValue(q, 350);
  const deptId = searchParams.get("dept") ?? "";
  const includeInactive = searchParams.get("all") === "1";

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedQ === current) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ) params.set("q", debouncedQ);
    else params.delete("q");
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  function updateParam(name: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  const hasFilters = !!q || !!deptId || includeInactive;

  function clearAll() {
    setQ("");
    startTransition(() => router.replace(pathname));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อ นามสกุล ชื่อเล่น ยศ ตำแหน่ง สังกัด หรือเบอร์โทร..."
          aria-label="ค้นหารายชื่อ"
          className="h-14 w-full rounded-xl border border-border bg-surface pl-12 pr-11 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="ล้างคำค้นหา"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={deptId}
          onChange={(e) => updateParam("dept", e.target.value || null)}
          aria-label="กรองตามหน่วยงาน"
          className="!h-9 w-auto min-w-[10rem]"
        >
          <option value="">ทุกหน่วยงาน</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>

        {canSeeInactive && showInactiveToggle && (
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => updateParam("all", e.target.checked ? "1" : null)}
              className="size-4 accent-accent"
            />
            รวมรายชื่อที่ปิดใช้งาน
          </label>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    </div>
  );
}
