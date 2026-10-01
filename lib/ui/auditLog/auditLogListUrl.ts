import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES, type AuditAction, type AuditTargetType } from "@/lib/audit/auditTypes";

export interface AuditLogListView {
  userEmail: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  dateFrom: string;
  dateTo: string;
  page: number;
}

function asAuditAction(value: string | null): AuditAction | undefined {
  return value && (AUDIT_ACTIONS as readonly string[]).includes(value) ? (value as AuditAction) : undefined;
}

function asAuditTargetType(value: string | null): AuditTargetType | undefined {
  return value && (AUDIT_TARGET_TYPES as readonly string[]).includes(value)
    ? (value as AuditTargetType)
    : undefined;
}

export function parseAuditLogListView(params: URLSearchParams): AuditLogListView {
  const page = Number(params.get("page"));

  return {
    userEmail: params.get("userEmail")?.trim() ?? "",
    action: asAuditAction(params.get("action")),
    targetType: asAuditTargetType(params.get("targetType")),
    dateFrom: params.get("dateFrom")?.trim() ?? "",
    dateTo: params.get("dateTo")?.trim() ?? "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function auditLogListSearchParams(view: AuditLogListView): string {
  const params = new URLSearchParams();
  if (view.userEmail) params.set("userEmail", view.userEmail);
  if (view.action) params.set("action", view.action);
  if (view.targetType) params.set("targetType", view.targetType);
  if (view.dateFrom) params.set("dateFrom", view.dateFrom);
  if (view.dateTo) params.set("dateTo", view.dateTo);
  params.set("page", String(view.page));
  return params.toString();
}

export function withAuditLogListFilterChange(
  current: AuditLogListView,
  patch: Partial<Pick<AuditLogListView, "userEmail" | "action" | "targetType" | "dateFrom" | "dateTo">>
): AuditLogListView {
  return { ...current, ...patch, page: 1 };
}
