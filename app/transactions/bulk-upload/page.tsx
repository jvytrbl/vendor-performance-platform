import Link from "next/link";
import BulkUploadForm from "@/components/transactions/BulkUploadForm";

export default function BulkUploadPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
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
