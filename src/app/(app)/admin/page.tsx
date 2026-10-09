import Link from "next/link";
import { Users, Building2, History, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ count: userCount }, { count: contactCount }, { count: deptCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("departments").select("*", { count: "exact", head: true }),
  ]);

  const cards = [
    { href: "/admin/users", icon: Users, title: "ผู้ใช้งาน", value: userCount ?? 0, description: "จัดการบัญชีและสิทธิ์การใช้งาน" },
    { href: "/admin/departments", icon: Building2, title: "หน่วยงาน", value: deptCount ?? 0, description: "จัดการโครงสร้างหน่วยงาน" },
    { href: "/admin/audit-log", icon: History, title: "รายชื่อที่ใช้งานอยู่", value: contactCount ?? 0, description: "ดูประวัติการแก้ไขข้อมูลทั้งหมด" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-foreground">ผู้ดูแลระบบ</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 hover:border-accent"
          >
            <c.icon className="size-5 text-accent" aria-hidden />
            <p className="text-2xl font-semibold text-foreground">{c.value.toLocaleString("th-TH")}</p>
            <p className="text-sm font-medium text-foreground">{c.title}</p>
            <p className="text-xs text-muted-foreground">{c.description}</p>
            <span className="flex items-center gap-1 text-xs text-accent">
              ไปที่หน้านี้ <ArrowRight className="size-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
