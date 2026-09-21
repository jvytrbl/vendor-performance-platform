"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { VendorRecord } from "@/lib/api/vendors";
import { fetchVendorById, deleteVendor } from "@/lib/api/vendors";
import { fetchTransactions, type TransactionRecord } from "@/lib/api/transactions";
import { formatVendorForTable } from "@/lib/ui/vendors/formatVendorForTable";
import { formatTransactionForTable } from "@/lib/ui/transactions/formatTransactionForTable";
import { resolveDeleteFailureMessage } from "@/lib/ui/vendors/resolveDeleteFailureMessage";
import { useAccessToken } from "@/lib/auth/useAccessToken";
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

        const vendorTransactions = await fetchTransactions({ vendor_id: id }, accessToken);
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
  }, [id, getAccessToken]);

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
    return <p className="text-sm text-neutral-500">Loading vendor…</p>;
  }

  if (status === "not-found") {
    return <p className="text-sm text-neutral-700">Vendor not found.</p>;
  }

  if (status === "error") {
    return <p className="text-sm text-red-700">{errorMessage}</p>;
  }

  if (!vendor) {
    return null;
  }

  const row = formatVendorForTable(vendor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">{row.name}</h1>
        <DeleteVendorButton onConfirmDelete={handleDelete} isDeleting={isDeleting} />
      </div>

      {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}

      <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-neutral-500">Registration No.</dt>
        <dd className="text-neutral-900">{row.registrationNumber}</dd>

        <dt className="text-neutral-500">Contact</dt>
        <dd className="text-neutral-900">{row.contactInfo}</dd>

        <dt className="text-neutral-500">Added</dt>
        <dd className="text-neutral-900">{row.createdAt}</dd>
      </dl>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-700">
          Transaction history
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-neutral-500">No transactions yet.</p>
        ) : (
          <table className="w-full max-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="py-2 pr-4 text-xs font-normal uppercase tracking-wide text-neutral-400">
                  Date
                </th>
                <th className="py-2 pr-4 text-xs font-normal uppercase tracking-wide text-neutral-400">
                  Item
                </th>
                <th className="py-2 pr-4 text-xs font-normal uppercase tracking-wide text-neutral-400">
                  Price
                </th>
                <th className="py-2 pr-4 text-xs font-normal uppercase tracking-wide text-neutral-400">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const transactionRow = formatTransactionForTable(transaction);
                return (
                  <tr key={transactionRow.id} className="border-b border-neutral-100">
                    <td className="py-2 pr-4 text-neutral-600">{transactionRow.transactionDate}</td>
                    <td className="py-2 pr-4 text-neutral-900">
                      <Link
                        href={`/transactions/${transactionRow.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {transactionRow.itemDescription}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-neutral-600">{transactionRow.agreedPrice}</td>
                    <td className="py-2 pr-4 text-neutral-600">{transactionRow.quantityOrdered}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}