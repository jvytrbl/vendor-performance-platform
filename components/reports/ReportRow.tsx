import Link from "next/link";
import type { FormattedReportRow } from "@/lib/ui/reports/formatReportForTable";
import StatusBadge from "@/components/ui/StatusBadge";

interface ReportRowProps {
  row: FormattedReportRow;
  index: number;
}

export default function ReportRow({ row, index }: ReportRowProps) {
  return (
    <tr className="border-b border-border last:border-b-0 odd:bg-transparent even:bg-canvas/60 hover:bg-surface-muted/70">
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-subtle">
        {index}
      </td>
      <td className="px-5 py-4 text-sm font-semibold text-foreground">
        <Link href={`/reports/${row.id}`} className="hover:text-accent">
          {row.referenceNumber}
        </Link>
      </td>
      <td className="px-5 py-4 text-sm text-foreground-muted">{row.periodType}</td>
      <td className="px-5 py-4 text-sm text-foreground-muted">{row.period}</td>
      <td className="px-5 py-4 text-sm">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-5 py-4 text-sm text-foreground-muted">{row.createdAt}</td>
    </tr>
  );
}
