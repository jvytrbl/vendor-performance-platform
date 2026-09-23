import type { ReportSectionInput } from "@/lib/domain/reports/validateReportSections";

export interface ReportListItem {
  id: number;
  reference_number: string;
  period_type: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
}

export interface ReportInput {
  period_type: "Quarterly" | "Custom";
  period_start: string;
  period_end: string;
  vendor_ids: number[];
}

export interface ReportListQuery {
  page?: number;
  pageSize?: number;
  status?: "Draft" | "Finalized";
  search?: string;
  sortBy?: "periodStart" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ReportPage {
  reports: ReportListItem[];
  total: number;
}

export async function fetchReports(
  accessToken: string,
  query: ReportListQuery = {}
): Promise<ReportPage> {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);
  const search = params.toString();
  const response = await fetch(`/api/reports${search ? `?${search}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to fetch reports");
  }

  return { reports: body.reports, total: body.total };
}

export type CreateReportResult =
  | { outcome: "created"; report: ReportListItem }
  | { outcome: "error"; error: string; code: string; field?: string };

export async function createReport(
  input: ReportInput,
  accessToken: string
): Promise<CreateReportResult> {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  const body = await response.json();

  if (response.status === 201) {
    return { outcome: "created", report: body.data };
  }

  return {
    outcome: "error",
    error: body.error,
    code: body.code,
    field: body.field,
  };
}

export interface ReportMetric {
  vendor_id: number;
  period_start: string;
  period_end: string;
  on_time_delivery_rate: number | null;
  avg_delay_days: number | null;
  overcharge_rate: number | null;
  avg_overcharge_pct: number | null;
  undercharge_rate: number | null;
  shortfall_rate: number | null;
  avg_shortfall_units: number | null;
  overdelivery_rate: number | null;
  avg_overdelivery_units: number | null;
  transaction_count: number;
}

export interface ReportDetail {
  id: number;
  reference_number: string;
  period_type: string;
  period_start: string;
  period_end: string;
  status: string;
  vendor_summary: string | null;
  delivery_performance: string | null;
  pricing_analysis: string | null;
  order_accuracy: string | null;
  created_at: string;
  finalized_at: string | null;
  vendor_ids: number[];
  metrics: ReportMetric[];
}

export type ReportActionResult =
  | { outcome: "ok"; report: ReportDetail }
  | { outcome: "error"; error: string; code: string; field?: string };

export async function fetchReport(
  id: number,
  accessToken: string
): Promise<ReportDetail> {
  const response = await fetch(`/api/reports/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to fetch report");
  }
  return body.data;
}

export async function updateReportSections(
  id: number,
  sections: ReportSectionInput,
  accessToken: string
): Promise<ReportActionResult> {
  const response = await fetch(`/api/reports/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(sections),
  });
  const body = await response.json();
  if (response.ok) {
    return { outcome: "ok", report: body.data };
  }
  return { outcome: "error", error: body.error, code: body.code, field: body.field };
}

export async function generateReport(
  id: number,
  accessToken: string
): Promise<ReportActionResult> {
  const response = await fetch(`/api/reports/${id}/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();
  if (response.ok) {
    return { outcome: "ok", report: body.data };
  }
  return { outcome: "error", error: body.error, code: body.code };
}

export async function finalizeReport(
  id: number,
  accessToken: string
): Promise<ReportActionResult> {
  const response = await fetch(`/api/reports/${id}/finalize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();
  if (response.ok) {
    return { outcome: "ok", report: body.data };
  }
  return { outcome: "error", error: body.error, code: body.code, field: body.field };
}

export type ExportReportResult =
  | { outcome: "file"; blob: Blob; filename: string }
  | { outcome: "error"; error: string; code: string };

export async function exportReport(
  id: number,
  format: "pdf" | "docx",
  accessToken: string
): Promise<ExportReportResult> {
  const response = await fetch(`/api/reports/${id}/export?format=${format}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) {
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    return { outcome: "file", blob, filename: match?.[1] ?? `report-${id}.${format}` };
  }
  const body = await response.json();
  return { outcome: "error", error: body.error, code: body.code };
}

export type DeleteReportResult =
  | { outcome: "deleted" }
  | { outcome: "error"; error: string; code: string };

export async function deleteReport(
  id: number,
  accessToken: string
): Promise<DeleteReportResult> {
  const response = await fetch(`/api/reports/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) {
    return { outcome: "deleted" };
  }
  const body = await response.json();
  return { outcome: "error", error: body.error, code: body.code };
}
