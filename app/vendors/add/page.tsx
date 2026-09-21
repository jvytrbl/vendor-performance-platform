//add vendor form (route: /vendors/add)
import Link from "next/link";
import AddVendorForm from "@/components/vendors/AddVendorForm";

export default function AddVendorPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Add vendor</h1>
        <Link href="/vendors" className="text-sm font-medium text-indigo-600 hover:underline">
          Back to vendors
        </Link>
      </div>
      <AddVendorForm />
    </main>
  );
}