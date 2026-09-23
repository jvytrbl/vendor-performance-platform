"use client";

import { useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createVendor, type VendorInput } from "@/lib/api/vendors";
import { validateVendorInput } from "@/lib/domain/vendors/validateVendorInput";
import { getVisibleFieldError } from "@/lib/ui/forms/getVisibleFieldError";
import type { DuplicateVendorMatch } from "@/lib/ui/vendors/buildDuplicateConfirmMessage";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import DuplicateConfirmation from "./DuplicateConfirmation";

const initialInput: VendorInput = {
  name: "",
  registration_number: "",
  contact_info: "",
};

export default function AddVendorForm() {
  const router = useRouter();
  const getAccessToken = useAccessToken();
  const [input, setInput] = useState<VendorInput>(initialInput);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<DuplicateVendorMatch | null>(null);

  const validation = validateVendorInput(input);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setInput((current) => ({ ...current, [name]: value }));
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const { name } = event.target;
    setTouchedFields((current) => new Set(current).add(name));
  }

  async function submitVendor(confirmDuplicate: boolean) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const accessToken = await getAccessToken();
      const result = await createVendor(
        { ...input, confirmDuplicate } as VendorInput & { confirmDuplicate: boolean },
        accessToken
      );

      if (result.outcome === "created") {
        router.push("/vendors");
        return;
      }

      if (result.outcome === "possibleDuplicate") {
        setPendingDuplicate(result.vendor);
        return;
      }

      setErrorMessage(result.error);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to add vendor");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPendingDuplicate(null);
    setTouchedFields(new Set(["name", "registration_number", "contact_info"]));

    if (!validation.valid) {
      return;
    }

    await submitVendor(false);
  }

  const nameError = getVisibleFieldError("name", touchedFields, validation);
  const registrationNumberError = getVisibleFieldError("registration_number", touchedFields, validation);
  const contactInfoError = getVisibleFieldError("contact_info", touchedFields, validation);

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-foreground-muted">
          Vendor name
        </label>
        <input
          id="name"
          name="name"
          value={input.name}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {nameError && <ErrorBanner message={nameError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="registration_number" className="text-sm font-medium text-foreground-muted">
          Registration number
        </label>
        <input
          id="registration_number"
          name="registration_number"
          value={input.registration_number}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {registrationNumberError && <ErrorBanner message={registrationNumberError} />}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contact_info" className="text-sm font-medium text-foreground-muted">
          Contact info
        </label>
        <input
          id="contact_info"
          name="contact_info"
          value={input.contact_info}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        {contactInfoError && <ErrorBanner message={contactInfoError} />}
      </div>

      {pendingDuplicate && (
        <DuplicateConfirmation
          attemptedName={input.name}
          possibleDuplicate={pendingDuplicate}
          onConfirm={() => submitVendor(true)}
          onCancel={() => setPendingDuplicate(null)}
          isConfirming={isSubmitting}
        />
      )}

      {errorMessage && <ErrorBanner message={errorMessage} />}

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        icon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        className="self-start"
      >
        {isSubmitting ? "Adding…" : "Add vendor"}
      </Button>
    </form>
  );
}
