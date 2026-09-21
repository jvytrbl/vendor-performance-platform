export const PLACEHOLDER = "—";

export function formatDate(value: string | undefined): string {
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

export function formatPrice(value: number | undefined): string {
  if (value === undefined || value === null) {
    return PLACEHOLDER;
  }
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(value);
}

export function formatQuantity(value: number | undefined): string {
  if (value === undefined || value === null) {
    return PLACEHOLDER;
  }
  return String(value);
}
