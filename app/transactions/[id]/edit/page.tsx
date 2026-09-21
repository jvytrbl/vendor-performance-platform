import Link from "next/link";
import EditTransactionForm from "@/components/transactions/EditTransactionForm";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Edit transaction
        </h1>
        <Link
          href="/transactions"
          className="text-sm font-medium text-accent hover:underline"
        >
          Back to transactions
        </Link>
      </div>
      <EditTransactionForm id={Number(id)} />
    </div>
  );
}
