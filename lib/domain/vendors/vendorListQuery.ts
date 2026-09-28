export type VendorSortBy = "transactionCount";
export type VendorSortOrder = "asc" | "desc";

export interface VendorListSortInput {
  sortBy?: string | null;
  sortOrder?: string | null;
}

export type ParsedVendorListSort =
  | { ok: true; sortBy?: VendorSortBy; sortOrder: VendorSortOrder }
  | { ok: false; field: "sortBy" | "sortOrder"; error: string };

export function parseVendorListSort(input: VendorListSortInput): ParsedVendorListSort {
  const sortBy = input.sortBy?.trim() || undefined;
  if (sortBy !== undefined && sortBy !== "transactionCount") {
    return { ok: false, field: "sortBy", error: "sortBy must be transactionCount" };
  }

  const sortOrder = input.sortOrder?.trim() || undefined;
  if (sortOrder !== undefined && sortOrder !== "asc" && sortOrder !== "desc") {
    return { ok: false, field: "sortOrder", error: "sortOrder must be asc or desc" };
  }

  return {
    ok: true,
    sortBy,
    sortOrder: sortOrder ?? "desc",
  };
}

export function buildVendorListOrderBy(sort: {
  sortBy?: VendorSortBy;
  sortOrder?: VendorSortOrder;
}): string {
  if (sort.sortBy === "transactionCount") {
    const direction = sort.sortOrder === "asc" ? "ASC" : "DESC";
    return `ORDER BY transaction_count ${direction}, v.created_at DESC`;
  }

  return "ORDER BY v.created_at DESC";
}
