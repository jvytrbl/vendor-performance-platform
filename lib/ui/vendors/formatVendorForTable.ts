import type { VendorRecord } from "../../api/vendors";

export interface FormattedVendorRow {
  id: number;
  name: string;
  registrationNumber: string;
  contactInfo: string;
  createdAt: string;
}

const PLACEHOLDER = "—";

export function formatVendorForTable(vendor: VendorRecord): FormattedVendorRow {
  return {
    id: vendor.id,
    name: vendor.name,
    registrationNumber: vendor.registration_number ?? PLACEHOLDER,
    contactInfo: vendor.contact_info ?? PLACEHOLDER,
    createdAt: formatDate(vendor.created_at),
  };
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return PLACEHOLDER;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return PLACEHOLDER;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}