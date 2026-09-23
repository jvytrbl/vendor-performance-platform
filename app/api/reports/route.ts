import { NextResponse } from "next/server";
import { withAuth } from "../../../lib/withAuth";
import { validateReportInput } from "../../../lib/domain/reports/validateReportInput";
import { insertReport, listReports } from "@/lib/repositories/reports";
import { getVendorById } from "@/lib/repositories/vendors";
import { parsePageParams } from "../../../lib/pagination/parsePageParams";
import { parseReportListFilters } from "../../../lib/domain/reports/reportListQuery";

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

export const GET = withAuth(async (request) => {
  const params = new URL(request.url).searchParams;
  const page = parsePageParams(params);
  if (!page.ok) {
    return NextResponse.json(
      { error: page.error, code: "VALIDATION_FAILED", field: page.field },
      { status: 400 }
    );
  }
  const filters = parseReportListFilters({
    status: params.get("status"),
    search: params.get("search"),
    sortBy: params.get("sortBy"),
    sortOrder: params.get("sortOrder"),
  });
  if (!filters.ok) {
    return NextResponse.json(
      { error: filters.error, code: "VALIDATION_FAILED", field: filters.field },
      { status: 400 }
    );
  }
  const result = await listReports({
    limit: page.limit,
    offset: page.offset,
    status: filters.status,
    search: filters.search,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });
  return NextResponse.json(result);
});