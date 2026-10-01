// AUDIT_LOG.action/target_type have no DB CHECK constraint (migration 004)
// specifically so this list can widen across phases without a schema change
// — only this file needs editing when a new action/target is added.
//
// These are `as const` arrays, not just types, so the same list can be
// validated against at runtime (the /api/audit-log filter) and rendered into
// the admin viewer's action dropdown — one source of truth, so the dropdown
// can never drift out of sync with what the type actually allows.
export const AUDIT_ACTIONS = [
  "report.created",
  "report.edited",
  "report.deleted",
  "report.finalized",
  "report.generated",
  "vendor.created",
  "vendor.deleted",
  "transaction.created",
  "transaction.edited",
  "transaction.deleted",
  "transaction.bulk_uploaded",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_TARGET_TYPES = ["Report", "Vendor", "Transaction"] as const;

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];
