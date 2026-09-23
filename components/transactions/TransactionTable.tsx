"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageSearch, Pencil } from "lucide-react";
import type { TransactionRecord } from "@/lib/api/transactions";
import type { VendorRecord } from "@/lib/api/vendors";
import { formatTransactionForTable } from "@/lib/ui/transactions/formatTransactionForTable";
import { pageRowNumber } from "@/components/ui/TablePagination";
import DeleteTransactionButton from "./DeleteTransactionButton";

interface TransactionTableProps {
  transactions: TransactionRecord[];
  vendors: VendorRecord[];
  page: number;
  pageSize: number;
  emptyMessage: string;
  onDelete: (id: number) => void;
  deletingId?: number | null;
}

export default function TransactionTable({
  transactions,
  vendors,
  page,
  pageSize,
  emptyMessage,
  onDelete,
  deletingId,
}: TransactionTableProps) {
  const router = useRouter();
  const vendorNameById = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
  if (transactions.length === 0) {
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
            Vendor
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Date
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Item
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Price
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Quantity
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Delivery Date
          </th>
          <th className="px-5 py-3 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Actual Delivery Date
          </th>
          <th className="px-5 py-3 text-right text-xs font-normal uppercase tracking-wide text-foreground-subtle">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction, index) => {
          const row = formatTransactionForTable(transaction);
          return (
            <tr
              key={row.id}
              onClick={() => router.push(`/transactions/${row.id}`)}
              className="cursor-pointer border-b border-border last:border-b-0 odd:bg-transparent even:bg-canvas/60 transition-colors duration-150 ease-out hover:bg-surface-muted/70"
            >
              <td className="px-5 py-4 text-sm tabular-nums text-foreground-subtle">
                {pageRowNumber(page, pageSize, index)}
              </td>
              <td
                className="px-5 py-4 text-sm font-semibold text-foreground"
                onClick={(event) => event.stopPropagation()}
              >
                <Link
                  href={`/vendors/${row.vendorId}`}
                  className="transition-colors duration-150 ease-out hover:text-accent"
                >
                  {vendorNameById.get(row.vendorId) ?? `#${row.vendorId}`}
                </Link>
              </td>
              <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted">{row.transactionDate}</td>
              <td className="px-5 py-4 text-sm text-foreground-muted">{row.itemDescription}</td>
              <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted">{row.agreedPrice}</td>
              <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted">{row.quantityOrdered}</td>
              <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted">{row.agreedDeliveryDate}</td>
              <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted">{row.actualDeliveryDate}</td>
              <td
                className="px-5 py-4 text-right text-sm"
                onClick={(event) => event.stopPropagation()}
              >
                <span className="inline-flex items-center gap-3">
                  <Link
                    href={`/transactions/${row.id}/edit`}
                    className="inline-flex items-center gap-1.5 font-medium text-accent transition-colors duration-150 ease-out hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    Edit
                  </Link>
                  <DeleteTransactionButton
                    onConfirmDelete={() => onDelete(row.id)}
                    isDeleting={deletingId === row.id}
                  />
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}
