"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

interface DeleteTransactionButtonProps {
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export default function DeleteTransactionButton({
  onConfirmDelete,
  isDeleting,
}: DeleteTransactionButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="inline-flex items-center gap-1.5 font-medium text-danger-muted transition-colors duration-150 ease-out hover:text-danger hover:underline"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        Delete
      </button>

      {isConfirming && (
        <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border border-border bg-surface p-3 text-left">
          <p className="text-sm text-foreground-muted">Delete this transaction?</p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="text-sm font-medium text-danger transition-colors duration-150 ease-out hover:underline disabled:text-foreground-muted/50"
            >
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isDeleting}
              className="text-sm text-foreground-muted transition-colors duration-150 ease-out hover:underline disabled:text-foreground-muted/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
