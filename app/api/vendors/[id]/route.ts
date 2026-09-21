import { NextResponse } from "next/server";
import { validateAuthHeader } from "../../../../lib/auth";
import { deleteVendor, getVendorById } from "../../../../lib/repositories/vendors";

function parseVendorId(id: string): number | null {
  const vendorId = Number(id);
  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return null;
  }
  return vendorId;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("Authorization");
  const authResult = await validateAuthHeader(authHeader);

  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.reason ?? "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const vendorId = parseVendorId(id);

  if (vendorId === null) {
    return NextResponse.json(
      {
        error: "Vendor id must be a positive integer",
        code: "VALIDATION_FAILED",
        field: "id",
      },
      { status: 400 }
    );
  }

  try {
    const vendor = await getVendorById(vendorId);

    if (!vendor) {
      return NextResponse.json(
        {
          error: "Vendor not found",
          code: "VENDOR_NOT_FOUND",
          field: "id",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: vendor });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch vendor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("Authorization");
  const authResult = await validateAuthHeader(authHeader);

  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.reason ?? "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const vendorId = parseVendorId(id);

  if (vendorId === null) {
    return NextResponse.json(
        {
            error: "Vendor id must be a positive integer",
            code: "VALIDATION_FAILED",
            field: "id",
        },
        {status: 400}
    );
  }

  try {
    const deletedCount = await deleteVendor(vendorId);
  
    if (deletedCount === 0) {
      return NextResponse.json(
        {
          error: "Vendor not found",
          code: "VENDOR_NOT_FOUND",
          field: "id",
        },
        { status: 404 }
      );
    }
  
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const sqlNumber =
      typeof error === "object" && error !== null && "number" in error
        ? (error as { number: number }).number
        : undefined;
  
    if (sqlNumber === 547) {
      return NextResponse.json(
        {
          error: "Vendor cannot be deleted as it is referenced by an exisiting transaction",
          code: "VENDOR_REFERENCED",
          field: "id",
        },
        { status: 409 }
      );
    }
  
    return NextResponse.json(
      { error: "Failed to delete vendor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
