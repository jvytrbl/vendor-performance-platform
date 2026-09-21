"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createTransaction, type TransactionInput } from "@/lib/api/transactions";
import { fetchVendors, type VendorRecord } from "@/lib/api/vendors";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { validateTransactionInput } from "@/lib/domain/transactions/validateTransactionInput";
import { getVisibleFieldError } from "@/lib/ui/forms/getVisibleFieldError";

// vendor_id is deliberately typed as `number | undefined` here, distinct from the
// stricter `TransactionInput` (vendor_id: number) used once we actually submit.
// "Nothing selected yet" must be represented as genuinely missing (undefined), not
// as a fake numeric 0 — otherwise validateTransactionInput's boundary check for a
// real 0 ("Vendor id must be a positive integer") fires instead of the friendlier
// "vendor is required" message, which is confusing for a user who simply hasn't
// picked anything from the dropdown yet.
type FormState = Omit<TransactionInput, "vendor_id"> & { vendor_id: number | undefined };

const initialInput: FormState = {
  vendor_id: undefined,
  transaction_date: "",
  item_description: "",
  agreed_price: 0,
  actual_price: undefined,
  agreed_delivery_date: "",
  actual_delivery_date: "",
  quantity_ordered: 0,
  quantity_received: undefined,
};

export default function AddTransactionForm() {
  const router = useRouter();
  const getAccessToken = useAccessToken();
  const [input, setInput] = useState<FormState>(initialInput);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadVendors() {
      try {
        const accessToken = await getAccessToken();
        const result = await fetchVendors(accessToken);
        setVendors(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load vendors"
        );
      } finally {
        setIsLoadingVendors(false);
      }
    }
    loadVendors();
  }, [getAccessToken]);

  const validation = validateTransactionInput(input as any);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setInput((current) => {
      if (name === "vendor_id" || name === "actual_price" || name === "quantity_received") {
        return { ...current, [name]: value === "" ? undefined : Number(value) };
      }
      if (name === "agreed_price" || name === "quantity_ordered") {
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
      // Safe cast: validation.valid === true guarantees vendor_id is a real,
      // defined positive integer by this point, not undefined.
      const result = await createTransaction(input as TransactionInput, accessToken);

      if (result.outcome === "created") {
        router.push("/transactions");
        return;
      }

      setErrorMessage(result.error);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to add transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
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
          value={input.vendor_id ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoadingVendors}
          className="appearance-none rounded border border-border bg-surface py-2 pl-3 pr-10 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="" disabled>
            {isLoadingVendors ? "Loading vendors…" : "Select a vendor"}
          </option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>
        {vendorIdError && <p className="text-sm text-danger">{vendorIdError}</p>}
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
        {transactionDateError && <p className="text-sm text-danger">{transactionDateError}</p>}
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
        {itemDescriptionError && <p className="text-sm text-danger">{itemDescriptionError}</p>}
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
        {agreedPriceError && <p className="text-sm text-danger">{agreedPriceError}</p>}
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
        {actualPriceError && <p className="text-sm text-danger">{actualPriceError}</p>}
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
        {agreedDeliveryDateError && <p className="text-sm text-danger">{agreedDeliveryDateError}</p>}
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
        {actualDeliveryDateError && <p className="text-sm text-danger">{actualDeliveryDateError}</p>}
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
        {quantityOrderedError && <p className="text-sm text-danger">{quantityOrderedError}</p>}
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
        {quantityReceivedError && <p className="text-sm text-danger">{quantityReceivedError}</p>}
      </div>

      {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:bg-foreground-muted/40"
      >
        {isSubmitting ? "Adding…" : "Add transaction"}
      </button>
    </form>
  );
}
