"use client";

import { useState } from "react";

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
        className="font-medium text-danger-muted hover:text-danger hover:underline"
      >
        Delete
      </button>

      {isConfirming && (
        <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border border-border bg-surface p-3 text-left shadow-md">
          <p className="text-sm text-foreground-muted">Delete this transaction?</p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="text-sm font-medium text-danger hover:underline disabled:text-foreground-muted/50"
            >
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isDeleting}
              className="text-sm text-foreground-muted hover:underline disabled:text-foreground-muted/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
