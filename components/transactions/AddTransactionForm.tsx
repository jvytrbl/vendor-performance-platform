"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createTransaction, type TransactionInput } from "@/lib/api/transactions";
import { fetchAllVendors, type VendorRecord } from "@/lib/api/vendors";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { validateTransactionInput } from "@/lib/domain/transactions/validateTransactionInput";
import { getVisibleFieldError } from "@/lib/ui/forms/getVisibleFieldError";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import DateField from "@/components/forms/DateField";
import FormField from "@/components/forms/FormField";
import VendorCombobox from "@/components/forms/VendorCombobox";
import { fieldControlClass } from "@/components/forms/fieldClasses";

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

const ALL_FIELDS = [
  "vendor_id",
  "transaction_date",
  "item_description",
  "agreed_price",
  "actual_price",
  "agreed_delivery_date",
  "actual_delivery_date",
  "quantity_ordered",
  "quantity_received",
];

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
        const result = await fetchAllVendors(accessToken);
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

  const validation = validateTransactionInput(input as TransactionInput);

  function touch(name: string) {
    setTouchedFields((current) => {
      if (current.has(name)) return current;
      const next = new Set(current);
      next.add(name);
      return next;
    });
  }

  function setText(
    name: "transaction_date" | "item_description" | "agreed_delivery_date" | "actual_delivery_date",
    value: string
  ) {
    setInput((current) => ({ ...current, [name]: value }));
    touch(name);
  }

  function setOptionalNumber(name: "actual_price" | "quantity_received", value: string) {
    setInput((current) => ({ ...current, [name]: value === "" ? undefined : Number(value) }));
    touch(name);
  }

  function setRequiredNumber(name: "agreed_price" | "quantity_ordered", value: string) {
    setInput((current) => ({ ...current, [name]: value === "" ? 0 : Number(value) }));
    touch(name);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouchedFields(new Set(ALL_FIELDS));

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
    <form
      onSubmit={handleSubmit}
      className="flex max-w-xl flex-col gap-8 rounded-lg border border-border bg-surface-muted p-8"
    >
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-medium text-foreground">At order time</h2>
          <p className="text-sm text-foreground-muted">Details known when the order is placed.</p>
        </div>

        <FormField id="vendor_id" label="Vendor" error={vendorIdError}>
          <VendorCombobox
            id="vendor_id"
            vendors={vendors}
            value={input.vendor_id}
            disabled={isLoadingVendors}
            placeholder={isLoadingVendors ? "Loading vendors…" : "Select a vendor"}
            error={vendorIdError}
            onChange={(vendorId) => {
              setInput((current) => ({ ...current, vendor_id: vendorId }));
              touch("vendor_id");
            }}
            onBlur={() => touch("vendor_id")}
          />
        </FormField>

        <FormField id="item_description" label="Item description" error={itemDescriptionError}>
          <input
            id="item_description"
            name="item_description"
            value={input.item_description}
            onChange={(event) => setText("item_description", event.target.value)}
            onBlur={() => touch("item_description")}
            aria-invalid={itemDescriptionError ? true : undefined}
            aria-describedby={itemDescriptionError ? "item_description-error" : undefined}
            className={fieldControlClass}
          />
        </FormField>

        <FormField id="transaction_date" label="Transaction date" error={transactionDateError}>
          <DateField
            id="transaction_date"
            value={input.transaction_date}
            error={transactionDateError}
            onChange={(value) => {
              setText("transaction_date", value);
              touch("transaction_date");
            }}
            onBlur={() => touch("transaction_date")}
          />
        </FormField>

        <FormField id="agreed_price" label="Agreed price (RM)" error={agreedPriceError}>
          <input
            id="agreed_price"
            name="agreed_price"
            type="number"
            min={0}
            step="0.01"
            value={input.agreed_price || ""}
            onChange={(event) => setRequiredNumber("agreed_price", event.target.value)}
            onBlur={() => touch("agreed_price")}
            aria-invalid={agreedPriceError ? true : undefined}
            aria-describedby={agreedPriceError ? "agreed_price-error" : undefined}
            className={fieldControlClass}
          />
        </FormField>

        <FormField id="agreed_delivery_date" label="Agreed delivery date" error={agreedDeliveryDateError}>
          <DateField
            id="agreed_delivery_date"
            value={input.agreed_delivery_date}
            error={agreedDeliveryDateError}
            onChange={(value) => {
              setText("agreed_delivery_date", value);
              touch("agreed_delivery_date");
            }}
            onBlur={() => touch("agreed_delivery_date")}
          />
        </FormField>

        <FormField id="quantity_ordered" label="Quantity ordered" error={quantityOrderedError}>
          <input
            id="quantity_ordered"
            name="quantity_ordered"
            type="number"
            min={0}
            step="1"
            value={input.quantity_ordered || ""}
            onChange={(event) => setRequiredNumber("quantity_ordered", event.target.value)}
            onBlur={() => touch("quantity_ordered")}
            aria-invalid={quantityOrderedError ? true : undefined}
            aria-describedby={quantityOrderedError ? "quantity_ordered-error" : undefined}
            className={fieldControlClass}
          />
        </FormField>
      </section>

      <div className="border-t border-border" />

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-medium text-foreground">On delivery (optional)</h2>
          <p className="text-sm text-foreground-muted">
            Fill these in after the goods arrive. Leave them blank until then.
          </p>
        </div>

        <FormField id="actual_price" label="Actual price (RM)" error={actualPriceError}>
          <input
            id="actual_price"
            name="actual_price"
            type="number"
            min={0}
            step="0.01"
            value={input.actual_price ?? ""}
            onChange={(event) => setOptionalNumber("actual_price", event.target.value)}
            onBlur={() => touch("actual_price")}
            aria-invalid={actualPriceError ? true : undefined}
            aria-describedby={actualPriceError ? "actual_price-error" : undefined}
            className={fieldControlClass}
          />
        </FormField>

        <FormField id="actual_delivery_date" label="Actual delivery date" error={actualDeliveryDateError}>
          <DateField
            id="actual_delivery_date"
            value={input.actual_delivery_date ?? ""}
            error={actualDeliveryDateError}
            onChange={(value) => {
              setText("actual_delivery_date", value);
              touch("actual_delivery_date");
            }}
            onBlur={() => touch("actual_delivery_date")}
          />
        </FormField>

        <FormField id="quantity_received" label="Quantity received" error={quantityReceivedError}>
          <input
            id="quantity_received"
            name="quantity_received"
            type="number"
            min={0}
            step="1"
            value={input.quantity_received ?? ""}
            onChange={(event) => setOptionalNumber("quantity_received", event.target.value)}
            onBlur={() => touch("quantity_received")}
            aria-invalid={quantityReceivedError ? true : undefined}
            aria-describedby={quantityReceivedError ? "quantity_received-error" : undefined}
            className={fieldControlClass}
          />
        </FormField>
      </section>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        icon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        className="self-start"
      >
        {isSubmitting ? "Adding…" : "Add transaction"}
      </Button>
    </form>
  );
}
