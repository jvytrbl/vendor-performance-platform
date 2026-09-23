import Link from "next/link";
import BulkUploadForm from "@/components/transactions/BulkUploadForm";

export default function BulkUploadPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-4xl font-medium text-foreground">
          Bulk upload transactions
        </h1>
        <Link
          href="/transactions"
          className="text-sm font-medium text-accent hover:underline"
        >
          Back to transactions
        </Link>
      </div>
      <BulkUploadForm />
    </div>
  );
}
