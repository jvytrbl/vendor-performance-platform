import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { isAuditLogAdmin } from "@/lib/auth/isAuditLogAdmin";
import { parseAuditLogFilters } from "@/lib/domain/auditLog/auditLogListQuery";
import { listAuditLog } from "@/lib/repositories/auditLog";
import { generateAuditLogPdf } from "@/lib/exports/generateAuditLogPdf";

// A PDF export has no pagination UI to page through — unlike the on-screen
// table, it must fetch every matching row (or as many as this cap allows) in
// one call. There's no existing precedent for a row cap in this codebase
// (D1's report export is always exactly one report, inherently bounded), so
// this is a fresh decision: cap at 5,000 rows and note the truncation on the
// PDF itself rather than running an unbounded query.
const AUDIT_LOG_EXPORT_ROW_CAP = 5000;

export const GET = withAuth(async (request, auth) => {
  if (!isAuditLogAdmin(auth.email)) {
    return NextResponse.json(
      { error: "You do not have access to the audit log", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const params = new URL(request.url).searchParams;
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

  const { entries, total } = await listAuditLog({
    limit: AUDIT_LOG_EXPORT_ROW_CAP,
    offset: 0,
    userEmail: filters.userEmail,
    action: filters.action,
    targetType: filters.targetType,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  const buffer = await generateAuditLogPdf({ entries, total });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="audit-log-export.pdf"`,
    },
  });
});
