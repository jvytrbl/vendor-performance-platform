"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import {
  fetchTransactionById,
  updateTransaction,
  type TransactionInput,
} from "@/lib/api/transactions";
import { fetchAllVendors, type VendorRecord } from "@/lib/api/vendors";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { validateTransactionInput } from "@/lib/domain/transactions/validateTransactionInput";
import { getVisibleFieldError } from "@/lib/ui/forms/getVisibleFieldError";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

type Status = "loading" | "ready" | "error" | "not-found";

interface EditTransactionFormProps {
  id: number;
}

const emptyInput: TransactionInput = {
  vendor_id: 0,
  transaction_date: "",
  item_description: "",
  agreed_price: 0,
  actual_price: undefined,
  agreed_delivery_date: "",
  actual_delivery_date: "",
  quantity_ordered: 0,
  quantity_received: undefined,
};

export default function EditTransactionForm({ id }: EditTransactionFormProps) {
  const router = useRouter();
  const getAccessToken = useAccessToken();
  const [input, setInput] = useState<TransactionInput>(emptyInput);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      setStatus("loading");
      try {
        const accessToken = await getAccessToken();
        const [transactionResult, vendorList] = await Promise.all([
          fetchTransactionById(id, accessToken),
          fetchAllVendors(accessToken),
        ]);

        setVendors(vendorList);

        if (transactionResult.outcome === "error") {
          if (transactionResult.code === "TRANSACTION_NOT_FOUND") {
            setStatus("not-found");
            return;
          }
          setErrorMessage(transactionResult.error);
          setStatus("error");
          return;
        }

        const transaction = transactionResult.transaction;
        setInput({
          vendor_id: transaction.vendor_id,
          transaction_date: transaction.transaction_date ?? "",
          item_description: transaction.item_description ?? "",
          agreed_price: transaction.agreed_price ?? 0,
          actual_price: transaction.actual_price ?? undefined,
          agreed_delivery_date: transaction.agreed_delivery_date ?? "",
          actual_delivery_date: transaction.actual_delivery_date ?? "",
          quantity_ordered: transaction.quantity_ordered ?? 0,
          quantity_received: transaction.quantity_received ?? undefined,
        });
        setStatus("ready");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load transaction"
        );
        setStatus("error");
      }
    }
    load();
  }, [id, getAccessToken, reloadKey]);

  const validation = validateTransactionInput(input);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setInput((current) => {
      if (name === "actual_price" || name === "quantity_received") {
        return { ...current, [name]: value === "" ? undefined : Number(value) };
      }
      if (name === "vendor_id" || name === "agreed_price" || name === "quantity_ordered") {
        return { ...current, [name]: Number(value) };
      }
      return { ...current, [name]: value };
    });
  }

  function handleBlur(event: FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = event.target;
    setTouchedFields((current) => new Set(current).add(name));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouchedFields(
      new Set([
        "vendor_id",
        "transaction_date",
        "item_description",
        "agreed_price",
        "actual_price",
        "agreed_delivery_date",
        "actual_delivery_date",
        "quantity_ordered",
        "quantity_received",
      ])
    );

    if (!validation.valid) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const accessToken = await getAccessToken();
      const result = await updateTransaction(id, input, accessToken);

      if (result.outcome === "updated") {
        router.push("/transactions");
        return;
      }

      setErrorMessage(result.error);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return <LoadingIndicator label="Loading transaction…" />;
  }

  if (status === "not-found") {
    return <p className="text-sm text-foreground-muted">Transaction not found.</p>;
  }

  if (status === "error" && vendors.length === 0) {
    return (
      <ErrorBanner
        message={errorMessage ?? "Failed to load transaction"}
        action={
          <Button type="button" variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        }
      />
    );
  }

  const vendorIdError = getVisibleFieldError("vendor_id", touchedFields, validation);
  const transactionDateError = getVisibleFieldError("transaction_date", touchedFields, validation);
  const itemDescriptionError = getVisibleFieldError("item_description", touchedFields, validation);
  const agreedPriceError = getVisibleFieldError("agreed_price", touchedFields, validation);
  const actualPriceError = getVisibleFieldError("actual_price", touchedFields, validation);
  const agreedDeliveryDateError = getVisibleFieldError("agreed_delivery_date", touchedFields, validation);
  const actualDeliveryDateError = getVisibleFieldError("actual_delivery_date", touchedFields, validation);
  const quantityOrderedError = getVisibleFieldError("quantity_ordered", touchedFields, validation);
  const quantityReceivedError = getVisibleFieldError("quantity_received", touchedFields, validation);

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="vendor_id" className="text-sm font-medium text-foreground-muted">
          Vendor
        </label>
        <select
          id="vendor_id"
          name="vendor_id"
          value={input.vendor_id || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="appearance-none rounded border border-border bg-surface py-2 pl-3 pr-10 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="" disabled>
            Select a vendor
          </option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>
        {vendorIdError && <ErrorBanner message={vendorIdError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="transaction_date" className="text-sm font-medium text-foreground-muted">
          Transaction date
        </label>
        <input
          id="transaction_date"
          name="transaction_date"
          type="date"
          value={input.transaction_date}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {transactionDateError && <ErrorBanner message={transactionDateError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="item_description" className="text-sm font-medium text-foreground-muted">
          Item description
        </label>
        <input
          id="item_description"
          name="item_description"
          value={input.item_description}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {itemDescriptionError && <ErrorBanner message={itemDescriptionError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="agreed_price" className="text-sm font-medium text-foreground-muted">
          Agreed price (RM)
        </label>
        <input
          id="agreed_price"
          name="agreed_price"
          type="number"
          min={0}
          step="0.01"
          value={input.agreed_price || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {agreedPriceError && <ErrorBanner message={agreedPriceError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="actual_price" className="text-sm font-medium text-foreground-muted">
          Actual price (RM) <span className="text-foreground-subtle">(optional — fill in once delivered)</span>
        </label>
        <input
          id="actual_price"
          name="actual_price"
          type="number"
          min={0}
          step="0.01"
          value={input.actual_price ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {actualPriceError && <ErrorBanner message={actualPriceError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="agreed_delivery_date" className="text-sm font-medium text-foreground-muted">
          Agreed delivery date
        </label>
        <input
          id="agreed_delivery_date"
          name="agreed_delivery_date"
          type="date"
          value={input.agreed_delivery_date}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {agreedDeliveryDateError && <ErrorBanner message={agreedDeliveryDateError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="actual_delivery_date" className="text-sm font-medium text-foreground-muted">
          Actual delivery date <span className="text-foreground-subtle">(optional — fill in once delivered)</span>
        </label>
        <input
          id="actual_delivery_date"
          name="actual_delivery_date"
          type="date"
          value={input.actual_delivery_date ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {actualDeliveryDateError && <ErrorBanner message={actualDeliveryDateError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantity_ordered" className="text-sm font-medium text-foreground-muted">
          Quantity ordered
        </label>
        <input
          id="quantity_ordered"
          name="quantity_ordered"
          type="number"
          min={0}
          step="1"
          value={input.quantity_ordered || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {quantityOrderedError && <ErrorBanner message={quantityOrderedError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantity_received" className="text-sm font-medium text-foreground-muted">
          Quantity received <span className="text-foreground-subtle">(optional — fill in once delivered)</span>
        </label>
        <input
          id="quantity_received"
          name="quantity_received"
          type="number"
          min={0}
          step="1"
          value={input.quantity_received ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {quantityReceivedError && <ErrorBanner message={quantityReceivedError} />}
      </div>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        icon={<Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
        className="self-start"
      >
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
