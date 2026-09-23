// Report list (route: /reports)
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { fetchReports, deleteReport } from "@/lib/api/reports";
import type { ReportSortBy } from "@/lib/domain/reports/reportListQuery";
import ReportTable from "@/components/reports/ReportTable";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LinkButton from "@/components/ui/LinkButton";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import TablePagination from "@/components/ui/TablePagination";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { useAsyncData } from "@/lib/ui/useAsyncData";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/parsePageParams";
import { resolveReportActionFailureMessage } from "@/lib/ui/reports/resolveReportActionFailureMessage";
import {
  parseReportListView,
  reportListSearchParams,
  withReportListFilterChange,
  type ReportListView,
} from "@/lib/ui/reports/reportListUrl";

export default function ReportsPage() {
  const getAccessToken = useAccessToken();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseReportListView(searchParams);
  const [searchInput, setSearchInput] = useState(view.search);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  function replaceView(next: ReportListView) {
    const query = reportListSearchParams(next);
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  // Synced from the URL, which can change from outside this input (back/
  // forward nav, a link elsewhere setting ?search=). react-hooks/set-state-in-effect
  // flags this on principle, but URL-to-input sync is a standard, accepted
  // exception — there's no fetch to defer behind here, just a plain value
  // copy on prop-equivalent change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(view.search);
  }, [view.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      if (next === view.search) return;
      replaceView(withReportListFilterChange(view, { search: next }));
    }, 350);
    return () => clearTimeout(timer);
    // replaceView closes over the latest view; searchInput is the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const { status, data, errorMessage, reload } = useAsyncData(
    (accessToken) =>
      fetchReports(accessToken, {
        page: view.page,
        pageSize: DEFAULT_PAGE_SIZE,
        status: view.status,
        search: view.search || undefined,
        sortBy: view.sortBy,
        sortOrder: view.sortOrder,
      }),
    [view.page, view.status, view.search, view.sortBy, view.sortOrder],
    "Failed to load reports"
  );
  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;

  async function handleDelete(id: number) {
    setDeletingId(id);
    setDeleteErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await deleteReport(id, accessToken);
      if (result.outcome === "error") {
        setDeleteErrorMessage(resolveReportActionFailureMessage(result.code));
        return;
      }
      if (reports.length === 1 && view.page > 1) {
        replaceView({ ...view, page: view.page - 1 });
      } else {
        reload();
      }
    } catch (error) {
      setDeleteErrorMessage(error instanceof Error ? error.message : "Failed to delete report");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSort(column: ReportSortBy) {
    const sameColumn = view.sortBy === column;
    const sortOrder = sameColumn && view.sortOrder === "desc" ? "asc" : "desc";
    replaceView(withReportListFilterChange(view, { sortBy: column, sortOrder }));
  }

  const hasFilter = Boolean(view.status || view.search);
  const emptyMessage = hasFilter
    ? "No reports match these filters."
    : "No reports yet. Create one to get started.";

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by reference…"
              aria-label="Search by reference"
              className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none"
            />
          </div>
          <select
            aria-label="Status"
            value={view.status ?? "All"}
            onChange={(event) => {
              const value = event.target.value;
              replaceView(
                withReportListFilterChange(view, {
                  status: value === "Draft" || value === "Finalized" ? value : undefined,
                })
              );
            }}
            className="min-h-11 appearance-none rounded border border-border bg-surface py-2 pl-3 pr-8 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="All">All</option>
            <option value="Draft">Draft</option>
            <option value="Finalized">Finalized</option>
          </select>
        </div>

        {(errorMessage || deleteErrorMessage) && (
          <ErrorBanner
            message={errorMessage ?? deleteErrorMessage ?? ""}
            action={
              status === "error" ? (
                <Button type="button" variant="secondary" onClick={reload}>
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
            page={view.page}
            pageSize={DEFAULT_PAGE_SIZE}
            sortBy={view.sortBy}
            sortOrder={view.sortOrder}
            onSort={handleSort}
            emptyMessage={emptyMessage}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
          <TablePagination
            page={view.page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={total}
            onPageChange={(page) => replaceView({ ...view, page })}
          />
          </>
        )}
      </div>
    </div>
  );
}
