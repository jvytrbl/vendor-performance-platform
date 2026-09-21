import Link from "next/link";
import TransactionDetail from "@/components/transactions/TransactionDetail";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Transaction details
        </h1>
        <Link
          href="/transactions"
          className="text-sm font-medium text-accent hover:underline"
        >
          Back to transactions
        </Link>
      </div>
      <TransactionDetail id={Number(id)} />
    </div>
  );
}
