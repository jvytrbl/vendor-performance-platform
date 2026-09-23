import AddReportForm from "@/components/reports/AddReportForm";

export default function AddReportPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-4xl font-medium text-foreground">
          Create Report
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Choose a quarter or a custom period, then select one or more vendors.
        </p>
      </div>

      <AddReportForm />
    </div>
  );
}
