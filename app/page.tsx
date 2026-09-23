"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchReports, type ReportListItem } from "@/lib/api/reports";
import LinkButton from "@/components/ui/LinkButton";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/parsePageParams";

type Status = "loading" | "ready" | "error";

function periodLabel(report: ReportListItem): string {
  return `${String(report.period_start).slice(0, 10)} to ${String(report.period_end).slice(0, 10)}`;
}

export default function Home() {
  const getAccessToken = useAccessToken();
  const [latestDraft, setLatestDraft] = useState<ReportListItem | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      let page = 1;
      let draft: ReportListItem | null = null;
      while (page < 1000) {
        const result = await fetchReports(accessToken, {
          page,
          pageSize: DEFAULT_PAGE_SIZE,
        });
        draft = result.reports.find((report) => report.status === "Draft") ?? null;
        if (draft || result.reports.length === 0 || page * DEFAULT_PAGE_SIZE >= result.total) {
          break;
        }
        page += 1;
      }
      setLatestDraft(draft);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load reports");
      setStatus("error");
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="flex max-w-xl flex-col gap-10">
      <div>
        <h1 className="font-display text-4xl font-medium text-foreground">
          Vendor Performance Platform
        </h1>
        <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-foreground-muted">
          Open a draft, start a report, or update the vendor and transaction records behind it.
        </p>
      </div>

      {status === "loading" && <LoadingIndicator label="Loading reports…" />}

      {status === "error" && (
        <div className="flex flex-col items-start gap-3">
          <ErrorBanner
            message={errorMessage ?? "Failed to load reports"}
            action={
              errorMessage !== "Not signed in" ? (
                <Button type="button" variant="secondary" onClick={loadReports}>
                  Try again
                </Button>
              ) : undefined
            }
          />
          {errorMessage === "Not signed in" && (
            <p className="text-sm text-foreground-muted">Sign in to open your reports.</p>
          )}
        </div>
      )}

      {status === "ready" && (
        <div className="flex flex-col gap-8">
          {latestDraft ? (
            <Link
              href={`/reports/${latestDraft.id}`}
              className="flex max-w-[65ch] flex-col gap-1 rounded border border-border bg-surface px-4 py-4 transition-colors duration-150 ease-out hover:bg-surface-muted"
            >
              <span className="text-xs font-medium text-foreground-muted">Continue draft</span>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                {latestDraft.reference_number}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                <span>
                  {latestDraft.period_type} · {periodLabel(latestDraft)}
                </span>
                <StatusBadge status={latestDraft.status} />
              </span>
            </Link>
          ) : (
            <p className="max-w-[65ch] text-sm leading-relaxed text-foreground-muted">
              No draft is open. Start a report when the vendor list and transactions are ready.
            </p>
          )}

          <div className="flex flex-col items-start gap-6">
            <LinkButton href="/reports/add" variant="primary">
              New report
            </LinkButton>
            <nav aria-label="Work areas" className="flex flex-col gap-2 text-sm font-medium">
              <Link href="/reports" className="text-accent hover:underline">
                All reports
              </Link>
              <Link href="/vendors" className="text-accent hover:underline">
                Vendors
              </Link>
              <Link href="/transactions" className="text-accent hover:underline">
                Transactions
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
