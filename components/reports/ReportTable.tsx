"use client";

import { FileText } from "lucide-react";
import type { ReportListItem } from "@/lib/api/reports";
import { formatReportForTable } from "@/lib/ui/reports/formatReportForTable";
import { pageRowNumber } from "@/components/ui/TablePagination";
import ReportRow from "./ReportRow";

interface ReportTableProps {
  reports: ReportListItem[];
  page: number;
  pageSize: number;
  emptyMessage: string;
  onDelete: (id: number) => void;
  deletingId: number | null;
}

export default function ReportTable({
  reports,
  page,
  pageSize,
  emptyMessage,
  onDelete,
  deletingId,
}: ReportTableProps) {
  if (reports.length === 0) {
    return (
      <div className="overflow-x-auto min-w-0 w-full rounded border border-border bg-surface">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FileText className="h-8 w-8 text-foreground-subtle" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-base text-foreground-muted">{emptyMessage}</p>
        </div>
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
            <th className="px-5 py-3 text-right text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => (
            <ReportRow
              key={report.id}
              row={formatReportForTable(report)}
              index={pageRowNumber(page, pageSize, index)}
              onDelete={onDelete}
              isDeleting={deletingId === report.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
