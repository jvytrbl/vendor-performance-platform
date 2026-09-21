import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export async function GET() {
  try {
    // Step 1: Get a working connection pool (Key Vault auth + SQL connect
    // now happens inside lib/db.ts, not here)
    const pool = await getDbPool();

    // Step 2: Run the same simple test query as before
    const result = await pool.request().query("SELECT 1 AS test_value");

    return NextResponse.json({
      keyVaultAuth: "success",
      secretRetrieved: "success",
      sqlConnection: "success",
      sqlQueryResult: result.recordset,
      overall: "PASS — Vercel -> lib/db.ts -> Key Vault -> SQL chain verified",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        overall: "FAIL",
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}