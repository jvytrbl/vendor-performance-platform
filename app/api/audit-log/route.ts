import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { isAuditLogAdmin } from "@/lib/auth/isAuditLogAdmin";
import { parsePageParams } from "@/lib/pagination/parsePageParams";
import { parseAuditLogFilters } from "@/lib/domain/auditLog/auditLogListQuery";
import { listAuditLog } from "@/lib/repositories/auditLog";

const AUDIT_LOG_DEFAULT_PAGE_SIZE = 25;
const AUDIT_LOG_MAX_PAGE_SIZE = 100;

export const GET = withAuth(async (request, auth) => {
  // Server-side enforcement is the actual security boundary here — a hidden
  // nav link is not. Every request re-checks this, even a direct URL guess.
  if (!isAuditLogAdmin(auth.email)) {
    return NextResponse.json(
      { error: "You do not have access to the audit log", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const params = new URL(request.url).searchParams;
  const page = parsePageParams(params, {
    defaultPageSize: AUDIT_LOG_DEFAULT_PAGE_SIZE,
    maxPageSize: AUDIT_LOG_MAX_PAGE_SIZE,
  });
  if (!page.ok) {
    return NextResponse.json(
      { error: page.error, code: "VALIDATION_FAILED", field: page.field },
      { status: 400 }
    );
  }

  const filters = parseAuditLogFilters({
    userEmail: params.get("userEmail"),
    action: params.get("action"),
    targetType: params.get("targetType"),
    dateFrom: params.get("dateFrom"),
    dateTo: params.get("dateTo"),
  });
  if (!filters.ok) {
    return NextResponse.json(
      { error: filters.error, code: "VALIDATION_FAILED", field: filters.field },
      { status: 400 }
    );
  }

  const result = await listAuditLog({
    limit: page.limit,
    offset: page.offset,
    userEmail: filters.userEmail,
    action: filters.action,
    targetType: filters.targetType,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  return NextResponse.json(result);
});
