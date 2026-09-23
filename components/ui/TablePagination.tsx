"use client";

import Button from "@/components/ui/Button";

export function pageRowNumber(page: number, pageSize: number, index: number): number {
  return (page - 1) * pageSize + index + 1;
}

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: TablePaginationProps) {
  if (total <= 0) return null;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="text-sm text-foreground-muted">
        Page {current} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={current >= pageCount}
          onClick={() => onPageChange(current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
