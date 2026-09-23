"use client";

import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { ReportListItem } from "@/lib/api/reports";
import type { ReportSortBy, ReportSortOrder } from "@/lib/domain/reports/reportListQuery";
import { formatReportForTable } from "@/lib/ui/reports/formatReportForTable";
import { pageRowNumber } from "@/components/ui/TablePagination";
import ReportRow from "./ReportRow";

interface ReportTableProps {
  reports: ReportListItem[];
  page: number;
  pageSize: number;
  sortBy: ReportSortBy;
  sortOrder: ReportSortOrder;
  onSort: (column: ReportSortBy) => void;
  emptyMessage: string;
  onDelete: (id: number) => void;
  deletingId: number | null;
}

function SortHeader({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  column: ReportSortBy;
  sortBy: ReportSortBy;
  sortOrder: ReportSortOrder;
  onSort: (column: ReportSortBy) => void;
}) {
  const active = sortBy === column;
  const Icon = sortOrder === "asc" ? ChevronUp : ChevronDown;
  return (
    <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 uppercase tracking-wide text-foreground-subtle transition-colors duration-150 ease-out hover:text-foreground"
      >
        {label}
        {active ? <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" /> : null}
      </button>
    </th>
  );
}

export default function ReportTable({
  reports,
  page,
  pageSize,
  sortBy,
  sortOrder,
  onSort,
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
            <SortHeader label="Period" column="periodStart" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Status
            </th>
            <SortHeader label="Created" column="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
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
