import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES, type AuditAction, type AuditTargetType } from "@/lib/audit/auditTypes";

export interface AuditLogFilterInput {
  userEmail?: string | null;
  action?: string | null;
  targetType?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export type ParsedAuditLogFilters =
  | {
      ok: true;
      userEmail?: string;
      action?: AuditAction;
      targetType?: AuditTargetType;
      dateFrom?: string;
      dateTo?: string;
    }
  | { ok: false; field: "action" | "targetType" | "dateFrom" | "dateTo"; error: string };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function likePattern(term: string): string {
  const escaped = term.replace(/[%_\[\]]/g, (char) => `[${char}]`);
  return `%${escaped}%`;
}

export function parseAuditLogFilters(input: AuditLogFilterInput): ParsedAuditLogFilters {
  const userEmail = input.userEmail?.trim() || undefined;

  const action = input.action?.trim() || undefined;
  if (action !== undefined && !(AUDIT_ACTIONS as readonly string[]).includes(action)) {
    return { ok: false, field: "action", error: `action must be one of: ${AUDIT_ACTIONS.join(", ")}` };
  }

  const targetType = input.targetType?.trim() || undefined;
  if (targetType !== undefined && !(AUDIT_TARGET_TYPES as readonly string[]).includes(targetType)) {
    return {
      ok: false,
      field: "targetType",
      error: `targetType must be one of: ${AUDIT_TARGET_TYPES.join(", ")}`,
    };
  }

  const dateFrom = input.dateFrom?.trim() || undefined;
  if (dateFrom !== undefined && !ISO_DATE_PATTERN.test(dateFrom)) {
    return { ok: false, field: "dateFrom", error: "dateFrom must be an ISO date (YYYY-MM-DD)" };
  }

  const dateTo = input.dateTo?.trim() || undefined;
  if (dateTo !== undefined && !ISO_DATE_PATTERN.test(dateTo)) {
    return { ok: false, field: "dateTo", error: "dateTo must be an ISO date (YYYY-MM-DD)" };
  }

  return {
    ok: true,
    userEmail,
    action: action as AuditAction | undefined,
    targetType: targetType as AuditTargetType | undefined,
    dateFrom,
    dateTo,
  };
}

export interface AuditLogQueryParts {
  whereClause: string;
  bindings: { name: string; value: string }[];
}

export function buildAuditLogListQuery(filters: {
  userEmail?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  dateFrom?: string;
  dateTo?: string;
}): AuditLogQueryParts {
  const conditions: string[] = [];
  const bindings: { name: string; value: string }[] = [];

  if (filters.userEmail) {
    conditions.push("user_email LIKE @userEmail");
    bindings.push({ name: "userEmail", value: likePattern(filters.userEmail) });
  }

  if (filters.action) {
    conditions.push("action = @action");
    bindings.push({ name: "action", value: filters.action });
  }

  if (filters.targetType) {
    conditions.push("target_type = @targetType");
    bindings.push({ name: "targetType", value: filters.targetType });
  }

  if (filters.dateFrom) {
    conditions.push("created_at >= @dateFrom");
    bindings.push({ name: "dateFrom", value: filters.dateFrom });
  }

  if (filters.dateTo) {
    // dateTo is a date-only boundary (e.g. "2026-09-29"); compared as-is
    // against a datetime2 column it would exclude that entire day's rows,
    // so treat it as inclusive-through-end-of-day instead.
    conditions.push("created_at < DATEADD(day, 1, @dateTo)");
    bindings.push({ name: "dateTo", value: filters.dateTo });
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    bindings,
  };
}
