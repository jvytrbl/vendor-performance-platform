import { NextResponse } from "next/server";
import { withAuth } from "../../../../../lib/withAuth";
import {
  validateReportReadyToFinalize,
  isLegacyComparisonDraft,
} from "../../../../../lib/domain/reports/validateReportReadyToFinalize";
import { getReportById, finalizeReport } from "@/lib/repositories/reports";
import { withAudit } from "@/lib/audit/withAudit";
import { getClientIp } from "@/lib/http/getClientIp";

function parseReportId(id: string): number | null {
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return null;
  }
  return reportId;
}

export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, auth, context) => {
    const { id } = await context!.params;
    const reportId = parseReportId(id);

    if (reportId === null) {
      return NextResponse.json(
        {
          error: "Report id must be a positive integer",
          code: "VALIDATION_FAILED",
          field: "id",
        },
        { status: 400 }
      );
    }

    const existing = await getReportById(reportId);
    if (!existing) {
      return NextResponse.json(
        { error: "Report not found", code: "REPORT_NOT_FOUND", field: "id" },
        { status: 404 }
      );
    }

    if (existing.status === "Finalized") {
      return NextResponse.json(
        {
          error: "Report is already finalized",
          code: "REPORT_FINALIZED",
          field: "id",
        },
        { status: 409 }
      );
    }

    const vendorCount = existing.vendor_ids.length;
    const validation = validateReportReadyToFinalize(existing, vendorCount);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: validation.code, field: validation.field },
        { status: 400 }
      );
    }

    // The AI Comparative Analysis section needs an explicit "I have
    // reviewed this" acknowledgement before finalizing, enforced here, not
    // just by disabling the client's Finalize button — same reasoning as
    // every other server-side check in this route. No new column: this is
    // a one-time gate at finalize time, not something persisted.
    const comparisonRequiresAck = vendorCount >= 2 && !isLegacyComparisonDraft(existing);
    if (comparisonRequiresAck) {
      const body = await request.json().catch(() => ({}));
      if (body?.acknowledgedComparisonReview !== true) {
        return NextResponse.json(
          {
            error: "You must confirm you have reviewed the AI Comparative Analysis before finalizing",
            code: "COMPARISON_NOT_ACKNOWLEDGED",
            field: "acknowledgedComparisonReview",
          },
          { status: 400 }
        );
      }
    }

    const finalized = await withAudit(
      {
        auth,
        action: "report.finalized",
        targetType: "Report",
        targetId: reportId,
        ipAddress: getClientIp(request),
      },
      (executor) => finalizeReport(reportId, executor)
    );
    return NextResponse.json({ data: finalized });
  }
);