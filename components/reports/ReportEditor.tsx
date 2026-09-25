"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMsal } from "@azure/msal-react";
import { ArrowLeft, Download, Info, Pencil, Save, Trash2 } from "lucide-react";
import type { ReportSectionInput } from "@/lib/domain/reports/validateReportSections";
import { validateReportReadyToFinalize } from "@/lib/domain/reports/validateReportReadyToFinalize";
import {
  deleteReport,
  exportReport,
  fetchReport,
  finalizeReport,
  generateReport,
  updateReportSections,
  type ReportDetail,
  type ReportMetric,
} from "@/lib/api/reports";
import { fetchAllVendors } from "@/lib/api/vendors";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import {
  clearDraftFields,
  restoreDraftFields,
  saveDraftFields,
} from "@/lib/ui/reports/reportDraftStorage";
import { consumeAutoGenerateFlag } from "@/lib/ui/reports/autoGenerateFlag";
import { resolveReportActionFailureMessage } from "@/lib/ui/reports/resolveReportActionFailureMessage";
import { getMetricSeverity, type ColoredMetricKey } from "@/lib/ui/reports/getMetricSeverity";
import {
  emphasizeFirstVendorMentions,
  splitNarrativeParagraphs,
} from "@/lib/ui/reports/splitNarrativeParagraphs";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import StatusBadge from "@/components/ui/StatusBadge";
import { nextGenerationProgress } from "@/lib/ui/reports/generationProgress";

const Lottie = dynamic(() => import("lottie-react").then((mod) => ({ default: mod.Lottie })), {
  ssr: false,
});

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

function MetricValue({ value, className }: { value: number | null; className?: string }) {
  if (value === null) {
    return (
      <span title="No eligible transactions" aria-label="No eligible transactions">
        <span aria-hidden="true" className="text-foreground-subtle">
          —
        </span>
      </span>
    );
  }

  return (
    <span className={`tabular-nums ${className ?? "text-foreground"}`}>
      {String(value)}
    </span>
  );
}

const SEVERITY_CLASSES: Record<ReturnType<typeof getMetricSeverity>, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-foreground-muted",
};

function metricClass(metric: ColoredMetricKey, value: number | null): string {
  return SEVERITY_CLASSES[getMetricSeverity(metric, value)];
}

function metricRowClasses(striped: boolean): { row: string; sticky: string } {
  if (striped) {
    return {
      row: "bg-surface-muted hover:bg-[color-mix(in_oklch,var(--color-surface-muted)_72%,var(--color-border))]",
      sticky:
        "bg-surface-muted group-hover:bg-[color-mix(in_oklch,var(--color-surface-muted)_72%,var(--color-border))]",
    };
  }

  return {
    row: "bg-surface hover:bg-[color-mix(in_oklch,var(--color-surface)_55%,var(--color-surface-muted))]",
    sticky:
      "bg-surface group-hover:bg-[color-mix(in_oklch,var(--color-surface)_55%,var(--color-surface-muted))]",
  };
}

function periodDate(value: string): string {
  return String(value).slice(0, 10);
}

function sectionsHaveText(sections: ReportSectionInput): boolean {
  return SECTIONS.some((section) => sections[section.key].trim() !== "");
}

function NarrativeParagraph({
  text,
  vendorNames,
}: {
  text: string;
  vendorNames: string[];
}) {
  const segments = emphasizeFirstVendorMentions(text, vendorNames);
  return (
    <p className="max-w-prose whitespace-pre-wrap text-base leading-relaxed text-foreground">
      {segments.map((segment, index) =>
        segment.emphasize ? <strong key={index}>{segment.text}</strong> : segment.text
      )}
    </p>
  );
}

const GENERATING_PHRASES = [
  "Gathering vendor data...",
  "Analyzing performance metrics...",
  "Writing your report...",
  "Finishing up...",
];

function GeneratingMark() {
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  if (reduced === null) {
    return <div className="size-48 shrink-0" aria-hidden="true" />;
  }

  return (
    <Lottie
      key={reduced ? "still" : "play"}
      src="/animations/loading__blob.json"
      autoplay={!reduced}
      loop={!reduced}
      className="size-48 shrink-0"
      style={{ width: 192, height: 192 }}
      aria-hidden="true"
    />
  );
}

function GeneratingPhrases() {
  const [index, setIndex] = useState(0);
  const lastIndex = GENERATING_PHRASES.length - 1;

  useEffect(() => {
    if (index >= lastIndex) return;
    const timer = window.setTimeout(() => setIndex((current) => current + 1), 4000);
    return () => window.clearTimeout(timer);
  }, [index, lastIndex]);

  return (
    <div className="relative h-6 w-full">
      {GENERATING_PHRASES.map((phrase, phraseIndex) => {
        const active = phraseIndex === index;
        return (
          <p
            key={phrase}
            aria-hidden={active ? undefined : true}
            className={`generate-phrase absolute inset-x-0 text-center text-base text-foreground ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            {phrase}
          </p>
        );
      })}
      <p className="sr-only" role="status" aria-live="polite">
        {GENERATING_PHRASES[index]}
      </p>
    </div>
  );
}

function EasedProgress({ complete }: { complete: boolean }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (complete) {
      fill.style.width = "100%";
      return;
    }
    if (reduced) {
      fill.style.width = "55%";
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      if (startedAt.current === null) startedAt.current = now;
      const elapsed = (now - startedAt.current) / 1000;
      fill.style.width = `${nextGenerationProgress(elapsed) * 100}%`;
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [complete]);

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-border" aria-hidden="true">
      <div
        ref={fillRef}
        className="h-full w-0 rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
      />
    </div>
  );
}

export default function ReportEditor({
  id,
  startInEdit = false,
}: {
  id: number;
  startInEdit?: boolean;
}) {
  const { instance } = useMsal();
  const router = useRouter();
  const getAccessToken = useAccessToken();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [sections, setSections] = useState<ReportSectionInput>(emptySections());
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState<
    "saving" | "generating" | "finalizing" | "exporting" | "deleting" | null
  >(null);
  const [generationSettling, setGenerationSettling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<"load" | "generate" | "other" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBaseline, setEditBaseline] = useState<ReportSectionInput | null>(null);
  const [confirmingFinalize, setConfirmingFinalize] = useState(false);
  const [confirmingGenerate, setConfirmingGenerate] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [vendorNames, setVendorNames] = useState<Map<number, string>>(new Map());
  const appliedEditFlag = useRef(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  function clearReportError() {
    setErrorKind(null);
    setErrorMessage(null);
  }

  function showReportError(kind: "load" | "generate" | "other", message: string) {
    setErrorKind(kind);
    setErrorMessage(message);
  }

  // load() is also called directly from the "Retry" button below (a click
  // handler, not an effect — setState there is fine), so it stays a
  // standalone async function rather than moving entirely inline.
  const load = useCallback(async () => {
    const accessToken = await getAccessToken();
    // Independent requests, fired together. Vendor names are non-critical
    // (falls back to an empty map on failure); the report itself is not,
    // so only its rejection should reach the outer .catch below.
    const [loaded, vendors] = await Promise.all([
      fetchReport(id, accessToken),
      fetchAllVendors(accessToken).catch(() => null),
    ]);
    const stashed = restoreDraftFields(id, window.sessionStorage);
    setReport(loaded);
    setSections(stashed ?? sectionsFromReport(loaded));
    setRestored(stashed !== null);
    setVendorNames(
      vendors ? new Map(vendors.map((vendor) => [vendor.id, vendor.name])) : new Map()
    );
  }, [getAccessToken, id]);

  useEffect(() => {
    // Inline IIFE, not a call to the `load` callback above — calling a
    // separately-referenced async function from an effect trips
    // react-hooks/set-state-in-effect regardless of where that function
    // puts its own await; an inline function defined *in* the effect,
    // with setState only after its own first await, is what the rule
    // actually accepts.
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (error) {
        if (cancelled) return;
        showReportError(
          "load",
          error instanceof Error ? error.message : "Failed to load report"
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const isDraft = report?.status === "Draft";
  const locked = !isDraft || busy !== null;
  const hasAutoGeneratedRef = useRef(false);

  async function handleSave() {
    if (!isDraft || busy) return;
    setBusy("saving");
    clearReportError();
    try {
      const accessToken = await getAccessToken();
      const result = await updateReportSections(id, sections, accessToken);
      if (result.outcome === "error") {
        if (result.code === "UNAUTHORIZED") {
          saveDraftFields(id, sections, window.sessionStorage);
          await instance.loginRedirect({ scopes: [API_SCOPE] });
          return;
        }
        showReportError("other", resolveReportActionFailureMessage(result.code));
        return;
      }
      clearDraftFields(id, window.sessionStorage);
      setRestored(false);
      const refreshed = await fetchReport(id, accessToken);
      setReport(refreshed);
      setSections(sectionsFromReport(refreshed));
      setIsEditing(false);
    } catch (error) {
      showReportError("other", error instanceof Error ? error.message : "Failed to save report");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerate() {
    if (!isDraft || busy) return;
    setConfirmingGenerate(false);
    setBusy("generating");
    clearReportError();
    let succeeded = false;
    try {
      const accessToken = await getAccessToken();
      const result = await generateReport(id, accessToken);
      if (result.outcome === "error") {
        showReportError("generate", resolveReportActionFailureMessage(result.code));
        return;
      }
      clearDraftFields(id, window.sessionStorage);
      setRestored(false);
      const refreshed = await fetchReport(id, accessToken);
      setReport(refreshed);
      setSections(sectionsFromReport(refreshed));
      setIsEditing(false);
      succeeded = true;
    } catch (error) {
      showReportError(
        "generate",
        error instanceof Error ? error.message : "Failed to generate report"
      );
    } finally {
      if (succeeded) {
        setGenerationSettling(true);
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        setGenerationSettling(false);
      }
      setBusy(null);
    }
  }

  // Auto-trigger the first generation attempt when arriving fresh from
  // Create Report. This calls handleGenerate() directly, so that first run
  // does not ask for confirmation. A later click on Generate confirms when
  // any section already has text. The guard runs synchronously (no setState
  // in it); only the actual trigger is deferred behind a microtask so it's
  // not the synchronous top-level statement of the effect.
  useEffect(() => {
    if (!report || hasAutoGeneratedRef.current) return;
    const shouldAutoGenerate = consumeAutoGenerateFlag(report.id, window.sessionStorage);
    if (!shouldAutoGenerate) return;
    hasAutoGeneratedRef.current = true;
    void Promise.resolve().then(() => handleGenerate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report]);

  useEffect(() => {
    if (!report || appliedEditFlag.current) return;
    appliedEditFlag.current = true;
    if (startInEdit && report.status === "Draft") {
      void Promise.resolve().then(() => {
        setEditBaseline(sections);
        setIsEditing(true);
      });
    }
  }, [report, sections, startInEdit]);

  const confirmOpen = confirmingFinalize || confirmingGenerate || confirmingDelete;

  useEffect(() => {
    if (!confirmOpen || busy !== null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirmingFinalize(false);
        setConfirmingGenerate(false);
        setConfirmingDelete(false);
      }
    }
    window.addEventListener("keydown", onKey);
    confirmRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, busy]);

  function requestGenerate() {
    if (sectionsHaveText(sections)) {
      setConfirmingFinalize(false);
      setConfirmingDelete(false);
      setConfirmingGenerate(true);
      return;
    }
    handleGenerate();
  }

  function beginEdit() {
    setConfirmingFinalize(false);
    setConfirmingGenerate(false);
    setConfirmingDelete(false);
    setEditBaseline(sections);
    setIsEditing(true);
  }

  async function handleDelete() {
    if (!isDraft || busy) return;
    setBusy("deleting");
    clearReportError();
    try {
      const accessToken = await getAccessToken();
      const result = await deleteReport(id, accessToken);
      if (result.outcome === "error") {
        setConfirmingDelete(false);
        showReportError("other", resolveReportActionFailureMessage(result.code));
        return;
      }
      router.push("/reports");
    } catch (error) {
      setConfirmingDelete(false);
      showReportError(
        "other",
        error instanceof Error ? error.message : "Failed to delete report"
      );
    } finally {
      setBusy(null);
    }
  }

  function cancelEdit() {
    if (editBaseline) {
      setSections(editBaseline);
    }
    setIsEditing(false);
  }

  async function handleFinalize() {
    if (!isDraft || busy) return;
    setBusy("finalizing");
    clearReportError();
    try {
      const accessToken = await getAccessToken();
      const result = await finalizeReport(id, accessToken);
      if (result.outcome === "error") {
        showReportError("other", resolveReportActionFailureMessage(result.code));
        return;
      }
      clearDraftFields(id, window.sessionStorage);
      setConfirmingFinalize(false);
      const refreshed = await fetchReport(id, accessToken);
      setReport(refreshed);
      setSections(sectionsFromReport(refreshed));
    } catch (error) {
      showReportError("other", error instanceof Error ? error.message : "Failed to finalize report");
    } finally {
      setBusy(null);
    }
  }

  async function handleExport(format: "pdf" | "docx") {
    if (report?.status !== "Finalized" || busy) return;
    setBusy("exporting");
    clearReportError();
    try {
      const accessToken = await getAccessToken();
      const result = await exportReport(id, format, accessToken);
      if (result.outcome === "error") {
        showReportError("other", resolveReportActionFailureMessage(result.code));
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showReportError("other", error instanceof Error ? error.message : "Failed to export report");
    } finally {
      setBusy(null);
    }
  }

  if (!report && !errorMessage) {
    return <LoadingIndicator label="Loading report…" />;
  }

  if (!report) {
    return (
      <ErrorBanner
        message={errorMessage ?? "Failed to load report"}
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              clearReportError();
              load().catch((error) => {
                showReportError(
                  "load",
                  error instanceof Error ? error.message : "Failed to load report"
                );
              });
            }}
          >
            Retry
          </Button>
        }
      />
    );
  }

  const readyToFinalize = validateReportReadyToFinalize(sections).valid;
  const periodStart = periodDate(report.period_start);
  const periodEnd = periodDate(report.period_end);
  const reportVendorNames = report.vendor_ids
    .map((vendorId) => vendorNames.get(vendorId))
    .filter((name): name is string => Boolean(name));

  return (
    <div
      className={
        busy === "generating"
          ? "flex w-full max-w-3xl flex-col gap-8"
          : "grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)] lg:gap-x-10"
      }
    >
      <div className="w-full min-w-0 lg:col-start-1 lg:row-start-1">
        <Link
          href="/reports"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-150 ease-out hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Back to reports
        </Link>
        <header className="mt-4 w-full min-w-0 border-b border-border bg-surface-muted px-5 py-5">
          <h1 className="font-display text-4xl font-medium text-foreground">
            {report.reference_number}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-snug text-foreground-muted">
            <span>
              {report.period_type} · {periodStart} to {periodEnd}
            </span>
            <StatusBadge status={report.status} />
          </p>
        </header>
      </div>

      {restored && (
        <p className="text-sm text-foreground-muted">
          Restored unsaved section text from this browser session.
        </p>
      )}
      {errorMessage && busy !== "generating" && (
        <ErrorBanner
          message={errorMessage}
          action={
            errorKind === "generate" ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy !== null}
                onClick={handleGenerate}
              >
                Retry
              </Button>
            ) : undefined
          }
        />
      )}

      {busy === "generating" ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded border border-border bg-surface px-6 py-8">
          <GeneratingMark />
          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <GeneratingPhrases />
            <EasedProgress complete={generationSettling} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-col lg:col-start-1 lg:row-start-2">
            {isDraft && !isEditing && (
              <div className="mb-8 flex flex-col items-start gap-3">
                {!confirmingDelete && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy !== null}
                      onClick={beginEdit}
                      icon={<Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={busy !== null}
                      onClick={() => {
                        setConfirmingFinalize(false);
                        setConfirmingGenerate(false);
                        setConfirmingDelete(true);
                      }}
                      icon={<Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
                    >
                      Delete
                    </Button>
                  </div>
                )}
                {confirmingDelete && (
                  <div
                    ref={confirmRef}
                    tabIndex={-1}
                    role="region"
                    aria-label="Confirm delete"
                    className="flex max-w-prose flex-col gap-3 rounded border border-border bg-surface px-4 py-4 outline-none"
                  >
                    <p className="text-sm leading-relaxed text-foreground">
                      Delete this report? This can&apos;t be undone.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="danger"
                        disabled={busy !== null}
                        isLoading={busy === "deleting"}
                        onClick={handleDelete}
                      >
                        {busy === "deleting" ? "Deleting…" : "Yes, delete"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy !== null}
                        onClick={() => setConfirmingDelete(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {SECTIONS.map((section, index) => {
              const paragraphs = splitNarrativeParagraphs(sections[section.key]);
              return (
                <section
                  key={section.key}
                  className={
                    index === 0
                      ? "flex flex-col gap-4"
                      : "mt-10 flex flex-col gap-4 border-t border-border pt-10"
                  }
                >
                  <h2 className="font-display text-2xl font-medium text-foreground">
                    {section.label}
                  </h2>
                  {isEditing ? (
                    <textarea
                      value={sections[section.key]}
                      disabled={locked}
                      rows={8}
                      aria-label={section.label}
                      onChange={(event) =>
                        setSections((current) => ({
                          ...current,
                          [section.key]: event.target.value,
                        }))
                      }
                      className="max-w-prose rounded border border-border bg-surface px-3 py-2 text-base leading-relaxed text-foreground disabled:opacity-60"
                    />
                  ) : paragraphs.length === 0 ? (
                    <p className="max-w-prose text-base leading-relaxed text-foreground-muted">
                      Not written yet.
                    </p>
                  ) : (
                    <div className="flex max-w-prose flex-col gap-5">
                      {paragraphs.map((paragraph, paragraphIndex) => (
                        <NarrativeParagraph
                          key={paragraphIndex}
                          text={paragraph}
                          vendorNames={reportVendorNames}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

            {isEditing && (
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy !== null}
                  isLoading={busy === "saving"}
                  onClick={handleSave}
                  icon={<Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
                >
                  {busy === "saving" ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <section className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:max-h-[calc(100dvh-6.5rem)] lg:self-start lg:overflow-y-auto">
            <h2 className="font-display text-2xl font-medium text-foreground">Metrics</h2>
            {(report.metrics ?? []).length === 0 ? (
              <p className="text-sm text-foreground-muted">
                No metrics yet. Generate writes the four sections from these figures.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded border border-info/30 bg-info-soft px-4 py-3">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
                  <p id="metrics-legend" className="text-sm leading-relaxed text-foreground">
                    Computed from recorded transactions. A dash means that metric had no eligible
                    transactions.
                  </p>
                </div>
                <div className="overflow-x-auto min-w-0 w-full rounded border border-border bg-surface">
                <table aria-describedby="metrics-legend" className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted text-left">
                      <th
                        scope="col"
                        rowSpan={2}
                        className="sticky left-0 z-20 border-r border-border bg-surface-muted px-5 py-3 align-bottom text-xs font-medium text-foreground"
                      >
                        Vendor
                      </th>
                      <th
                        scope="col"
                        rowSpan={2}
                        className="px-5 py-3 align-bottom text-xs font-medium text-foreground"
                      >
                        Period
                      </th>
                      <th
                        scope="colgroup"
                        colSpan={2}
                        className="border-l border-border px-5 py-2 text-center text-xs font-medium uppercase tracking-wide text-foreground-muted"
                      >
                        Delivery
                      </th>
                      <th
                        scope="colgroup"
                        colSpan={3}
                        className="border-l border-border px-5 py-2 text-center text-xs font-medium uppercase tracking-wide text-foreground-muted"
                      >
                        Pricing
                      </th>
                      <th
                        scope="colgroup"
                        colSpan={4}
                        className="border-l border-border px-5 py-2 text-center text-xs font-medium uppercase tracking-wide text-foreground-muted"
                      >
                        Order accuracy
                      </th>
                      <th
                        scope="col"
                        rowSpan={2}
                        className="border-l border-border px-5 py-3 text-right align-bottom text-xs font-medium text-foreground"
                      >
                        Txns
                      </th>
                    </tr>
                    <tr className="border-b border-border bg-surface text-left">
                      <th scope="col" className="whitespace-nowrap border-l border-border px-5 py-2 text-xs font-normal text-foreground-muted">
                        On time %
                      </th>
                      <th scope="col" className="whitespace-nowrap px-5 py-2 text-xs font-normal text-foreground-muted">
                        Avg delay (days)
                      </th>
                      <th scope="col" className="whitespace-nowrap border-l border-border px-5 py-2 text-xs font-normal text-foreground-muted">
                        Overcharge %
                      </th>
                      <th scope="col" className="whitespace-nowrap px-5 py-2 text-xs font-normal text-foreground-muted">
                        Avg overcharge %
                      </th>
                      <th scope="col" className="whitespace-nowrap px-5 py-2 text-xs font-normal text-foreground-muted">
                        Undercharge %
                      </th>
                      <th scope="col" className="whitespace-nowrap border-l border-border px-5 py-2 text-xs font-normal text-foreground-muted">
                        Shortfall %
                      </th>
                      <th scope="col" className="whitespace-nowrap px-5 py-2 text-xs font-normal text-foreground-muted">
                        Avg shortfall (units)
                      </th>
                      <th scope="col" className="whitespace-nowrap px-5 py-2 text-xs font-normal text-foreground-muted">
                        Over-delivery %
                      </th>
                      <th scope="col" className="whitespace-nowrap px-5 py-2 text-xs font-normal text-foreground-muted">
                        Avg over-delivery (units)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.metrics ?? []).map((metric: ReportMetric, index) => {
                      const row = metricRowClasses(index % 2 === 1);
                      return (
                      <tr
                        key={`${metric.vendor_id}-${metric.period_start}`}
                        className={`group border-b border-border last:border-b-0 ${row.row}`}
                      >
                        <td
                          className={`sticky left-0 z-10 max-w-[16rem] break-words border-r border-border px-5 py-4 font-semibold text-foreground ${row.sticky}`}
                        >
                          {vendorNames.get(metric.vendor_id) ?? "Unknown vendor"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 tabular-nums text-foreground-muted">
                          {periodDate(metric.period_start)} to {periodDate(metric.period_end)}
                        </td>
                        <td className="whitespace-nowrap border-l border-border px-5 py-4">
                          <MetricValue
                            value={metric.on_time_delivery_rate}
                            className={metricClass("on_time_delivery_rate", metric.on_time_delivery_rate)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <MetricValue
                            value={metric.avg_delay_days}
                            className={metricClass("avg_delay_days", metric.avg_delay_days)}
                          />
                        </td>
                        <td className="whitespace-nowrap border-l border-border px-5 py-4">
                          <MetricValue
                            value={metric.overcharge_rate}
                            className={metricClass("overcharge_rate", metric.overcharge_rate)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <MetricValue
                            value={metric.avg_overcharge_pct}
                            className={metricClass("avg_overcharge_pct", metric.avg_overcharge_pct)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <MetricValue value={metric.undercharge_rate} className="text-foreground-muted" />
                        </td>
                        <td className="whitespace-nowrap border-l border-border px-5 py-4">
                          <MetricValue
                            value={metric.shortfall_rate}
                            className={metricClass("shortfall_rate", metric.shortfall_rate)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <MetricValue
                            value={metric.avg_shortfall_units}
                            className={metricClass("avg_shortfall_units", metric.avg_shortfall_units)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <MetricValue
                            value={metric.overdelivery_rate}
                            className={metricClass("overdelivery_rate", metric.overdelivery_rate)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <MetricValue
                            value={metric.avg_overdelivery_units}
                            className={metricClass("avg_overdelivery_units", metric.avg_overdelivery_units)}
                          />
                        </td>
                        <td className="whitespace-nowrap border-l border-border px-5 py-4 text-right tabular-nums text-foreground">
                          {metric.transaction_count}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </section>

          {(isDraft && !isEditing) || report.status === "Finalized" ? (
          <div className="flex min-w-0 flex-col items-start gap-8 lg:col-start-1 lg:row-start-3">
          {isDraft && !isEditing && (
            <div className="flex flex-col items-start gap-3">
              {!confirmingGenerate && !confirmingFinalize && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={readyToFinalize ? "secondary" : "primary"}
                    disabled={busy !== null}
                    onClick={requestGenerate}
                  >
                    Generate
                  </Button>
                  {readyToFinalize && (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={busy !== null}
                      onClick={() => {
                        setConfirmingGenerate(false);
                        setConfirmingDelete(false);
                        setConfirmingFinalize(true);
                      }}
                    >
                      Finalize
                    </Button>
                  )}
                </div>
              )}

              {confirmingGenerate && (
                <div
                  ref={confirmRef}
                  tabIndex={-1}
                  role="region"
                  aria-label="Confirm generate"
                  className="flex max-w-[65ch] flex-col gap-3 rounded border border-border bg-surface px-4 py-4 outline-none"
                >
                  <p className="text-sm leading-relaxed text-foreground">
                    Generate again for {report.reference_number}? This replaces Vendor Summary,
                    Delivery Performance, Pricing Analysis, and Order Accuracy.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={busy !== null}
                      onClick={handleGenerate}
                    >
                      Generate
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy !== null}
                      onClick={() => setConfirmingGenerate(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {confirmingFinalize && (
                <div
                  ref={confirmRef}
                  tabIndex={-1}
                  role="region"
                  aria-label="Confirm finalize"
                  className="flex max-w-[65ch] flex-col gap-3 rounded border border-border bg-surface px-4 py-4 outline-none"
                >
                  <p className="text-sm leading-relaxed text-foreground">
                    Finalize {report.reference_number}? This report covers {periodStart} to{" "}
                    {periodEnd}. After you finalize, it cannot be edited or deleted.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={busy !== null}
                      isLoading={busy === "finalizing"}
                      onClick={handleFinalize}
                    >
                      {busy === "finalizing" ? "Finalizing…" : "Finalize report"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy !== null}
                      onClick={() => setConfirmingFinalize(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!readyToFinalize && !confirmingGenerate && !confirmingFinalize && (
                <p className="max-w-[65ch] text-sm leading-relaxed text-foreground-muted">
                  Write all four sections before finalizing. You can export PDF or Word after the report is finalized.
                </p>
              )}
              {readyToFinalize && !confirmingFinalize && !confirmingGenerate && (
                <p className="max-w-[65ch] text-sm leading-relaxed text-foreground-muted">
                  Export PDF and Word after this report is finalized.
                </p>
              )}
            </div>
          )}

          {report.status === "Finalized" && (
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={busy !== null}
                isLoading={busy === "exporting"}
                onClick={() => handleExport("pdf")}
                icon={<Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              >
                Export PDF
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy !== null}
                isLoading={busy === "exporting"}
                onClick={() => handleExport("docx")}
                icon={<Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              >
                Export Word
              </Button>
            </div>
          )}
          </div>
          ) : null}
        </>
      )}
    </div>
  );
}
