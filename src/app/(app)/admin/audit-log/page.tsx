import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { searchAuditLogs } from "@/lib/actions/audit";
import { AuditLogFilters, ACTION_LABELS } from "@/components/admin/AuditLogFilters";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { History } from "lucide-react";
import type { AuditAction } from "@/lib/supabase/types";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; action?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("display_name");

  const { logs, total, pageSize } = await searchAuditLogs({
    actorId: params.actor,
    action: params.action as AuditAction | undefined,
    dateFrom: params.from,
    dateTo: params.to ? `${params.to}T23:59:59` : undefined,
    page,
  });

  const actorById = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">ประวัติการแก้ไขข้อมูล</h1>
        <p className="text-sm text-muted-foreground">ทั้งหมด {total.toLocaleString("th-TH")} รายการ</p>
      </div>

      <AuditLogFilters actors={profiles ?? []} />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {logs.length === 0 ? (
          <EmptyState icon={History} title="ไม่พบประวัติที่ตรงกับตัวกรอง" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-muted text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">วันที่/เวลา</th>
                  <th className="px-3 py-2.5">ผู้ดำเนินการ</th>
                  <th className="px-3 py-2.5">การกระทำ</th>
                  <th className="px-3 py-2.5">ประเภทข้อมูล</th>
                  <th className="px-3 py-2.5">รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-3 py-2.5">{log.actor_id ? actorById.get(log.actor_id) ?? "—" : "ระบบ"}</td>
                    <td className="px-3 py-2.5">{ACTION_LABELS[log.action] ?? log.action}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{log.record_type}</td>
                    <td className="max-w-xs px-3 py-2.5">
                      <details>
                        <summary className="cursor-pointer text-xs text-accent">ดูข้อมูล</summary>
                        <pre className="mt-1 max-w-xs overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
                          {JSON.stringify(log.changed_fields, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} />
      </div>
    </div>
  );
}
