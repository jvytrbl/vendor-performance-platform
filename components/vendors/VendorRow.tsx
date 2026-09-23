import Link from "next/link";
import type { FormattedVendorRow } from "@/lib/ui/vendors/formatVendorForTable";
import DeleteVendorButton from "./DeleteVendorButton";

interface VendorRowProps {
  row: FormattedVendorRow;
  index: number;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export default function VendorRow({ row, index, onDelete, isDeleting }: VendorRowProps) {
  return (
    <tr className="border-b border-border last:border-b-0 odd:bg-transparent even:bg-canvas/60 transition-colors duration-150 ease-out hover:bg-surface-muted/70">
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-subtle">
        {index}
      </td>
      <td className="px-5 py-4 text-sm font-semibold text-foreground">
        <Link href={`/vendors/${row.id}`} className="transition-colors duration-150 ease-out hover:text-accent">
          {row.name}
        </Link>
      </td>
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted">
        {row.registrationNumber}
      </td>
      <td className="px-5 py-4 text-sm text-foreground-muted">
        {row.contactInfo}
      </td>
      <td className="px-5 py-4 text-sm tabular-nums text-foreground-muted">
        {row.createdAt}
      </td>
      <td className="px-5 py-4 text-right text-sm">
        <DeleteVendorButton
          onConfirmDelete={() => onDelete(row.id)}
          isDeleting={isDeleting}
        />
      </td>
    </tr>
  );
}
