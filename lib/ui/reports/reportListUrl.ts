import type { ReportSortBy, ReportSortOrder, ReportStatusFilter } from "@/lib/domain/reports/reportListQuery";

export interface ReportListView {
  status?: ReportStatusFilter;
  search: string;
  sortBy: ReportSortBy;
  sortOrder: ReportSortOrder;
  page: number;
}

export function parseReportListView(params: URLSearchParams): ReportListView {
  const status = params.get("status");
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  const page = Number(params.get("page"));

  return {
    status: status === "Draft" || status === "Finalized" ? status : undefined,
    search: params.get("search")?.trim() ?? "",
    sortBy: sortBy === "periodStart" ? "periodStart" : "createdAt",
    sortOrder: sortOrder === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function reportListSearchParams(view: ReportListView): string {
  const params = new URLSearchParams();
  if (view.status) params.set("status", view.status);
  if (view.search) params.set("search", view.search);
  params.set("sortBy", view.sortBy);
  params.set("sortOrder", view.sortOrder);
  params.set("page", String(view.page));
  return params.toString();
}

export function withReportListFilterChange(
  current: ReportListView,
  patch: Partial<Pick<ReportListView, "status" | "search" | "sortBy" | "sortOrder">>
): ReportListView {
  return { ...current, ...patch, page: 1 };
}
