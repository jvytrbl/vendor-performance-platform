import { getDbPool } from "@/lib/db";
import type { VendorInput } from "@/lib/domain/vendors/validateVendorInput";

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
}

export async function getAllVendors(): Promise<VendorRecord[]> {
    const pool = await getDbPool();
    const result  = await pool.request().query("Select id, name FROM VENDORS");

    return result.recordset;
}

export async function insertVendor(input: VendorInput): Promise<VendorRecord> {
    const pool = await getDbPool();
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
}): Promise<{ vendors: VendorDetailRecord[]; total: number }> {
  const pool = await getDbPool();
  const request = pool.request();
  request.input("offset", page.offset);
  request.input("limit", page.limit);

  const search = page.search?.trim();
  const whereClause = search
    ? `WHERE (name LIKE @search OR registration_number LIKE @search OR contact_info LIKE @search)`
    : "";
  if (search) {
    request.input("search", likePattern(search));
  }

  const countResult = await request.query(
    `SELECT COUNT(*) AS total FROM VENDORS ${whereClause}`
  );
  const rowsResult = await request.query(
    `SELECT id, name, registration_number, contact_info, created_at
     FROM VENDORS
     ${whereClause}
     ORDER BY created_at DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
  );

  return {
    vendors: rowsResult.recordset,
    total: Number(countResult.recordset[0]?.total ?? 0),
  };
}

export async function deleteVendor(id: number): Promise<number> {
    const pool = await getDbPool();
    const result = await pool
        .request()
        .input("id", id)
        .query("DELETE FROM VENDORS WHERE id = @id");

    return result.rowsAffected[0] ?? 0;
}