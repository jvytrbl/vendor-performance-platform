"use client";

import { PackageSearch } from "lucide-react";
import type { VendorRecord } from "@/lib/api/vendors";
import { formatVendorForTable } from "@/lib/ui/vendors/formatVendorForTable";
import { pageRowNumber } from "@/components/ui/TablePagination";
import VendorRow from "./VendorRow";

interface VendorTableProps {
  vendors: VendorRecord[];
  page: number;
  pageSize: number;
  onDelete: (id: number) => void;
  deletingId?: number | null;
  emptyMessage: string;
}

export default function VendorTable({
  vendors,
  page,
  pageSize,
  onDelete,
  deletingId,
  emptyMessage,
}: VendorTableProps) {
  if (vendors.length === 0) {
    return (
      <div className="overflow-x-auto min-w-0 w-full rounded border border-border bg-surface">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <PackageSearch className="h-8 w-8 text-foreground-subtle" strokeWidth={1.5} aria-hidden="true" />
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
              index={pageRowNumber(page, pageSize, index)}
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
