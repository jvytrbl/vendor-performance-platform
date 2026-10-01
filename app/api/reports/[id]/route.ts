import { NextResponse } from "next/server";
import { withAuth } from "../../../../lib/withAuth";
import { validateReportSections } from "../../../../lib/domain/reports/validateReportSections";
import { getReportById, updateReportSections, deleteReport } from "@/lib/repositories/reports";
import { withAudit } from "@/lib/audit/withAudit";
import { getClientIp } from "@/lib/http/getClientIp";

function parseReportId(id: string): number | null {
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return null;
  }
  return reportId;
}

export const GET = withAuth<{ params: Promise<{ id: string }> }>(
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

    const report = await getReportById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: "Report not found", code: "REPORT_NOT_FOUND", field: "id" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: report });
  }
);

export const PUT = withAuth<{ params: Promise<{ id: string }> }>(
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

    const body = await request.json();
    const validation = validateReportSections(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: validation.code, field: validation.field },
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
          error: "Finalized reports cannot be edited",
          code: "REPORT_FINALIZED",
          field: "id",
        },
        { status: 409 }
      );
    }

    const updated = await withAudit(
      {
        auth,
        action: "report.edited",
        targetType: "Report",
        targetId: reportId,
        ipAddress: getClientIp(request),
      },
      (executor) => updateReportSections(reportId, validation.data, executor)
    );
    return NextResponse.json({ data: updated });
  }
);

export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(
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
            error: "Finalized reports cannot be deleted",
            code: "REPORT_FINALIZED",
            field: "id",
          },
          { status: 409 }
        );
      }
  
      await withAudit(
        {
          auth,
          action: "report.deleted",
          targetType: "Report",
          targetId: reportId,
          ipAddress: getClientIp(request),
        },
        (executor) => deleteReport(reportId, executor)
      );
      return NextResponse.json({ ok: true });
    }
  );