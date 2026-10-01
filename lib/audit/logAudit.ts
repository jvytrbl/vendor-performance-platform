import type { DbExecutor } from "@/lib/db";
import type { AuditAction, AuditTargetType } from "./auditTypes";

export interface AuditEntry {
  // Identity fields must come from the verified AuthResult (lib/auth.ts),
  // never from a request body — callers should be passing auth.email/oid/tid,
  // not anything client-supplied.
  userEmail: string;
  userOid: string;
  userTid: string;
  action: AuditAction;
  targetType: AuditTargetType;
  // Usually a real row id (always >= 1, IDENTITY columns start at 1), but
  // the bulk-upload summary row repurposes this as a successful-insert count,
  // which can legitimately be 0 — so this only rejects negative/non-integer
  // values, not zero. withAudit's own targetId check (used by every route
  // that logs against a real row) stays strictly > 0.
  targetId: number;
  ipAddress: string | null;
}

// Inserts one AUDIT_LOG row on the given executor (a plain pool call, or a
// transaction shared with the mutation it's auditing — see withAudit).
// created_at is DB-generated (migration 004's default), never passed here.
export async function logAudit(executor: DbExecutor, entry: AuditEntry): Promise<void> {
  if (!Number.isInteger(entry.targetId) || entry.targetId < 0) {
    throw new Error(`logAudit: targetId must be a non-negative integer, got ${entry.targetId}`);
  }

  await executor
    .request()
    .input("user_oid", entry.userOid)
    .input("user_tid", entry.userTid)
    .input("user_email", entry.userEmail)
    .input("action", entry.action)
    .input("target_type", entry.targetType)
    .input("target_id", entry.targetId)
    .input("ip_address", entry.ipAddress)
    .query(
      `INSERT INTO AUDIT_LOG (user_oid, user_tid, user_email, action, target_type, target_id, ip_address)
       VALUES (@user_oid, @user_tid, @user_email, @action, @target_type, @target_id, @ip_address)`
    );
}
