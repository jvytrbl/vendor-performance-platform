import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { FormattedReportRow } from "@/lib/ui/reports/formatReportForTable";
import StatusBadge from "@/components/ui/StatusBadge";
import DeleteReportButton from "./DeleteReportButton";

interface ReportRowProps {
  row: FormattedReportRow;
  index: number;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export default function ReportRow({ row, index, onDelete, isDeleting }: ReportRowProps) {
  const isDraft = row.status === "Draft";

  return (
    <tr className="border-b border-border last:border-b-0 odd:bg-transparent even:bg-canvas/60 transition-colors duration-150 ease-out hover:bg-surface-muted/70">
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-subtle">
        {index}
      </td>
      <td className="px-5 py-4 text-sm font-semibold whitespace-nowrap">
        <Link
          href={`/reports/${row.id}`}
          className="text-foreground transition-colors duration-150 ease-out hover:text-accent hover:underline"
        >
          {row.referenceNumber}
        </Link>
      </td>
      <td className="px-5 py-4 text-sm text-foreground-muted">{row.periodType}</td>
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted">{row.period}</td>
      <td className="px-5 py-4 text-sm">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted whitespace-nowrap">{row.createdAt}</td>
      <td className="px-5 py-4 text-right text-sm" onClick={(event) => event.stopPropagation()}>
        <span className="inline-flex items-center justify-end gap-3">
          <Link
            href={`/reports/${row.id}`}
            className="inline-flex min-h-11 items-center gap-1.5 font-medium text-accent transition-colors duration-150 ease-out hover:underline"
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            View
          </Link>
          {isDraft && (
            <Link
              href={`/reports/${row.id}?edit=1`}
              className="inline-flex min-h-11 items-center gap-1.5 font-medium text-accent transition-colors duration-150 ease-out hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              Edit
            </Link>
          )}
          {isDraft && (
            <DeleteReportButton
              onConfirmDelete={() => onDelete(row.id)}
              isDeleting={isDeleting}
            />
          )}
        </span>
      </td>
    </tr>
  );
}
