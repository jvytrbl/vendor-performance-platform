"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchTransactionById,
  deleteTransaction,
  type TransactionRecord,
} from "@/lib/api/transactions";
import { fetchVendorById } from "@/lib/api/vendors";
import { formatTransactionDetail } from "@/lib/ui/transactions/formatTransactionDetail";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import DeleteTransactionButton from "./DeleteTransactionButton";

type Status = "loading" | "ready" | "error" | "not-found";

interface TransactionDetailProps {
  id: number;
}

export default function TransactionDetail({ id }: TransactionDetailProps) {
  const router = useRouter();
  const getAccessToken = useAccessToken();
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setStatus("loading");
      try {
        const accessToken = await getAccessToken();
        const result = await fetchTransactionById(id, accessToken);

        if (!isMounted) return;

        if (result.outcome === "error") {
          if (result.code === "TRANSACTION_NOT_FOUND") {
            setStatus("not-found");
            return;
          }
          setErrorMessage(result.error);
          setStatus("error");
          return;
        }

        setTransaction(result.transaction);

        const vendorResult = await fetchVendorById(result.transaction.vendor_id, accessToken);
        if (!isMounted) return;

        if (vendorResult.outcome === "found") {
          setVendorName(vendorResult.vendor.name);
        }

        setStatus("ready");
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load transaction"
        );
        setStatus("error");
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, getAccessToken]);

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await deleteTransaction(id, accessToken);

      if (result.outcome === "deleted") {
        router.push("/transactions");
        return;
      }

      setErrorMessage(result.error);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete transaction"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-foreground-muted">Loading transaction…</p>;
  }

  if (status === "not-found") {
    return <p className="text-sm text-foreground-muted">Transaction not found.</p>;
  }

  if (status === "error" && !transaction) {
    return <p className="text-sm text-danger">{errorMessage}</p>;
  }

  if (!transaction) {
    return null;
  }

  const row = formatTransactionDetail(transaction);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          Transaction #{row.id}
        </h1>
        <span className="flex items-center gap-4">
          <Link
            href={`/transactions/${row.id}/edit`}
            className="text-sm font-medium text-accent hover:underline"
          >
            Edit
          </Link>
          <DeleteTransactionButton onConfirmDelete={handleDelete} isDeleting={isDeleting} />
        </span>
      </div>

      {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground-muted">Vendor</h2>
        <Link href={`/vendors/${row.vendorId}`} className="text-sm text-accent hover:underline">
          {vendorName ?? `#${row.vendorId}`}
        </Link>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground-muted">Item</h2>
        <p className="text-sm text-foreground">{row.itemDescription}</p>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="mb-2 text-sm font-medium text-foreground-muted">Agreed</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-foreground-subtle">Price</dt>
            <dd className="text-foreground">{row.agreedPrice}</dd>

            <dt className="text-foreground-subtle">Delivery date</dt>
            <dd className="text-foreground">{row.agreedDeliveryDate}</dd>

            <dt className="text-foreground-subtle">Quantity ordered</dt>
            <dd className="text-foreground">{row.quantityOrdered}</dd>
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-foreground-muted">Actual</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-foreground-subtle">Price</dt>
            <dd className="text-foreground">{row.actualPrice}</dd>

            <dt className="text-foreground-subtle">Delivery date</dt>
            <dd className="text-foreground">{row.actualDeliveryDate}</dd>

            <dt className="text-foreground-subtle">Quantity received</dt>
            <dd className="text-foreground">{row.quantityReceived}</dd>
          </dl>
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground-muted">Recorded</h2>
        <p className="text-sm text-foreground">{row.createdAt}</p>
      </section>
    </div>
  );
}
