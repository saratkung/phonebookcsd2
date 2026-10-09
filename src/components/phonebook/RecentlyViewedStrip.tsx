"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export function RecentlyViewedStrip() {
  const { items } = useRecentlyViewed();

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <History className="size-3.5" aria-hidden /> เพิ่งเปิดดู
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/contacts/${item.id}`}
            className="flex shrink-0 flex-col rounded-lg border border-border bg-surface px-3 py-2 text-xs hover:border-accent"
          >
            <span className="font-medium text-foreground">{item.name}</span>
            {item.position && <span className="text-muted-foreground">{item.position}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
