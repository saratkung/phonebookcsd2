"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { AuditAction, AuditLog } from "@/lib/supabase/types";

export interface AuditSearchParams {
  actorId?: string;
  action?: AuditAction;
  recordType?: string;
  recordId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditSearchResult {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export async function searchAuditLogs(params: AuditSearchParams): Promise<AuditSearchResult> {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("audit_logs").select("*", { count: "exact" });

  if (params.actorId) query = query.eq("actor_id", params.actorId);
  if (params.action) query = query.eq("action", params.action);
  if (params.recordType) query = query.eq("record_type", params.recordType);
  if (params.recordId) query = query.eq("record_id", params.recordId);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw new Error("โหลดประวัติการแก้ไขไม่สำเร็จ");

  return { logs: (data ?? []) as AuditLog[], total: count ?? 0, page, pageSize };
}
