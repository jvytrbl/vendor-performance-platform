const REQUIRED_COLUMNS = [
  "vendor_name",
  "transaction_date",
  "item_description",
  "agreed_price",
  "agreed_delivery_date",
  "quantity_ordered",
];

export type HeaderValidationResult =
  | { valid: true }
  | { valid: false; error: string; code: string; field: string };

function normalize(header: unknown): string {
  return typeof header === "string" ? header.trim().toLowerCase() : "";
}

export function validateUploadHeaders(headers: string[]): HeaderValidationResult {
  const normalizedHeaders = headers.map(normalize);
  const missing = REQUIRED_COLUMNS.filter((column) => !normalizedHeaders.includes(column));

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required column(s): ${missing.join(", ")}`,
      code: "MISSING_COLUMNS",
      field: "headers",
    };
  }

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const header of normalizedHeaders) {
    if (seen.has(header)) {
      duplicates.add(header);
    }
    seen.add(header);
  }

  if (duplicates.size > 0) {
    return {
      valid: false,
      error: `Duplicate column header(s): ${[...duplicates].join(", ")}`,
      code: "DUPLICATE_COLUMNS",
      field: "headers",
    };
  }

  return { valid: true };
}