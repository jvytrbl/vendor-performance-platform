"use client";

import type { ReportListItem } from "@/lib/api/reports";
import { formatReportForTable } from "@/lib/ui/reports/formatReportForTable";
import ReportRow from "./ReportRow";

interface ReportTableProps {
  reports: ReportListItem[];
  emptyMessage: string;
}

export default function ReportTable({ reports, emptyMessage }: ReportTableProps) {
  if (reports.length === 0) {
    return (
      <div className="overflow-x-auto min-w-0 w-full rounded border border-border bg-surface">
        <p className="py-16 text-center text-sm text-foreground-muted">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto min-w-0 w-full rounded border border-border bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left">
            <th className="w-12 px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              #
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Reference
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Period Type
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Period
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Status
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => (
            <ReportRow
              key={report.id}
              row={formatReportForTable(report)}
              index={index + 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
