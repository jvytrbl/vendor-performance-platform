import { getDbPool, type DbExecutor } from "@/lib/db";
import type { VendorInput } from "@/lib/domain/vendors/validateVendorInput";
import {
  buildVendorListOrderBy,
  type VendorSortBy,
  type VendorSortOrder,
} from "@/lib/domain/vendors/vendorListQuery";

export interface VendorRecord {
    id: number;
    name: string;
}

export interface VendorDetailRecord {
    id: number;
    name: string;
    registration_number: string;
    contact_info: string;
    created_at: string;
    transaction_count?: number;
}

export async function getAllVendors(): Promise<VendorRecord[]> {
    const pool = await getDbPool();
    const result  = await pool.request().query("Select id, name FROM VENDORS");

    return result.recordset;
}

// executor: pass a shared Transaction (e.g. from withAudit) to make this
// insert part of a larger atomic unit of work; omit it for a standalone call.
export async function insertVendor(input: VendorInput, executor?: DbExecutor): Promise<VendorRecord> {
    const pool = executor ?? (await getDbPool());
    const result = await pool 
        //parameterized query here!
        .request()
        .input("name", input.name)
        .input("registration_number", input.registration_number)
        .input("contact_info", input.contact_info)
        .query(
            `INSERT INTO VENDORS (name, registration_number, contact_info)
            OUTPUT INSERTED.id, INSERTED.name
            VALUES (@name, @registration_number, @contact_info)`
        );

        return result.recordset[0];
}

export async function getVendorsByIds(ids: number[]): Promise<VendorRecord[]> {
    if (ids.length === 0) {
        return [];
    }

    const pool = await getDbPool();
    const request = pool.request();
    const vendorParams = ids.map((id, index) => {
        request.input(`vendor${index}`, id);
        return `@vendor${index}`;
    });

    const result = await request.query(
        `SELECT id, name FROM VENDORS WHERE id IN (${vendorParams.join(", ")})`
    );

    return result.recordset;
}

export async function getVendorById(id: number): Promise<VendorDetailRecord | null> {
    const pool = await getDbPool();
    const result = await pool
        .request()
        .input("id", id)
        .query(
            "SELECT id, name, registration_number, contact_info, created_at FROM VENDORS WHERE id = @id"
        );

    return result.recordset[0] ?? null;
}

function likePattern(term: string): string {
  const escaped = term.replace(/[%_\[\]]/g, (char) => `[${char}]`);
  return `%${escaped}%`;
}

export async function listVendors(page: {
  search?: string;
  limit: number;
  offset: number;
  sortBy?: VendorSortBy;
  sortOrder?: VendorSortOrder;
}): Promise<{ vendors: VendorDetailRecord[]; total: number }> {
  const pool = await getDbPool();
  const request = pool.request();
  request.input("offset", page.offset);
  request.input("limit", page.limit);

  const search = page.search?.trim();
  const countWhere = search
    ? `WHERE (name LIKE @search OR registration_number LIKE @search OR contact_info LIKE @search)`
    : "";
  const pageWhere = search
    ? `WHERE (v.name LIKE @search OR v.registration_number LIKE @search OR v.contact_info LIKE @search)`
    : "";
  if (search) {
    request.input("search", likePattern(search));
  }

  const orderBy = buildVendorListOrderBy({
    sortBy: page.sortBy,
    sortOrder: page.sortOrder,
  });

  const countResult = await request.query(
    `SELECT COUNT(*) AS total FROM VENDORS ${countWhere}`
  );
  const rowsResult = await request.query(
    `SELECT v.id, v.name, v.registration_number, v.contact_info, v.created_at,
            ISNULL(t.transaction_count, 0) AS transaction_count
     FROM VENDORS v
     LEFT JOIN (
       SELECT vendor_id, COUNT(*) AS transaction_count
       FROM VENDOR_TRANSACTIONS
       GROUP BY vendor_id
     ) t ON t.vendor_id = v.id
     ${pageWhere}
     ${orderBy}
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
  );

  return {
    vendors: rowsResult.recordset,
    total: Number(countResult.recordset[0]?.total ?? 0),
  };
}

export async function deleteVendor(id: number, executor?: DbExecutor): Promise<number> {
    const pool = executor ?? (await getDbPool());
    const result = await pool
        .request()
        .input("id", id)
        .query("DELETE FROM VENDORS WHERE id = @id");

    return result.rowsAffected[0] ?? 0;
}