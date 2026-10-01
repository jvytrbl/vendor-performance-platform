"use client";

import { ClipboardList } from "lucide-react";
import type { AuditLogEntry } from "@/lib/api/auditLog";
import { formatAuditLogForTable } from "@/lib/ui/auditLog/formatAuditLogForTable";
import AuditLogRow from "./AuditLogRow";

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  emptyMessage: string;
}

export default function AuditLogTable({ entries, emptyMessage }: AuditLogTableProps) {
  if (entries.length === 0) {
    return (
      <div className="overflow-x-auto min-w-0 w-full rounded border border-border bg-surface">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ClipboardList className="h-8 w-8 text-foreground-subtle" strokeWidth={1.5} aria-hidden="true" />
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
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Timestamp
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              User
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Action
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              Target
            </th>
            <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
              IP address
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <AuditLogRow key={entry.id} row={formatAuditLogForTable(entry)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
