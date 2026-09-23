"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import {
  fetchTransactions,
  deleteTransaction,
  type TransactionRecord,
} from "@/lib/api/transactions";
import { fetchAllVendors, type VendorRecord } from "@/lib/api/vendors";
import TransactionTable from "@/components/transactions/TransactionTable";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LinkButton from "@/components/ui/LinkButton";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import TablePagination from "@/components/ui/TablePagination";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/parsePageParams";

type Status = "loading" | "ready" | "error";

export default function TransactionsPage() {
  const getAccessToken = useAccessToken();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vendorIdFilter, setVendorIdFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadTransactions = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const [result, vendorList] = await Promise.all([
        fetchTransactions(
          {
            vendor_id: vendorIdFilter ? Number(vendorIdFilter) : undefined,
            dateFrom: dateFromFilter || undefined,
            dateTo: dateToFilter || undefined,
            page,
            pageSize: DEFAULT_PAGE_SIZE,
          },
          accessToken
        ),
        fetchAllVendors(accessToken),
      ]);
      setTransactions(result.transactions);
      setTotal(result.total);
      setVendors(vendorList);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load transactions"
      );
      setStatus("error");
    }
  }, [getAccessToken, vendorIdFilter, dateFromFilter, dateToFilter, page]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await deleteTransaction(id, accessToken);

      if (result.outcome === "deleted") {
        if (transactions.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          await loadTransactions();
        }
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete transaction"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const emptyMessage =
    vendorIdFilter || dateFromFilter || dateToFilter
      ? "No transactions match these filters."
      : "No transactions yet. Add one or upload a file to get started.";

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-medium text-foreground">
            Transactions
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Recorded purchases and deliveries per vendor. Add entries manually or upload a file in bulk.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton
            href="/transactions/bulk-upload"
            variant="secondary"
            icon={<Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
          >
            Bulk upload
          </LinkButton>
          <LinkButton
            href="/transactions/add"
            variant="primary"
            icon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
          >
            Add transaction
          </LinkButton>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <form
          onSubmit={(event) => event.preventDefault()}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="vendor_id" className="text-xs font-medium text-foreground-muted">
              Vendor
            </label>
            <select
              id="vendor_id"
              value={vendorIdFilter}
              onChange={(event) => {
                setVendorIdFilter(event.target.value);
                setPage(1);
              }}
              className="w-48 appearance-none rounded border border-border bg-surface py-2 pl-3 pr-10 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="">Any vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dateFrom" className="text-xs font-medium text-foreground-muted">
              From
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFromFilter}
              onChange={(event) => {
                setDateFromFilter(event.target.value);
                setPage(1);
              }}
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dateTo" className="text-xs font-medium text-foreground-muted">
              To
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateToFilter}
              onChange={(event) => {
                setDateToFilter(event.target.value);
                setPage(1);
              }}
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {(vendorIdFilter || dateFromFilter || dateToFilter) && (
            <button
              type="button"
              onClick={() => {
                setVendorIdFilter("");
                setDateFromFilter("");
                setDateToFilter("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground-muted transition-colors duration-150 ease-out hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Clear filters
            </button>
          )}
        </form>

        {status === "loading" && <LoadingIndicator label="Loading transactions…" />}

        {status === "error" && (
          <ErrorBanner
            message={errorMessage ?? "Failed to load transactions"}
            action={
              <Button type="button" variant="secondary" onClick={loadTransactions}>
                Retry
              </Button>
            }
          />
        )}

        {status === "ready" && (
          <>
            {errorMessage && <ErrorBanner message={errorMessage} />}
            <TransactionTable
                transactions={transactions}
                vendors={vendors}
                page={page}
                pageSize={DEFAULT_PAGE_SIZE}
                emptyMessage={emptyMessage}
                onDelete={handleDelete}
                deletingId={deletingId}
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
