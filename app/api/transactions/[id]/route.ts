import { NextResponse } from "next/server";
import { withAuth } from "../../../../lib/withAuth";
import { validateTransactionInput } from "../../../../lib/domain/transactions/validateTransactionInput";
import { isReportLocked } from "../../../../lib/domain/transactions/isReportLocked";
import { getVendorById } from "@/lib/repositories/vendors";
import { getTransactionById, getFinalizedReports, updateTransaction, deleteTransaction} from "@/lib/repositories/transactions";

function parseTransactionId(id: string): number | null {
  const transactionId = Number(id);
  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return null;
  }
  return transactionId;
}

export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (request, auth, context) => {
  const { id } = await context!.params;
  const transactionId = parseTransactionId(id);

  if (transactionId === null) {
    return NextResponse.json(
      { error: "Transaction id must be a positive integer", code: "VALIDATION_FAILED", field: "id" },
      { status: 400 }
    );
  }

  const transaction = await getTransactionById(transactionId);
  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found", code: "TRANSACTION_NOT_FOUND", field: "id" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: transaction });
});

export const PUT = withAuth<{ params: Promise<{ id: string }> }>(async (request, auth, context) => {
  const { id } = await context!.params;
  const transactionId = parseTransactionId(id);

  if (transactionId === null) {
    return NextResponse.json(
      { error: "Transaction id must be a positive integer", code: "VALIDATION_FAILED", field: "id" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const validation = validateTransactionInput(body);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, code: validation.code, field: validation.field },
      { status: 400 }
    );
  }

  const existing = await getTransactionById(transactionId);
  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found", code: "TRANSACTION_NOT_FOUND", field: "id" },
      { status: 404 }
    );
  }

  const finalizedReports = await getFinalizedReports();
  const lockResult = isReportLocked(existing.vendor_id, existing.transaction_date!, finalizedReports);
  if (lockResult.locked) {
    return NextResponse.json(
      {
        error: `Transaction cannot be edited because it is part of finalized report ${lockResult.referenceNumber}`,
        code: "TRANSACTION_LOCKED",
        field: "id",
      },
      { status: 409 }
    );
  }

  const vendor = await getVendorById(validation.data.vendor_id);
  if (!vendor) {
    return NextResponse.json(
      { error: "Vendor not found", code: "VENDOR_NOT_FOUND", field: "vendor_id" },
      { status: 404 }
    );
  }

  const updated = await updateTransaction(transactionId, validation.data);
  return NextResponse.json({ data: updated });
});

export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(async (request, auth, context) => {
    const { id } = await context!.params;
    const transactionId = parseTransactionId(id);
    if (transactionId === null) {
      return NextResponse.json(
        { error: "Transaction id must be a positive integer", code: "VALIDATION_FAILED", field: "id" },
        { status: 400 }
      );
    }
    const existing = await getTransactionById(transactionId);
    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found", code: "TRANSACTION_NOT_FOUND", field: "id" },
        { status: 404 }
      );
    }

   const finalizedReports = await getFinalizedReports();
    const lockResult = isReportLocked(existing.vendor_id, existing.transaction_date!, finalizedReports);
    if (lockResult.locked) {
      return NextResponse.json(
        {
          error: `Transaction cannot be deleted because it is part of finalized report ${lockResult.referenceNumber}`,
          code: "TRANSACTION_LOCKED",
          field: "id",
        },
        { status: 409 }
      );
    }
    
    await deleteTransaction(transactionId);
    return NextResponse.json({ ok: true });
  });