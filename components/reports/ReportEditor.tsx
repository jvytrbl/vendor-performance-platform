"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useMsal } from "@azure/msal-react";
import type { ReportSectionInput } from "@/lib/domain/reports/validateReportSections";
import {
  exportReport,
  fetchReport,
  finalizeReport,
  generateReport,
  updateReportSections,
  type ReportDetail,
  type ReportMetric,
} from "@/lib/api/reports";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import {
  clearDraftFields,
  restoreDraftFields,
  saveDraftFields,
} from "@/lib/ui/reports/reportDraftStorage";
import { resolveReportActionFailureMessage } from "@/lib/ui/reports/resolveReportActionFailureMessage";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

const API_SCOPE = "api://542c58fb-c9a9-4e98-a11e-da6fea5b1809/access_as_user";

const SECTIONS: { key: keyof ReportSectionInput; label: string }[] = [
  { key: "vendor_summary", label: "Vendor Summary" },
  { key: "delivery_performance", label: "Delivery Performance" },
  { key: "pricing_analysis", label: "Pricing Analysis" },
  { key: "order_accuracy", label: "Order Accuracy" },
];

function emptySections(): ReportSectionInput {
  return {
    vendor_summary: "",
    delivery_performance: "",
    pricing_analysis: "",
    order_accuracy: "",
  };
}

function sectionsFromReport(report: ReportDetail): ReportSectionInput {
  return {
    vendor_summary: report.vendor_summary ?? "",
    delivery_performance: report.delivery_performance ?? "",
    pricing_analysis: report.pricing_analysis ?? "",
    order_accuracy: report.order_accuracy ?? "",
  };
}

function formatMetric(value: number | null): string {
  return value === null ? "—" : String(value);
}

export default function ReportEditor({ id }: { id: number }) {
  const { instance } = useMsal();
  const getAccessToken = useAccessToken();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [sections, setSections] = useState<ReportSectionInput>(emptySections());
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState<"saving" | "generating" | "finalizing" | "exporting" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const accessToken = await getAccessToken();
    const loaded = await fetchReport(id, accessToken);
    const stashed = restoreDraftFields(id, window.sessionStorage);
    setReport(loaded);
    setSections(stashed ?? sectionsFromReport(loaded));
    setRestored(stashed !== null);
  }, [getAccessToken, id]);

  useEffect(() => {
    load().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load report");
    });
  }, [load]);

  const isDraft = report?.status === "Draft";
  const locked = !isDraft || busy !== null;

  async function handleSave() {
    if (!isDraft || busy) return;
    setBusy("saving");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await updateReportSections(id, sections, accessToken);
      if (result.outcome === "error") {
        if (result.code === "UNAUTHORIZED") {
          saveDraftFields(id, sections, window.sessionStorage);
          await instance.loginRedirect({ scopes: [API_SCOPE] });
          return;
        }
        setErrorMessage(resolveReportActionFailureMessage(result.code));
        return;
      }
      clearDraftFields(id, window.sessionStorage);
      setRestored(false);
      const refreshed = await fetchReport(id, accessToken);
      setReport(refreshed);
      setSections(sectionsFromReport(refreshed));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save report");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerate() {
    if (!isDraft || busy) return;
    setBusy("generating");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await generateReport(id, accessToken);
      if (result.outcome === "error") {
        setErrorMessage(resolveReportActionFailureMessage(result.code));
        return;
      }
      clearDraftFields(id, window.sessionStorage);
      setRestored(false);
      const refreshed = await fetchReport(id, accessToken);
      setReport(refreshed);
      setSections(sectionsFromReport(refreshed));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setBusy(null);
    }
  }

  async function handleFinalize() {
    if (!isDraft || busy) return;
    setBusy("finalizing");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await finalizeReport(id, accessToken);
      if (result.outcome === "error") {
        setErrorMessage(resolveReportActionFailureMessage(result.code));
        return;
      }
      clearDraftFields(id, window.sessionStorage);
      const refreshed = await fetchReport(id, accessToken);
      setReport(refreshed);
      setSections(sectionsFromReport(refreshed));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to finalize report");
    } finally {
      setBusy(null);
    }
  }

  async function handleExport(format: "pdf" | "docx") {
    if (report?.status !== "Finalized" || busy) return;
    setBusy("exporting");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await exportReport(id, format, accessToken);
      if (result.outcome === "error") {
        setErrorMessage(resolveReportActionFailureMessage(result.code));
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export report");
    } finally {
      setBusy(null);
    }
  }

  if (!report && !errorMessage) {
    return <p className="text-sm text-foreground-muted">Loading report…</p>;
  }

  if (!report) {
    return <p className="text-sm text-danger">{errorMessage}</p>;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/reports" className="text-sm font-medium text-accent hover:underline">
          ← Back to reports
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
          {report.reference_number}
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          {report.period_type} · {String(report.period_start).slice(0, 10)} to{" "}
          {String(report.period_end).slice(0, 10)} · {report.status}
        </p>
      </div>

      {restored && (
        <p className="text-sm text-foreground-muted">
          Restored unsaved section text from this browser session.
        </p>
      )}
      {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

      {SECTIONS.map((section) => (
        <label key={section.key} className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{section.label}</span>
          <textarea
            value={sections[section.key]}
            disabled={locked}
            rows={6}
            onChange={(event) =>
              setSections((current) => ({ ...current, [section.key]: event.target.value }))
            }
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground">Metrics</h2>
        {(report.metrics ?? []).length === 0 ? (
          <p className="text-sm text-foreground-muted">No metrics yet. Generate the report first.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">On time %</th>
                  <th className="px-3 py-2">Avg delay</th>
                  <th className="px-3 py-2">Txns</th>
                </tr>
              </thead>
              <tbody>
                {(report.metrics ?? []).map((metric: ReportMetric) => (
                  <tr
                    key={`${metric.vendor_id}-${metric.period_start}`}
                    className="border-b border-border"
                  >
                    <td className="px-3 py-2">{metric.vendor_id}</td>
                    <td className="px-3 py-2">
                      {String(metric.period_start).slice(0, 10)} –{" "}
                      {String(metric.period_end).slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">{formatMetric(metric.on_time_delivery_rate)}</td>
                    <td className="px-3 py-2">{formatMetric(metric.avg_delay_days)}</td>
                    <td className="px-3 py-2">{metric.transaction_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {busy === "generating" && (
        <LoadingIndicator label="Generating the report…" />
      )}

      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={handleSave}
              className="rounded border border-border px-4 py-2 text-sm"
            >
              {busy === "saving" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={handleGenerate}
              className="rounded bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-60"
            >
              {busy === "generating" ? "Generating…" : "Generate"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={handleFinalize}
              className="rounded border border-border px-4 py-2 text-sm"
            >
              {busy === "finalizing" ? "Finalizing…" : "Finalize"}
            </button>
          </>
        )}
        <button
          type="button"
          disabled={report.status !== "Finalized" || busy !== null}
          onClick={() => handleExport("pdf")}
          className="rounded border border-border px-4 py-2 text-sm disabled:opacity-60"
        >
          Export PDF
        </button>
        <button
          type="button"
          disabled={report.status !== "Finalized" || busy !== null}
          onClick={() => handleExport("docx")}
          className="rounded border border-border px-4 py-2 text-sm disabled:opacity-60"
        >
          Export Word
        </button>
      </div>
    </div>
  );
}
