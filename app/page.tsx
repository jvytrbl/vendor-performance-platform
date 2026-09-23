"use client";

import { useMsal } from "@azure/msal-react";
import { fetchReports, type ReportListItem } from "@/lib/api/reports";
import { fetchVendors } from "@/lib/api/vendors";
import { fetchTransactions } from "@/lib/api/transactions";
import LinkButton from "@/components/ui/LinkButton";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import SignedOutLanding from "@/components/landing/SignedOutLanding";
import { useAsyncData } from "@/lib/ui/useAsyncData";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination/parsePageParams";

const WORK_AREAS = [
  {
    href: "/reports",
    label: "All reports",
    key: "reports" as const,
    action: "View reports",
    description: "Drafts and finalized reports for each period.",
  },
  {
    href: "/vendors",
    label: "Vendors",
    key: "vendors" as const,
    action: "View vendors",
    description: "Registered suppliers and their contact details.",
  },
  {
    href: "/transactions",
    label: "Transactions",
    key: "transactions" as const,
    action: "View transactions",
    description: "Recorded purchases and deliveries per vendor.",
  },
];

type TimeOfDay = "morning" | "afternoon" | "evening";

function periodLabel(report: ReportListItem): string {
  return `${String(report.period_start).slice(0, 10)} to ${String(report.period_end).slice(0, 10)}`;
}

function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function accountDisplayName(account: { name?: string; username: string }): string {
  const named = account.name?.trim();
  if (named) return named;
  const local = account.username.split("@")[0]?.trim();
  return local || account.username;
}

interface HomeData {
  counts: { reports: number; vendors: number; transactions: number };
  latestDraft: ReportListItem | null;
}

async function loadHomeData(accessToken: string): Promise<HomeData> {
  const [firstReports, vendors, transactions] = await Promise.all([
    fetchReports(accessToken, { page: 1, pageSize: DEFAULT_PAGE_SIZE }),
    fetchVendors(accessToken, { page: 1, pageSize: 1 }),
    fetchTransactions({ page: 1, pageSize: 1 }, accessToken),
  ]);

  const counts = {
    reports: firstReports.total,
    vendors: vendors.total,
    transactions: transactions.total,
  };

  let draft = firstReports.reports.find((report) => report.status === "Draft") ?? null;
  let page = 1;
  let result = firstReports;
  while (
    !draft &&
    result.reports.length > 0 &&
    page * DEFAULT_PAGE_SIZE < result.total &&
    page < 1000
  ) {
    page += 1;
    result = await fetchReports(accessToken, { page, pageSize: DEFAULT_PAGE_SIZE });
    draft = result.reports.find((report) => report.status === "Draft") ?? null;
  }

  return { counts, latestDraft: draft };
}

export default function Home() {
  const { accounts } = useMsal();
  const signedIn = accounts.length > 0;

  const { status, data, errorMessage, reload } = useAsyncData(
    loadHomeData,
    [],
    "Failed to load home",
    { enabled: signedIn }
  );
  const counts = data?.counts ?? { reports: 0, vendors: 0, transactions: 0 };
  const latestDraft = data?.latestDraft ?? null;

  if (!signedIn) {
    return <SignedOutLanding />;
  }

  const name = accountDisplayName(accounts[0]);
  // Computed at render time, not stored in state — it's cheap, and an
  // effect just to set it once would have nothing to defer past an await.
  const greeting = timeOfDay(new Date());

  return (
    <div className="flex max-w-3xl flex-col">
      <h1 className="font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
        Good {greeting}, {name}
      </h1>

      {status === "loading" && (
        <div className="mt-12">
          <LoadingIndicator label="Loading reports…" />
        </div>
      )}

      {status === "error" && (
        <div className="mt-12 flex flex-col items-start gap-3">
          <ErrorBanner
            message={errorMessage ?? "Failed to load reports"}
            action={
              <Button type="button" variant="secondary" onClick={reload}>
                Try again
              </Button>
            }
          />
        </div>
      )}

      {status === "ready" && (
        <div className="mt-12 flex flex-col gap-12">
          {latestDraft ? (
            <article className="flex max-w-prose flex-col gap-3 rounded border border-border bg-surface px-6 py-7">
              <h2 className="font-display text-3xl font-medium text-foreground">Continue draft</h2>
              <p className="text-xl font-medium tracking-tight text-foreground">
                {latestDraft.reference_number}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                <span>
                  {latestDraft.period_type} · {periodLabel(latestDraft)}
                </span>
                <StatusBadge status={latestDraft.status} />
              </p>
              <p className="text-sm leading-relaxed text-foreground-muted">
                Open this report to keep editing the four sections.
              </p>
              <LinkButton href={`/reports/${latestDraft.id}`} variant="secondary">
                Open draft
              </LinkButton>
            </article>
          ) : (
            <p className="max-w-prose text-base leading-relaxed text-foreground">
              No draft is open yet. Start a report when the vendor list and transactions are ready.
            </p>
          )}

          <div className="flex flex-col items-start gap-8">
            <LinkButton href="/reports/add" variant="primary">
              New report
            </LinkButton>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              {WORK_AREAS.map((area) => (
                <article
                  key={area.href}
                  className="flex flex-col gap-3 rounded border border-border bg-surface px-5 py-5"
                >
                  <p className="text-3xl font-medium tabular-nums tracking-tight text-foreground">
                    {counts[area.key]}
                  </p>
                  <h2 className="text-sm font-medium text-foreground">{area.label}</h2>
                  <p className="text-sm leading-relaxed text-foreground-muted">{area.description}</p>
                  <div className="mt-auto pt-1">
                    <LinkButton href={area.href} variant="secondary">
                      {area.action}
                    </LinkButton>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
