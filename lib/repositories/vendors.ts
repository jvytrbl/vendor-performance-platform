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

export async function deleteVendor(id: number): Promise<number> {
    const pool = await getDbPool();
    const result = await pool
        .request()
        .input("id", id)
        .query("DELETE FROM VENDORS WHERE id = @id");

    return result.rowsAffected[0] ?? 0;
}