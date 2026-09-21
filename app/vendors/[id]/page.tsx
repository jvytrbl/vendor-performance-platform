import Link from "next/link";
import VendorDetail from "@/components/vendors/VendorDetail";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <Link
          href="/vendors"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to vendors
        </Link>
      </div>
      <VendorDetail id={Number(id)} />
    </main>
  );
}