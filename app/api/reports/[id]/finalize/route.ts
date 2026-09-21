import { NextResponse } from "next/server";
import { withAuth } from "../../../../../lib/withAuth";
import { validateReportReadyToFinalize } from "../../../../../lib/domain/reports/validateReportReadyToFinalize";
import { getReportById, finalizeReport } from "@/lib/repositories/reports";

function parseReportId(id: string): number | null {
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return null;
  }
  return reportId;
}

export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (_request, _auth, context) => {
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

    const validation = validateReportReadyToFinalize(existing);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: validation.code, field: validation.field },
        { status: 400 }
      );
    }

    const finalized = await finalizeReport(reportId);
    return NextResponse.json({ data: finalized });
  }
);