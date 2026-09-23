"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { CheckCircle2, TriangleAlert, Upload } from "lucide-react";
import {
  uploadTransactionsFile,
  type BulkUploadRowError,
} from "@/lib/api/transactions";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import ProgressBar from "@/components/ui/ProgressBar";

interface UploadSummary {
  inserted: number;
  failed: number;
  errors: BulkUploadRowError[];
}

export default function BulkUploadForm() {
  const getAccessToken = useAccessToken();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setSummary(null);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!file) {
      setErrorMessage("Please choose a file to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSummary(null);

    try {
      const accessToken = await getAccessToken();
      const result = await uploadTransactionsFile(file, accessToken);

      if (result.outcome === "processed") {
        setSummary({
          inserted: result.inserted,
          failed: result.failed,
          errors: result.errors,
        });
        return;
      }

      setErrorMessage(result.error);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="file" className="text-sm font-medium text-foreground-muted">
            CSV or Excel file
          </label>
          <input
            id="file"
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-accent-soft/40 file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent"
          />
          <p className="text-xs text-foreground-muted">
            Required columns: vendor_name, transaction_date, item_description, agreed_price,
            agreed_delivery_date, quantity_ordered.
          </p>
        </div>

        {errorMessage && <ErrorBanner message={errorMessage} />}

        {isUploading && <ProgressBar label="Processing the file…" />}

        <Button
          type="submit"
          variant="primary"
          disabled={isUploading}
          icon={<Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
          className="self-start"
        >
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </form>

      {summary && (
        <div className="flex flex-col gap-4 border-t border-border pt-6">
          <div className="flex gap-6 text-sm">
            <p className="flex items-center gap-1.5 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" strokeWidth={1.75} aria-hidden="true" />
              <span className="font-semibold text-accent">{summary.inserted}</span> inserted
            </p>
            <p className="flex items-center gap-1.5 text-foreground">
              <TriangleAlert className="h-4 w-4 text-danger" strokeWidth={1.75} aria-hidden="true" />
              <span className="font-semibold text-danger">{summary.failed}</span> failed
            </p>
          </div>

          {summary.errors.length > 0 && (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left">
                  <th className="px-4 py-2 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
                    Row
                  </th>
                  <th className="px-4 py-2 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
                    Field
                  </th>
                  <th className="px-4 py-2 text-xs font-normal uppercase tracking-wide text-foreground-subtle">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.errors.map((rowError, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="px-4 py-2 text-sm text-foreground-muted">{rowError.row}</td>
                    <td className="px-4 py-2 text-sm text-foreground-muted">{rowError.field}</td>
                    <td className="px-4 py-2"><ErrorBanner message={rowError.error} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
