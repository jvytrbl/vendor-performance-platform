import AddReportForm from "@/components/reports/AddReportForm";

export default function AddReportPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Create Report
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Select a vendor and period to create a new report.
        </p>
      </div>

      <AddReportForm />
    </div>
  );
}
