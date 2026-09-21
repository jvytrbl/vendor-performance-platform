"use client";

import { useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createVendor, type VendorInput } from "@/lib/api/vendors";
import { validateVendorInput } from "@/lib/domain/vendors/validateVendorInput";
import { getVisibleFieldError } from "@/lib/ui/forms/getVisibleFieldError";
import type { DuplicateVendorMatch } from "@/lib/ui/vendors/buildDuplicateConfirmMessage";
import { useAccessToken } from "@/lib/auth/useAccessToken";
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
        <label htmlFor="name" className="text-sm font-medium text-neutral-700">
          Vendor name
        </label>
        <input
          id="name"
          name="name"
          value={input.name}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
        />
        {nameError && <p className="text-sm text-red-700">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="registration_number" className="text-sm font-medium text-neutral-700">
          Registration number
        </label>
        <input
          id="registration_number"
          name="registration_number"
          value={input.registration_number}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
        />
        {registrationNumberError && <p className="text-sm text-red-700">{registrationNumberError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contact_info" className="text-sm font-medium text-neutral-700">
          Contact info
        </label>
        <input
          id="contact_info"
          name="contact_info"
          value={input.contact_info}
          onChange={handleChange}
          onBlur={handleBlur}
          className="rounded border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
        />
        {contactInfoError && <p className="text-sm text-red-700">{contactInfoError}</p>}
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

      {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-neutral-300"
      >
        {isSubmitting ? "Adding…" : "Add vendor"}
      </button>
    </form>
  );
}
