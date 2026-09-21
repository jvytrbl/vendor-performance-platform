/* Handle database connection.  every API route : 
(/api/vendors, /api/transactions, 
and later the reports/dashboard routes) 
needs to talk to Azure SQL. 

Without a shared helper, 
each route would have to repeat the same Key Vault 
authentication + connection logic — copy-pasted six or seven times across the codebase.
lib/db.ts centralizes that into one function every route can import and call.*/

import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import sql, { ConnectionPool } from "mssql";

// Module-level cache: persists across requests within the same running
// server instance, so we don't re-authenticate to Key Vault or reopen
// a SQL connection on every single API call.
let cachedPool: ConnectionPool | null = null;

/**
 * Returns a ready-to-use SQL connection pool.
 * On first call: authenticates to Key Vault, retrieves the connection
 * string, and opens a new pool.
 * On subsequent calls: returns the already-open pool immediately.
 */
export async function getDbPool(): Promise<ConnectionPool> {
  // If we already have a working pool, reuse it - skip everything else
  if (cachedPool && cachedPool.connected) {
    return cachedPool;
  }

  // Step 1: Authenticate to Azure using the Service Principal credentials
  // (reads AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET from env)
  const credential = new DefaultAzureCredential();

  // Step 2: Connect to Key Vault and retrieve the SQL connection string secret
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) {
    throw new Error("AZURE_KEY_VAULT_URL environment variable is not set");
  }

  const secretClient = new SecretClient(vaultUrl, credential);
  const secret = await secretClient.getSecret("sql-connection-string");

  if (!secret.value) {
    throw new Error("sql-connection-string secret exists but has no value");
  }

  // Step 3: Open a new connection pool using that connection string
  const pool = new sql.ConnectionPool(secret.value);
  await pool.connect();

  // Step 4: Cache it for reuse on future calls
  cachedPool = pool;

  return cachedPool;
}