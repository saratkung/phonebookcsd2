"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export function Pagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function goTo(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        แสดง {from}–{to} จาก {total} รายการ
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => goTo(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="size-4" /> ก่อนหน้า
        </Button>
        <span className="text-xs text-muted-foreground">
          หน้า {page} / {totalPages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => goTo(page + 1)} disabled={page >= totalPages}>
          ถัดไป <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
