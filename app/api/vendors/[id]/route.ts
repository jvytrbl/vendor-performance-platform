import { NextResponse } from "next/server";
import { withAuth } from "../../../../lib/withAuth";
import { deleteVendor, getVendorById } from "../../../../lib/repositories/vendors";
import { withAudit } from "@/lib/audit/withAudit";
import { getClientIp } from "@/lib/http/getClientIp";

// deleteVendor doesn't pre-check existence (unlike reports/transactions) —
// it deletes first and infers "not found" from rowsAffected === 0. Thrown
// from inside withAudit's mutate callback when that happens, so the whole
// transaction (including the audit row) rolls back instead of recording a
// 'vendor.deleted' entry for a vendor that was never actually deleted.
class VendorNotFoundError extends Error {}

function parseVendorId(id: string): number | null {
  const vendorId = Number(id);
  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return null;
  }
  return vendorId;
}

export const GET = withAuth<{ params: Promise<{ id: string }> }>(
  async (_request, _auth, context) => {
    const { id } = await context!.params;
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
);

export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(
  async (request, auth, context) => {
    const { id } = await context!.params;
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
      await withAudit(
        {
          auth,
          action: "vendor.deleted",
          targetType: "Vendor",
          targetId: vendorId,
          ipAddress: getClientIp(request),
        },
        async (executor) => {
          const deletedCount = await deleteVendor(vendorId, executor);
          if (deletedCount === 0) {
            throw new VendorNotFoundError();
          }
        }
      );

      return NextResponse.json({ ok: true });
    } catch (error: unknown) {
      if (error instanceof VendorNotFoundError) {
        return NextResponse.json(
          {
            error: "Vendor not found",
            code: "VENDOR_NOT_FOUND",
            field: "id",
          },
          { status: 404 }
        );
      }

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
);
