"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Users } from "lucide-react";
import type { VendorRecord } from "@/lib/api/vendors";
import { fetchAllVendors } from "@/lib/api/vendors";
import type { ReportInput } from "@/lib/domain/reports/validateReportInput";
import { createReport } from "@/lib/api/reports";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { resolveReportActionFailureMessage } from "@/lib/ui/reports/resolveReportActionFailureMessage";
import { markAutoGenerate } from "@/lib/ui/reports/autoGenerateFlag";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

type Status = "loading" | "ready" | "submitting";

interface FormData {
  periodType: "Quarterly" | "Custom";
  quarterYear?: string;
  quarterNumber?: string;
  customStartDate?: string;
  customEndDate?: string;
  selectedVendorIds: Set<number>;
}

function getQuarterDates(year: number, quarter: number): [string, string] {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  const startDate = `${year}-${String(startMonth + 1).padStart(2, "0")}-01`;
  const endDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    endDaysInMonth[1] = 29;
  }
  const endDate = `${year}-${String(endMonth + 1).padStart(2, "0")}-${String(
    endDaysInMonth[endMonth]
  ).padStart(2, "0")}`;
  return [startDate, endDate];
}

export default function AddReportForm() {
  const router = useRouter();
  const getAccessToken = useAccessToken();
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    periodType: "Quarterly",
    selectedVendorIds: new Set(),
  });

  const loadVendors = useCallback(async () => {
    try {
      setStatus("loading");
      const accessToken = await getAccessToken();
      const result = await fetchAllVendors(accessToken);
      setVendors(result);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load vendors"
      );
      setStatus("ready");
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handlePeriodTypeChange = (newType: "Quarterly" | "Custom") => {
    setFormData((prev) => ({
      ...prev,
      periodType: newType,
      quarterYear: undefined,
      quarterNumber: undefined,
      customStartDate: undefined,
      customEndDate: undefined,
    }));
    setFieldError(null);
  };

  const handleVendorToggle = (vendorId: number, checked: boolean) => {
    setFormData((prev) => {
      const newSet = new Set(prev.selectedVendorIds);
      if (checked) {
        newSet.add(vendorId);
      } else {
        newSet.delete(vendorId);
      }
      return { ...prev, selectedVendorIds: newSet };
    });
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldError(null);

    if (formData.selectedVendorIds.size === 0) {
      setErrorMessage("Please select at least one vendor.");
      return;
    }

    setStatus("submitting");

    try {
      const accessToken = await getAccessToken();

      let period_start: string;
      let period_end: string;

      if (formData.periodType === "Quarterly") {
        if (!formData.quarterYear || !formData.quarterNumber) {
          setErrorMessage("Please select a quarter and year.");
          setStatus("ready");
          return;
        }
        const [start, end] = getQuarterDates(
          parseInt(formData.quarterYear),
          parseInt(formData.quarterNumber)
        );
        period_start = start;
        period_end = end;
      } else {
        if (!formData.customStartDate || !formData.customEndDate) {
          setErrorMessage("Please provide start and end dates.");
          setStatus("ready");
          return;
        }
        period_start = formData.customStartDate;
        period_end = formData.customEndDate;
      }

      const input: ReportInput = {
        period_type: formData.periodType,
        period_start,
        period_end,
        vendor_ids: Array.from(formData.selectedVendorIds),
      };

      const result = await createReport(input, accessToken);

      if (result.outcome === "created") {
        // Deliberate deviation from SDD §5.3's original journey (Create →
        // separately click Generate later): user testing found landing on a
        // blank Report Editor with no explanation felt broken, not
        // intentional. We keep the two backend actions fully separate
        // (POST /api/reports, then POST /api/reports/:id/generate — see
        // ReportEditor.tsx's auto-generate effect for the actual trigger)
        // but chain them in the frontend so the user experiences one
        // continuous action. The report row already exists in the database
        // at this point regardless of what happens next, so the existing
        // "always resumable from the Report List" safety property holds.
        markAutoGenerate(result.report.id, window.sessionStorage);
        router.push(`/reports/${result.report.id}`);
      } else {
        if (result.field) {
          setFieldError({
            field: result.field,
            message: result.error,
          });
        } else {
          setErrorMessage(resolveReportActionFailureMessage(result.code));
        }
        setStatus("ready");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create report"
      );
      setStatus("ready");
    }
  };

  if (status === "loading") {
    return <LoadingIndicator label="Loading vendors…" />;
  }

  const currentYear = new Date().getFullYear();

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-12">
      {errorMessage && <ErrorBanner message={errorMessage} />}

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Period</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="periodType" className="text-sm font-medium text-foreground">
            Period Type
          </label>
          <select
            id="periodType"
            value={formData.periodType}
            onChange={(e) =>
              handlePeriodTypeChange(e.target.value as "Quarterly" | "Custom")
            }
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="Quarterly">Quarterly</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

      {formData.periodType === "Quarterly" && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="quarterYear" className="text-sm font-medium text-foreground">
              Year
            </label>
            <select
              id="quarterYear"
              value={formData.quarterYear || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quarterYear: e.target.value }))
              }
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select year</option>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="quarterNumber" className="text-sm font-medium text-foreground">
              Quarter
            </label>
            <select
              id="quarterNumber"
              value={formData.quarterNumber || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quarterNumber: e.target.value }))
              }
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select quarter</option>
              <option value="1">Q1 (Jan - Mar)</option>
              <option value="2">Q2 (Apr - Jun)</option>
              <option value="3">Q3 (Jul - Sep)</option>
              <option value="4">Q4 (Oct - Dec)</option>
            </select>
          </div>
        </>
      )}

      {formData.periodType === "Custom" && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="customStartDate" className="text-sm font-medium text-foreground">
              Start Date
            </label>
            <input
              id="customStartDate"
              type="date"
              value={formData.customStartDate || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customStartDate: e.target.value }))
              }
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            {fieldError?.field === "period_start" && (
              <ErrorBanner message={fieldError.message} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="customEndDate" className="text-sm font-medium text-foreground">
              End Date
            </label>
            <input
              id="customEndDate"
              type="date"
              value={formData.customEndDate || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customEndDate: e.target.value }))
              }
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            {fieldError?.field === "period_end" && (
              <ErrorBanner message={fieldError.message} />
            )}
          </div>
        </>
      )}

      </section>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-1.5 text-lg font-semibold tracking-tight text-foreground">
          <Users className="h-4 w-4 text-foreground-subtle" strokeWidth={1.75} aria-hidden="true" />
          Vendors
        </h2>
        <div className="flex flex-col gap-2">
          {vendors.length === 0 && !errorMessage ? (
            <div className="flex flex-col items-start gap-2">
              <p className="max-w-[65ch] text-sm leading-relaxed text-foreground-muted">
                No vendors yet. A report needs at least one vendor.
              </p>
              <Link href="/vendors/add" className="text-sm font-medium text-accent hover:underline">
                Add a vendor
              </Link>
            </div>
          ) : vendors.length === 0 ? null : (
            vendors.map((vendor) => (
              <label
                key={vendor.id}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"
              >
                <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedVendorIds.has(vendor.id)}
                    onChange={(e) => handleVendorToggle(vendor.id, e.target.checked)}
                    className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded border border-border bg-surface transition-colors duration-150 ease-out checked:border-accent checked:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  />
                  <Check
                    className="pointer-events-none h-3 w-3 text-accent-foreground opacity-0 peer-checked:opacity-100"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                </span>
                {vendor.name}
              </label>
            ))
          )}
        </div>
      </section>

      <Button
        type="submit"
        variant="primary"
        disabled={vendors.length === 0}
        isLoading={status === "submitting"}
        icon={<Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        className="self-start"
      >
        {status === "submitting" ? "Creating…" : "Create Report"}
      </Button>
    </form>
  );
}
