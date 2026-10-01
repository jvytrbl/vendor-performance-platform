import type { AuditAction, AuditTargetType } from "@/lib/audit/auditTypes";

export interface AuditLogEntry {
  id: number;
  user_email: string;
  user_oid: string;
  user_tid: string;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: number;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  userEmail?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  total: number;
}

export type FetchAuditLogResult =
  | { outcome: "ok"; page: AuditLogPage }
  | { outcome: "forbidden" }
  | { outcome: "error"; error: string };

export async function fetchAuditLog(
  accessToken: string,
  query: AuditLogQuery = {}
): Promise<FetchAuditLogResult> {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));
  if (query.userEmail) params.set("userEmail", query.userEmail);
  if (query.action) params.set("action", query.action);
  if (query.targetType) params.set("targetType", query.targetType);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);

  const search = params.toString();
  const response = await fetch(`/api/audit-log${search ? `?${search}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 403) {
    return { outcome: "forbidden" };
  }

  const body = await response.json();

  if (!response.ok) {
    return { outcome: "error", error: body.error ?? "Failed to fetch audit log" };
  }

  return { outcome: "ok", page: { entries: body.entries, total: body.total } };
}

export type ExportAuditLogQuery = Omit<AuditLogQuery, "page" | "pageSize">;

export type ExportAuditLogResult =
  | { outcome: "file"; blob: Blob }
  | { outcome: "forbidden" }
  | { outcome: "error"; error: string };

export async function exportAuditLogPdf(
  accessToken: string,
  query: ExportAuditLogQuery = {}
): Promise<ExportAuditLogResult> {
  const params = new URLSearchParams();
  if (query.userEmail) params.set("userEmail", query.userEmail);
  if (query.action) params.set("action", query.action);
  if (query.targetType) params.set("targetType", query.targetType);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);

  const search = params.toString();
  const response = await fetch(`/api/audit-log/export${search ? `?${search}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 403) {
    return { outcome: "forbidden" };
  }

  if (!response.ok) {
    const body = await response.json();
    return { outcome: "error", error: body.error ?? "Failed to export audit log" };
  }

  const blob = await response.blob();
  return { outcome: "file", blob };
}
