import { NextResponse } from "next/server";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import sql from "mssql";

export async function GET() {
  const result: Record<string, unknown> = {};

  try {
    // Step 1: Authenticate to Key Vault using the Service Principal
    // (reads AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET from env automatically)
    const credential = new DefaultAzureCredential();
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL!;
    const secretClient = new SecretClient(vaultUrl, credential);
    result.keyVaultAuth = "success";

    // Step 2: Retrieve the SQL connection string secret
    const secret = await secretClient.getSecret("sql-connection-string");
    result.secretRetrieved = "success";

    // Step 3: Parse the ADO.NET-style connection string into mssql's config format
    const connStr = secret.value!;
    const parts = Object.fromEntries(
      connStr
        .split(";")
        .filter(Boolean)
        .map((kv) => {
          const [k, ...rest] = kv.split("=");
          return [k.trim(), rest.join("=").trim()];
        })
    );

    const config: sql.config = {
      server: parts["Server"].replace(/^tcp:/, "").split(",")[0],
      port: 1433,
      database: parts["Initial Catalog"],
      user: parts["User ID"],
      password: parts["Password"],
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    };

    // Step 4: Actually open a connection and run a trivial query
    const pool = await sql.connect(config);
    const testQuery = await pool.request().query("SELECT 1 AS test_value");
    await pool.close();

    result.sqlConnection = "success";
    result.sqlQueryResult = testQuery.recordset;
    result.overall = "PASS — Vercel -> Key Vault -> SQL chain verified";

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ...result, overall: "FAIL", error: message },
      { status: 500 }
    );
  }
}