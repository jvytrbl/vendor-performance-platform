import { NextResponse } from "next/server";
import { withAuth } from "../../../../../lib/withAuth";
import { getReportById } from "@/lib/repositories/reports";
import { generatePdfReport } from "../../../../../lib/exports/generatePdfReport";
import { generateDocxReport } from "../../../../../lib/exports/generateDocxReport";

const CONTENT_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

type ExportFormat = keyof typeof CONTENT_TYPES;

function parseReportId(id: string): number | null {
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return null;
  }
  return reportId;
}

function parseFormat(value: string | null): ExportFormat | null {
  if (value === "pdf" || value === "docx") {
    return value;
  }
  return null;
}

export const GET = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, _auth, context) => {
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

    const format = parseFormat(new URL(request.url).searchParams.get("format"));
    if (format === null) {
      return NextResponse.json(
        {
          error: "format must be exactly 'pdf' or 'docx'",
          code: "VALIDATION_FAILED",
          field: "format",
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

    if (existing.status !== "Finalized") {
      return NextResponse.json(
        {
          error: "Only a Finalized report can be exported",
          code: "REPORT_NOT_FINALIZED",
          field: "id",
        },
        { status: 409 }
      );
    }

    const buffer =
      format === "pdf" ? await generatePdfReport(existing) : await generateDocxReport(existing);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[format],
        "Content-Disposition": `attachment; filename="${existing.reference_number}.${format}"`,
      },
    });
  }
);
