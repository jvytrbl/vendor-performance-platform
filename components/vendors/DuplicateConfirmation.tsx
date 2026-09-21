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
    <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>{buildDuplicateConfirmMessage(attemptedName, possibleDuplicate)}</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className="font-medium text-indigo-600 hover:underline disabled:text-neutral-400"
        >
          {isConfirming ? "Adding…" : "Add anyway"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          className="text-neutral-600 hover:underline disabled:text-neutral-400"
        >
          Edit name
        </button>
      </div>
    </div>
  );
}