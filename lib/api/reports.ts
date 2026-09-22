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

export async function fetchReports(accessToken: string): Promise<ReportListItem[]> {
  const response = await fetch("/api/reports", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to fetch reports");
  }

  return body.reports;
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
