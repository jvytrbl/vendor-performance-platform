export type ReportStatusFilter = "Draft" | "Finalized";
export type ReportSortBy = "periodStart" | "createdAt";
export type ReportSortOrder = "asc" | "desc";

export interface ReportListFilterInput {
  status?: string | null;
  search?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
}

export type ParsedReportListFilters =
  | {
      ok: true;
      status?: ReportStatusFilter;
      search?: string;
      sortBy: ReportSortBy;
      sortOrder: ReportSortOrder;
    }
  | { ok: false; field: "status" | "search" | "sortBy" | "sortOrder"; error: string };

export interface ReportListQueryParts {
  whereClause: string;
  orderByClause: string;
  bindings: { name: string; value: string }[];
}

function likePattern(term: string): string {
  const escaped = term.replace(/[%_\[\]]/g, (char) => `[${char}]`);
  return `%${escaped}%`;
}

export function parseReportListFilters(input: ReportListFilterInput): ParsedReportListFilters {
  const status = input.status?.trim() || undefined;
  if (status !== undefined && status !== "Draft" && status !== "Finalized") {
    return { ok: false, field: "status", error: "status must be Draft or Finalized" };
  }

  const sortBy = input.sortBy?.trim() || undefined;
  if (sortBy !== undefined && sortBy !== "periodStart" && sortBy !== "createdAt") {
    return { ok: false, field: "sortBy", error: "sortBy must be periodStart or createdAt" };
  }

  const sortOrder = input.sortOrder?.trim() || undefined;
  if (sortOrder !== undefined && sortOrder !== "asc" && sortOrder !== "desc") {
    return { ok: false, field: "sortOrder", error: "sortOrder must be asc or desc" };
  }

  const search = input.search?.trim() || undefined;

  return {
    ok: true,
    status,
    search,
    sortBy: sortBy ?? "createdAt",
    sortOrder: sortOrder ?? "desc",
  };
}

export function buildReportListQuery(filters: {
  status?: ReportStatusFilter;
  search?: string;
  sortBy?: ReportSortBy;
  sortOrder?: ReportSortOrder;
}): ReportListQueryParts {
  const conditions: string[] = [];
  const bindings: { name: string; value: string }[] = [];

  if (filters.status) {
    conditions.push("status = @status");
    bindings.push({ name: "status", value: filters.status });
  }

  if (filters.search) {
    conditions.push("reference_number LIKE @search");
    bindings.push({ name: "search", value: likePattern(filters.search) });
  }

  const column = filters.sortBy === "periodStart" ? "period_start" : "created_at";
  const direction = filters.sortOrder === "asc" ? "ASC" : "DESC";

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    orderByClause: `ORDER BY ${column} ${direction}`,
    bindings,
  };
}
