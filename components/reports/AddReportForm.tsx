"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { VendorRecord } from "@/lib/api/vendors";
import { fetchVendors } from "@/lib/api/vendors";
import type { ReportInput } from "@/lib/domain/reports/validateReportInput";
import { createReport } from "@/lib/api/reports";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { resolveReportActionFailureMessage } from "@/lib/ui/reports/resolveReportActionFailureMessage";

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
      const result = await fetchVendors(accessToken);
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
    return <p className="text-sm text-foreground-muted">Loading vendors…</p>;
  }

  const currentYear = new Date().getFullYear();

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-8">
      {errorMessage && (
        <p className="text-sm text-danger">{errorMessage}</p>
      )}

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
              <p className="text-xs text-danger">{fieldError.message}</p>
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
              <p className="text-xs text-danger">{fieldError.message}</p>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Vendors</p>
        <div className="flex flex-col gap-2">
          {vendors.length === 0 ? (
            <p className="text-sm text-foreground-muted">No vendors available.</p>
          ) : (
            vendors.map((vendor) => (
              <label
                key={vendor.id}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={formData.selectedVendorIds.has(vendor.id)}
                  onChange={(e) => handleVendorToggle(vendor.id, e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                {vendor.name}
              </label>
            ))
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Creating…" : "Create Report"}
      </button>
    </form>
  );
}
