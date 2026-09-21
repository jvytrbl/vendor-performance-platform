import { NextResponse } from "next/server";
import { withAuth } from "../../../lib/withAuth";
import { validateReportInput } from "../../../lib/domain/reports/validateReportInput";
import { insertReport, getReports } from "@/lib/repositories/reports";
import { getVendorById } from "@/lib/repositories/vendors";

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const validation = validateReportInput(body);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, code: validation.code, field: validation.field },
      { status: 400 }
    );
  }

  for (const vendorId of validation.data.vendor_ids) {
    const vendor = await getVendorById(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found", code: "VENDOR_NOT_FOUND", field: "vendor_ids" },
        { status: 404 }
      );
    }
  }

  const created = await insertReport(validation.data);
  return NextResponse.json({ data: created }, { status: 201 });
});

export const GET =withAuth(async () => {
    const reports = await getReports();
    return NextResponse.json( { reports} );
});