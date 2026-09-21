import { NextResponse } from "next/server";
import { withAuth } from "../../../../lib/withAuth";
import { validateUploadHeaders } from "../../../../lib/domain/transactions/validateUploadHeaders";
import { validateUploadFileSize } from "../../../../lib/domain/transactions/validateUploadFileSize";
import { validateUploadRowCount } from "../../../../lib/domain/transactions/validateUploadRowCount";
import { validateTransactionInput } from "../../../../lib/domain/transactions/validateTransactionInput";
import { resolveVendorByName } from "../../../../lib/domain/transactions/resolveVendorByName";
import { parseTransactionFile } from "@/lib/uploads/parseTransactionFile";
import { getAllVendors } from "@/lib/repositories/vendors";
import { insertTransaction } from "@/lib/repositories/transactions";

interface RowError {
  row: number;
  error: string;
  code: string;
  field: string;
}

export const POST = withAuth(async (request) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded", code: "VALIDATION_FAILED", field: "file" },
      { status: 400 }
    );
  }

  const fileSizeCheck = validateUploadFileSize(file.size);
  if (!fileSizeCheck.valid) {
    return NextResponse.json(
      { error: fileSizeCheck.error, code: fileSizeCheck.code, field: fileSizeCheck.field },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseTransactionFile(buffer, file.name);

  const headerCheck = validateUploadHeaders(parsed.headers);
  if (!headerCheck.valid) {
    return NextResponse.json(
      { error: headerCheck.error, code: headerCheck.code, field: headerCheck.field },
      { status: 400 }
    );
  }

  const rowCountCheck = validateUploadRowCount(parsed.rows.length);
  if (!rowCountCheck.valid) {
    return NextResponse.json(
      { error: rowCountCheck.error, code: rowCountCheck.code, field: rowCountCheck.field },
      { status: 400 }
    );
  }

  const vendors = await getAllVendors();

  const errors: RowError[] = [];
  let inserted = 0;

  for (let index = 0; index < parsed.rows.length; index++) {
    const rowNumber = index + 2;
    const rawRow = parsed.rows[index] as any;

    const resolution = resolveVendorByName(rawRow.vendor_name, vendors);
    if (!resolution.matched) {
      errors.push({
        row: rowNumber,
        error: resolution.error,
        code: resolution.code,
        field: "vendor_name",
      });
      continue;
    }

    const candidateRow = { ...rawRow, vendor_id: resolution.vendorId };
    const validation = validateTransactionInput(candidateRow);
    if (!validation.valid) {
      errors.push({
        row: rowNumber,
        error: validation.error,
        code: validation.code,
        field: validation.field,
      });
      continue;
    }

    try {
      await insertTransaction(validation.data);
      inserted++;
    } catch {
      errors.push({
        row: rowNumber,
        error: "Failed to insert transaction",
        code: "INTERNAL_ERROR",
        field: "row",
      });
    }
  }

  errors.sort((a, b) => a.row - b.row);

  return NextResponse.json({
    data: { inserted, failed: errors.length },
    errors,
  });
});
