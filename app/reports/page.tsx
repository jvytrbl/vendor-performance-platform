// Report list (route: /reports)
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchReports, type ReportListItem } from "@/lib/api/reports";
import ReportTable from "@/components/reports/ReportTable";
import { useAccessToken } from "@/lib/auth/useAccessToken";

type Status = "loading" | "ready" | "error";

export default function ReportsPage() {
  const getAccessToken = useAccessToken();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await fetchReports(accessToken);
      setReports(result);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load reports"
      );
      setStatus("error");
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Reports
        </h1>
        <Link
          href="/reports/add"
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          New report
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {status === "loading" && (
          <p className="text-sm text-foreground-muted">Loading reports…</p>
        )}

        {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

        {status === "ready" && (
          <ReportTable
            reports={reports}
            emptyMessage="No reports yet. Create one to get started."
          />
        )}
      </div>
    </div>
  );
}
