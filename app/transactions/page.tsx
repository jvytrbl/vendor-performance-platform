"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchTransactions,
  deleteTransaction,
  type TransactionRecord,
} from "@/lib/api/transactions";
import { fetchVendors, type VendorRecord } from "@/lib/api/vendors";
import TransactionTable from "@/components/transactions/TransactionTable";
import { useAccessToken } from "@/lib/auth/useAccessToken";

type Status = "loading" | "ready" | "error";

export default function TransactionsPage() {
  const getAccessToken = useAccessToken();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
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
          },
          accessToken
        ),
        fetchVendors(accessToken),
      ]);
      setTransactions(result);
      setVendors(vendorList);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load transactions"
      );
      setStatus("error");
    }
  }, [getAccessToken, vendorIdFilter, dateFromFilter, dateToFilter]);

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
        setTransactions((current) => current.filter((transaction) => transaction.id !== id));
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Transactions
        </h1>
        <div className="flex gap-3">
          <Link
            href="/transactions/bulk-upload"
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            Bulk upload
          </Link>
          <Link
            href="/transactions/add"
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Add transaction
          </Link>
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
              onChange={(event) => setVendorIdFilter(event.target.value)}
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
              onChange={(event) => setDateFromFilter(event.target.value)}
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
              onChange={(event) => setDateToFilter(event.target.value)}
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
              }}
              className="text-sm font-medium text-foreground-muted hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </form>

        {status === "loading" && (
          <p className="text-sm text-foreground-muted">Loading transactions…</p>
        )}

        {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

        {status === "ready" && (
          <>
            {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
            <TransactionTable
                transactions={transactions}
                vendors={vendors}
                emptyMessage={emptyMessage}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
          </>
        )}
      </div>
    </div>
  );
}
