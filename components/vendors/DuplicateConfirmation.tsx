import { TriangleAlert } from "lucide-react";
import { buildDuplicateConfirmMessage } from "@/lib/ui/vendors/buildDuplicateConfirmMessage";
import type { DuplicateVendorMatch } from "@/lib/ui/vendors/buildDuplicateConfirmMessage";

interface DuplicateConfirmationProps {
  attemptedName: string;
  possibleDuplicate: DuplicateVendorMatch;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
}

export default function DuplicateConfirmation({
  attemptedName,
  possibleDuplicate,
  onConfirm,
  onCancel,
  isConfirming,
}: DuplicateConfirmationProps) {
  return (
    <div className="flex gap-3 rounded border border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <div className="flex flex-col gap-3">
        <p>{buildDuplicateConfirmMessage(attemptedName, possibleDuplicate)}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="font-medium text-accent transition-colors duration-150 ease-out hover:underline disabled:text-foreground-muted/50"
          >
            {isConfirming ? "Adding…" : "Add anyway"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="text-foreground-muted transition-colors duration-150 ease-out hover:underline disabled:text-foreground-muted/50"
          >
            Edit name
          </button>
        </div>
      </div>
    </div>
  );
}