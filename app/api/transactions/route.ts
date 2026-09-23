import { NextResponse } from "next/server";
import { withAuth } from "../../../lib/withAuth";
import { validateTransactionInput } from "../../../lib/domain/transactions/validateTransactionInput";
import { insertTransaction, getTransactions} from "@/lib/repositories/transactions";
import { getVendorById } from "@/lib/repositories/vendors";
import { parsePageParams } from "../../../lib/pagination/parsePageParams";

function parseOptionalPositiveInt(raw: string | null): { ok: true; value?: number } | { ok: false } {
    if (raw === null) return { ok: true, value: undefined };
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) return { ok: false };
    return { ok: true, value: parsed };
}
  
export const POST =  withAuth(async (request) => {
    const body = await request.json();
    const validation = validateTransactionInput(body);

    if(!validation.valid) {
        return NextResponse.json(
            {error: validation.error, code: validation.code, field: validation.field},
            {status: 400}
        );
    }

    const vendor = await getVendorById(validation.data.vendor_id);
    if(!vendor) {
        return NextResponse.json(
            {error: "Vendor not found", code: "VENDOR_NOT_FOUND", field: "vendor_id"},
            {status: 404}
        );
    }

    const created = await insertTransaction(validation.data);
    return NextResponse.json({ data: created}, {status: 201});
})

export const GET = withAuth(async (request) => {
    const params = new URL(request.url).searchParams;

    const vendorId = parseOptionalPositiveInt(params.get("vendor_id"));
  if (!vendorId.ok) {
    return NextResponse.json(
      { error: "vendor_id must be a positive integer", code: "VALIDATION_FAILED", field: "vendor_id" },
      { status: 400 }
    );
  }
  const page = parsePageParams(params);
  if (!page.ok) {
    return NextResponse.json(
      { error: page.error, code: "VALIDATION_FAILED", field: page.field },
      { status: 400 }
    );
  }
  const result = await getTransactions({
    vendor_id: vendorId.value,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    limit: page.limit,
    offset: page.offset,
  });
  return NextResponse.json(result);
});
