"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createVendor, type VendorInput } from "@/lib/api/vendors";
import { validateVendorInput } from "@/lib/domain/vendors/validateVendorInput";
import { getVisibleFieldError } from "@/lib/ui/forms/getVisibleFieldError";
import type { DuplicateVendorMatch } from "@/lib/ui/vendors/buildDuplicateConfirmMessage";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import FormField from "@/components/forms/FormField";
import { fieldControlClass } from "@/components/forms/fieldClasses";
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

  function touch(name: string) {
    setTouchedFields((current) => new Set(current).add(name));
  }

  function updateField(name: keyof VendorInput, value: string) {
    setInput((current) => ({ ...current, [name]: value }));
    touch(name);
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
    <form
      onSubmit={handleSubmit}
      className="flex max-w-xl flex-col gap-6 rounded-lg border border-border bg-surface-muted p-8"
    >
      <FormField id="name" label="Vendor name" error={nameError}>
        <input
          id="name"
          name="name"
          value={input.name}
          onChange={(event) => updateField("name", event.target.value)}
          onBlur={() => touch("name")}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "name-error" : undefined}
          className={fieldControlClass}
        />
      </FormField>

      <FormField id="registration_number" label="Registration number" error={registrationNumberError}>
        <input
          id="registration_number"
          name="registration_number"
          value={input.registration_number}
          onChange={(event) => updateField("registration_number", event.target.value)}
          onBlur={() => touch("registration_number")}
          aria-invalid={registrationNumberError ? true : undefined}
          aria-describedby={registrationNumberError ? "registration_number-error" : undefined}
          className={fieldControlClass}
        />
      </FormField>

      <FormField id="contact_info" label="Contact info" error={contactInfoError}>
        <input
          id="contact_info"
          name="contact_info"
          value={input.contact_info}
          onChange={(event) => updateField("contact_info", event.target.value)}
          onBlur={() => touch("contact_info")}
          aria-invalid={contactInfoError ? true : undefined}
          aria-describedby={contactInfoError ? "contact_info-error" : undefined}
          className={fieldControlClass}
        />
      </FormField>

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
