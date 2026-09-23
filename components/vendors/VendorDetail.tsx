"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import type { VendorRecord } from "@/lib/api/vendors";
import { fetchVendorById, deleteVendor } from "@/lib/api/vendors";
import { fetchAllTransactions, type TransactionRecord } from "@/lib/api/transactions";
import { formatVendorForTable } from "@/lib/ui/vendors/formatVendorForTable";
import { formatTransactionForTable } from "@/lib/ui/transactions/formatTransactionForTable";
import { resolveDeleteFailureMessage } from "@/lib/ui/vendors/resolveDeleteFailureMessage";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import DeleteVendorButton from "./DeleteVendorButton";

type Status = "loading" | "ready" | "error" | "not-found";

interface VendorDetailProps {
  id: number;
}

export default function VendorDetail({ id }: VendorDetailProps) {
  const router = useRouter();
  const getAccessToken = useAccessToken();
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setStatus("loading");
      try {
        const accessToken = await getAccessToken();
        const result = await fetchVendorById(id, accessToken);

        if (!isMounted) return;

        if (result.outcome === "error") {
          if (result.code === "VENDOR_NOT_FOUND") {
            setStatus("not-found");
            return;
          }
          setErrorMessage(result.error);
          setStatus("error");
          return;
        }

        setVendor(result.vendor);

        const vendorTransactions = await fetchAllTransactions({ vendor_id: id }, accessToken);
        if (!isMounted) return;
        setTransactions(vendorTransactions);

        setStatus("ready");
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load vendor"
        );
        setStatus("error");
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, getAccessToken, reloadKey]);

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await deleteVendor(id, accessToken);

      if (result.outcome === "deleted") {
        router.push("/vendors");
        return;
      }

      setErrorMessage(resolveDeleteFailureMessage(result.code, result.error));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete vendor"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (status === "loading") {
    return <LoadingIndicator label="Loading vendor…" />;
  }

  if (status === "not-found") {
    return <p className="text-sm text-foreground-muted">Vendor not found.</p>;
  }

  if (status === "error") {
    return (
      <ErrorBanner
        message={errorMessage ?? "Failed to load vendor"}
        action={
          <Button type="button" variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!vendor) {
    return null;
  }

  const row = formatVendorForTable(vendor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl font-medium text-foreground">{row.name}</h2>
        <DeleteVendorButton onConfirmDelete={handleDelete} isDeleting={isDeleting} />
      </div>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-foreground-muted">Registration No.</dt>
        <dd className="tabular-nums text-foreground">{row.registrationNumber}</dd>

        <dt className="text-foreground-muted">Contact</dt>
        <dd className="min-w-0 break-words text-foreground">{row.contactInfo}</dd>

        <dt className="text-foreground-muted">Added</dt>
        <dd className="tabular-nums text-foreground">{row.createdAt}</dd>
      </dl>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-foreground-muted">
          Transaction history
        </h3>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded border border-border bg-surface py-16 text-center">
            <Inbox className="h-8 w-8 text-foreground-subtle" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-base text-foreground-muted">No transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-0 w-full rounded border border-border bg-surface">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left">
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
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => {
                  const transactionRow = formatTransactionForTable(transaction);
                  return (
                    <tr
                      key={transactionRow.id}
                      className={`border-b border-border last:border-b-0 transition-colors duration-150 ease-out hover:bg-surface-muted/70 ${
                        index % 2 === 1 ? "bg-canvas/60" : ""
                      }`}
                    >
                      <td className="px-5 py-4 tabular-nums text-foreground-muted">{transactionRow.transactionDate}</td>
                      <td className="px-5 py-4 text-foreground">
                        <Link
                          href={`/transactions/${transactionRow.id}`}
                          className="transition-colors duration-150 ease-out hover:text-accent"
                        >
                          {transactionRow.itemDescription}
                        </Link>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-foreground-muted">{transactionRow.agreedPrice}</td>
                      <td className="px-5 py-4 tabular-nums text-foreground-muted">{transactionRow.quantityOrdered}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
