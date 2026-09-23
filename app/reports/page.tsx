// Report list (route: /reports)
"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { fetchReports, deleteReport, type ReportListItem } from "@/lib/api/reports";
import ReportTable from "@/components/reports/ReportTable";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LinkButton from "@/components/ui/LinkButton";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import TablePagination from "@/components/ui/TablePagination";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/parsePageParams";
import { resolveReportActionFailureMessage } from "@/lib/ui/reports/resolveReportActionFailureMessage";

type Status = "loading" | "ready" | "error";

export default function ReportsPage() {
  const getAccessToken = useAccessToken();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadReports = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await fetchReports(accessToken, {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      setReports(result.reports);
      setTotal(result.total);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load reports"
      );
      setStatus("error");
    }
  }, [getAccessToken, page]);

  async function handleDelete(id: number) {
    setDeletingId(id);
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await deleteReport(id, accessToken);
      if (result.outcome === "error") {
        setErrorMessage(resolveReportActionFailureMessage(result.code));
        return;
      }
      if (reports.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadReports();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete report");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-medium text-foreground">
            Reports
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            AI-assisted performance reports per vendor and period. Draft reports can be edited; Finalized reports are locked.
          </p>
        </div>
        <LinkButton
          href="/reports/add"
          variant="primary"
          icon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        >
          New report
        </LinkButton>
      </div>

      <div className="flex flex-col gap-4">
        {errorMessage && (
          <ErrorBanner
            message={errorMessage}
            action={
              status === "error" ? (
                <Button type="button" variant="secondary" onClick={loadReports}>
                  Retry
                </Button>
              ) : undefined
            }
          />
        )}

        {status === "loading" && <LoadingIndicator label="Loading reports…" />}

        {status === "ready" && (
          <>
          <ReportTable
            reports={reports}
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            emptyMessage="No reports yet. Create one to get started."
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          <TablePagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
          </>
        )}
      </div>
    </div>
  );
}
