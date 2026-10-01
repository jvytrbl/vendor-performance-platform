import sql from "mssql";
import { getDbPool, type DbExecutor } from "@/lib/db";
import { logAudit } from "./logAudit";
import type { AuditAction, AuditTargetType } from "./auditTypes";

// The verified identity shape withAuth's handlers receive — duplicated here
// (rather than imported) to avoid a circular import with lib/withAuth.ts;
// structurally identical to Extract<AuthResult, { valid: true }>.
interface VerifiedIdentity {
  email: string;
  oid: string;
  tid: string;
}

export interface WithAuditParams<T> {
  auth: VerifiedIdentity;
  action: AuditAction;
  targetType: AuditTargetType;
  // A fixed id (edit/delete/finalize/generate already know it from the URL)
  // or a function deriving it from the mutation's own result — needed for
  // create, where the id doesn't exist until the INSERT returns it.
  targetId: number | ((result: T) => number);
  ipAddress: string | null;
}

// Runs `mutate` and the resulting audit row in the SAME database transaction:
// either both are committed, or neither is. This is called explicitly around
// a single repository mutation call (not wrapped around a whole route
// handler like withAuth) — deliberately, because one of the five audited
// routes (POST /api/reports/:id/generate) does a long-running external AI
// call between claiming and saving, and holding a SQL transaction open across
// that call would tie up a pooled connection and its locks for the entire
// AI round-trip. Scoping the transaction tightly to just the DB write avoids
// that; the other four routes are pure DB work, so this still ends up
// wrapping their entire meaningful action.
export async function withAudit<T>(
  params: WithAuditParams<T>,
  mutate: (executor: DbExecutor) => Promise<T>
): Promise<T> {
  // A fixed targetId is validated up front, same as before. A derived one
  // can't be checked until after mutate() runs (see below) — it's still
  // checked, just later, inside the same transaction so a bad derived id
  // still rolls back the mutation rather than leaving it committed.
  if (typeof params.targetId === "number" && (!Number.isInteger(params.targetId) || params.targetId <= 0)) {
    throw new Error(`withAudit: targetId must be a positive integer, got ${params.targetId}`);
  }

  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const result = await mutate(transaction);

    const targetId = typeof params.targetId === "function" ? params.targetId(result) : params.targetId;
    if (!Number.isInteger(targetId) || targetId <= 0) {
      throw new Error(`withAudit: targetId must be a positive integer, got ${targetId}`);
    }

    await logAudit(transaction, {
      userEmail: params.auth.email,
      userOid: params.auth.oid,
      userTid: params.auth.tid,
      action: params.action,
      targetType: params.targetType,
      targetId,
      ipAddress: params.ipAddress,
    });

    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      // The connection may already be broken (e.g. the error that got us
      // here was a connection failure) — that's not the error the caller
      // needs to see, so it's logged but not thrown in place of the original.
      console.error("withAudit: rollback failed", rollbackError);
    }
    throw error;
  }
}
