import type { ReportListItem } from "../../api/reports";

export interface FormattedReportRow {
  id: number;
  referenceNumber: string;
  periodType: string;
  period: string;
  status: string;
  createdAt: string;
}

const PLACEHOLDER = "—";

function formatDate(value: string | undefined): string {
  if (!value) {
    return PLACEHOLDER;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return PLACEHOLDER;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatReportForTable(report: ReportListItem): FormattedReportRow {
  return {
    id: report.id,
    referenceNumber: report.reference_number,
    periodType: report.period_type,
    period: `${formatDate(report.period_start)} – ${formatDate(report.period_end)}`,
    status: report.status,
    createdAt: formatDate(report.created_at),
  };
}
