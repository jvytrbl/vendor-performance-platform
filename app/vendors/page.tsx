//Vendor list (route: /vendors)
"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { fetchVendors, deleteVendor } from "@/lib/api/vendors";
import VendorTable from "@/components/vendors/VendorTable";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LinkButton from "@/components/ui/LinkButton";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import TablePagination from "@/components/ui/TablePagination";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { useAsyncData } from "@/lib/ui/useAsyncData";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/parsePageParams";
import { resolveDeleteFailureMessage } from "@/lib/ui/vendors/resolveDeleteFailureMessage";

export default function VendorsPage() {
  const getAccessToken = useAccessToken();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const committedSearch = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      if (committedSearch.current === next) return;
      committedSearch.current = next;
      setSearchTerm(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { status, data, errorMessage, reload } = useAsyncData(
    (accessToken) =>
      fetchVendors(accessToken, {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: searchTerm || undefined,
      }),
    [page, searchTerm],
    "Failed to load vendors"
  );
  const vendors = data?.vendors ?? [];
  const total = data?.total ?? 0;

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await deleteVendor(id, accessToken);

      if (result.outcome === "deleted") {
        if (vendors.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          reload();
        }
      } else {
        setDeleteErrorMessage(resolveDeleteFailureMessage(result.code, result.error));
      }
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error ? error.message : "Failed to delete vendor"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const emptyMessage =
    searchTerm.trim() === ""
      ? "No vendors yet. Add one to get started."
      : `No vendors match "${searchTerm}".`;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-medium text-foreground">
            Vendors
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Registered suppliers and their contact details. Vendors linked to transactions or reports can&apos;t be deleted.
          </p>
        </div>
        <LinkButton href="/vendors/add" variant="primary" icon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
          Add vendor
        </LinkButton>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, registration number, or contact…"
            className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none"
          />
        </div>

        {status === "loading" && <LoadingIndicator label="Loading vendors…" />}

        {status === "error" && (
          <ErrorBanner
            message={errorMessage ?? "Failed to load vendors"}
            action={
              <Button type="button" variant="secondary" onClick={reload}>
                Retry
              </Button>
            }
          />
        )}

        {status === "ready" && (
          <>
            {deleteErrorMessage && <ErrorBanner message={deleteErrorMessage} />}
            <VendorTable
                vendors={vendors}
                page={page}
                pageSize={DEFAULT_PAGE_SIZE}
                onDelete={handleDelete}
                deletingId={deletingId}
                emptyMessage={emptyMessage}
              />
            <TablePagination
              page={page}
              pageSize={DEFAULT_PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
