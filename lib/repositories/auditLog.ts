import { getDbPool } from "@/lib/db";
import { buildAuditLogListQuery } from "@/lib/domain/auditLog/auditLogListQuery";
import type { AuditAction, AuditTargetType } from "@/lib/audit/auditTypes";

export interface AuditLogRecord {
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

export async function listAuditLog(page: {
  limit: number;
  offset: number;
  userEmail?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ entries: AuditLogRecord[]; total: number }> {
  const pool = await getDbPool();
  const request = pool.request();
  const listQuery = buildAuditLogListQuery(page);
  for (const binding of listQuery.bindings) {
    request.input(binding.name, binding.value);
  }
  request.input("offset", page.offset);
  request.input("limit", page.limit);

  const countResult = await request.query(
    `SELECT COUNT(*) AS total FROM AUDIT_LOG ${listQuery.whereClause}`
  );
  const rowsResult = await request.query(
    `SELECT id, user_email, user_oid, user_tid, action, target_type, target_id, ip_address, created_at
     FROM AUDIT_LOG
     ${listQuery.whereClause}
     ORDER BY created_at DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
  );

  return {
    entries: rowsResult.recordset,
    total: Number(countResult.recordset[0]?.total ?? 0),
  };
}
