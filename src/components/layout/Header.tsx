import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/Badge";
import type { UserRole } from "@/lib/supabase/types";

const roleLabel: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ",
  editor: "เจ้าหน้าที่ข้อมูล",
  viewer: "ผู้ใช้งานทั่วไป",
};

export function Header({ displayName, role, orgName }: { displayName: string; role: UserRole; orgName: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="min-w-0 md:hidden">
        <p className="truncate font-semibold text-foreground">{orgName}</p>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
          <Badge tone="accent">{roleLabel[role]}</Badge>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </form>
      </div>
    </header>
  );
}
