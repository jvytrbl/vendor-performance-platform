// Admin-only audit log viewer (route: /audit-log)
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, ShieldAlert } from "lucide-react";
import { fetchAuditLog, exportAuditLogPdf, type AuditLogPage } from "@/lib/api/auditLog";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/audit/auditTypes";
import AuditLogTable from "@/components/auditLog/AuditLogTable";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import TablePagination from "@/components/ui/TablePagination";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { useAsyncData } from "@/lib/ui/useAsyncData";
import {
  parseAuditLogListView,
  auditLogListSearchParams,
  withAuditLogListFilterChange,
  type AuditLogListView,
} from "@/lib/ui/auditLog/auditLogListUrl";

const PAGE_SIZE = 25;

type FetchResult = AuditLogPage | { forbidden: true };

export default function AuditLogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const getAccessToken = useAccessToken();
  const view = parseAuditLogListView(searchParams);
  const [userEmailInput, setUserEmailInput] = useState(view.userEmail);
  const [exporting, setExporting] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);

  function replaceView(next: AuditLogListView) {
    const query = auditLogListSearchParams(next);
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  // URL-to-input sync on back/forward nav or an external link setting
  // ?userEmail= — same accepted exception as the reports page's search input.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserEmailInput(view.userEmail);
  }, [view.userEmail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = userEmailInput.trim();
      if (next === view.userEmail) return;
      replaceView(withAuditLogListFilterChange(view, { userEmail: next }));
    }, 350);
    return () => clearTimeout(timer);
    // replaceView closes over the latest view; userEmailInput is the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmailInput]);

  const { status, data, errorMessage, reload } = useAsyncData<FetchResult>(
    async (accessToken) => {
      const result = await fetchAuditLog(accessToken, {
        page: view.page,
        pageSize: PAGE_SIZE,
        userEmail: view.userEmail || undefined,
        action: view.action,
        targetType: view.targetType,
        dateFrom: view.dateFrom || undefined,
        dateTo: view.dateTo || undefined,
      });
      if (result.outcome === "forbidden") {
        return { forbidden: true };
      }
      if (result.outcome === "error") {
        throw new Error(result.error);
      }
      return result.page;
    },
    [view.page, view.userEmail, view.action, view.targetType, view.dateFrom, view.dateTo],
    "Failed to load audit log"
  );

  const isForbidden = status === "ready" && data !== null && "forbidden" in data;
  const page = status === "ready" && data !== null && !("forbidden" in data) ? data : null;
  const entries = page?.entries ?? [];
  const total = page?.total ?? 0;

  const hasFilter = Boolean(view.userEmail || view.action || view.targetType || view.dateFrom || view.dateTo);
  const emptyMessage = hasFilter
    ? "No audit log entries match these filters."
    : "No audit log entries yet.";

  async function handleExportPdf() {
    if (exporting) return;
    setExporting(true);
    setExportErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await exportAuditLogPdf(accessToken, {
        userEmail: view.userEmail || undefined,
        action: view.action,
        targetType: view.targetType,
        dateFrom: view.dateFrom || undefined,
        dateTo: view.dateTo || undefined,
      });
      if (result.outcome === "forbidden") {
        setExportErrorMessage("You do not have access to the audit log.");
        return;
      }
      if (result.outcome === "error") {
        setExportErrorMessage(result.error);
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "audit-log-export.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportErrorMessage(error instanceof Error ? error.message : "Failed to export audit log");
    } finally {
      setExporting(false);
    }
  }

  if (isForbidden) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ShieldAlert className="h-8 w-8 text-foreground-subtle" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-base text-foreground-muted">
          You do not have access to the audit log.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-medium text-foreground">Audit log</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Who did what, to which record, and when — across reports, vendors, and transactions.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleExportPdf}
          disabled={exporting}
          icon={<Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
        >
          {exporting ? "Exporting…" : "Export PDF"}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={userEmailInput}
            onChange={(event) => setUserEmailInput(event.target.value)}
            placeholder="Filter by user email…"
            aria-label="Filter by user email"
            className="min-h-11 w-full max-w-sm rounded border border-border bg-surface px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none"
          />
          <select
            aria-label="Action"
            value={view.action ?? "All"}
            onChange={(event) => {
              const value = event.target.value;
              replaceView(
                withAuditLogListFilterChange(view, {
                  action: value === "All" ? undefined : (value as AuditLogListView["action"]),
                })
              );
            }}
            className="min-h-11 appearance-none rounded border border-border bg-surface py-2 pl-3 pr-8 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="All">All actions</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select
            aria-label="Target type"
            value={view.targetType ?? "All"}
            onChange={(event) => {
              const value = event.target.value;
              replaceView(
                withAuditLogListFilterChange(view, {
                  targetType: value === "All" ? undefined : (value as AuditLogListView["targetType"]),
                })
              );
            }}
            className="min-h-11 appearance-none rounded border border-border bg-surface py-2 pl-3 pr-8 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="All">All target types</option>
            {AUDIT_TARGET_TYPES.map((targetType) => (
              <option key={targetType} value={targetType}>
                {targetType}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-foreground-muted">
            From
            <input
              type="date"
              aria-label="Date from"
              value={view.dateFrom}
              onChange={(event) =>
                replaceView(withAuditLogListFilterChange(view, { dateFrom: event.target.value }))
              }
              className="min-h-11 rounded border border-border bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground-muted">
            To
            <input
              type="date"
              aria-label="Date to"
              value={view.dateTo}
              onChange={(event) =>
                replaceView(withAuditLogListFilterChange(view, { dateTo: event.target.value }))
              }
              className="min-h-11 rounded border border-border bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        {(errorMessage || exportErrorMessage) && (
          <ErrorBanner
            message={errorMessage ?? exportErrorMessage ?? ""}
            action={
              status === "error" ? (
                <Button type="button" variant="secondary" onClick={reload}>
                  Retry
                </Button>
              ) : undefined
            }
          />
        )}

        {status === "loading" && <LoadingIndicator label="Loading audit log…" />}

        {status === "ready" && page && (
          <>
            <AuditLogTable entries={entries} emptyMessage={emptyMessage} />
            <TablePagination
              page={view.page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={(nextPage) => replaceView({ ...view, page: nextPage })}
            />
          </>
        )}
      </div>
    </div>
  );
}
