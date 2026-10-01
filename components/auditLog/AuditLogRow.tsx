import type { FormattedAuditLogRow } from "@/lib/ui/auditLog/formatAuditLogForTable";

interface AuditLogRowProps {
  row: FormattedAuditLogRow;
}

export default function AuditLogRow({ row }: AuditLogRowProps) {
  return (
    <tr className="border-b border-border last:border-b-0 odd:bg-transparent even:bg-canvas/60 transition-colors duration-150 ease-out hover:bg-surface-muted/70">
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted whitespace-nowrap">
        {row.timestamp}
      </td>
      <td className="px-5 py-4 text-sm text-foreground">{row.userEmail}</td>
      <td className="px-5 py-4 text-sm text-foreground-muted whitespace-nowrap">{row.actionLabel}</td>
      <td className="px-5 py-4 text-sm text-foreground-muted whitespace-nowrap">
        {row.targetType} #{row.targetId}
      </td>
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-subtle">{row.ipAddress}</td>
    </tr>
  );
}
