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

export function Sidebar({ role, orgName }: { role: UserRole; orgName: string }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col bg-sidebar-bg text-sidebar-fg shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-sm text-sidebar-muted">สมุดโทรศัพท์</p>
        <p className="font-semibold text-base leading-tight">{orgName}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-active text-white font-medium"
                      : "text-sidebar-fg hover:bg-sidebar-active/60"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4.5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
