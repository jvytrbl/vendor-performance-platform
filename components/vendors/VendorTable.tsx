"use client";

import type { VendorRecord } from "@/lib/api/vendors";
import { formatVendorForTable } from "@/lib/ui/vendors/formatVendorForTable";
import VendorRow from "./VendorRow";

interface VendorTableProps {
  vendors: VendorRecord[];
  onDelete: (id: number) => void;
  deletingId?: number | null;
  emptyMessage: string;
}

export default function VendorTable({
  vendors,
  onDelete,
  deletingId,
  emptyMessage,
}: VendorTableProps) {
  if (vendors.length === 0) {
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
            Name
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Registration No.
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Contact
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Added
          </th>
          <th className="px-5 py-3 text-right text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {vendors.map((vendor, index) => {
          const row = formatVendorForTable(vendor);
          return (
            <VendorRow
              key={row.id}
              row={row}
              index={index + 1}
              onDelete={onDelete}
              isDeleting={deletingId === row.id}
            />
          );
        })}
      </tbody>
    </table>
    </div>
  );
}
