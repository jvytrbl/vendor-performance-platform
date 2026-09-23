import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VendorDetail from "@/components/vendors/VendorDetail";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-4xl font-medium text-foreground">
          Vendor details
        </h1>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-150 ease-out hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Back to vendors
        </Link>
      </div>
      <VendorDetail id={Number(id)} />
    </div>
  );
}
