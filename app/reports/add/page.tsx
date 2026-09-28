import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddReportForm from "@/components/reports/AddReportForm";

export default function AddReportPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-medium text-foreground">
            Create Report
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Choose a quarter or a custom period, then select one or more vendors.
          </p>
        </div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-150 ease-out hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Back to reports
        </Link>
      </div>

      <AddReportForm />
    </div>
  );
}
