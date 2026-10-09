"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { navItemsForRole } from "./nav-items";
import type { UserRole } from "@/lib/supabase/types";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="เมนูหลัก"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs",
              active ? "text-accent font-medium" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
