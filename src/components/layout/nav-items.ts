import type { LucideIcon } from "lucide-react";
import { BookUser, Star, Users, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "สมุดโทรศัพท์", icon: BookUser, roles: ["admin", "editor", "viewer"] },
  { href: "/favorites", label: "รายการโปรด", icon: Star, roles: ["admin", "editor", "viewer"] },
  { href: "/manage", label: "จัดการรายชื่อ", icon: Users, roles: ["admin", "editor"] },
  { href: "/admin", label: "ผู้ดูแลระบบ", icon: ShieldCheck, roles: ["admin"] },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
