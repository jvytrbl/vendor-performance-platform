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
import sql, { ConnectionPool, Transaction } from "mssql";

// Anything a repository query can run against: the shared pool for a plain
// standalone call, or a caller-supplied Transaction when the call needs to
// participate in someone else's atomic unit of work (e.g. withAudit pairing
// a mutation with its audit-log row). Both expose the same .request() shape.
export type DbExecutor = ConnectionPool | Transaction;

// Module-level cache: persists across requests within the same running
// server instance, so we don't re-authenticate to Key Vault or reopen
// a SQL connection on every single API call.
let cachedPool: ConnectionPool | null = null;

// If two requests call getDbPool() before the first connection attempt has
// finished, both would otherwise see cachedPool as empty and each kick off
// their own Key Vault auth + new SQL connection at the same time. Caching the
// in-flight promise means every concurrent caller awaits the same attempt
// instead of duplicating it.
let connectingPool: Promise<ConnectionPool> | null = null;

async function connect(): Promise<ConnectionPool> {
  const tStart = Date.now();

  // Step 1: Authenticate to Azure using the Service Principal credentials
  // (reads AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET from env)
  const credential = new DefaultAzureCredential();

  // Step 2: Connect to Key Vault and retrieve the SQL connection string secret
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) {
    throw new Error("AZURE_KEY_VAULT_URL environment variable is not set");
  }

  const secretClient = new SecretClient(vaultUrl, credential);
  const tSecret = Date.now();
  const secret = await secretClient.getSecret("sql-connection-string");
  console.log(`[db-cold-start] Key Vault getSecret: ${Date.now() - tSecret}ms`);

  if (!secret.value) {
    throw new Error("sql-connection-string secret exists but has no value");
  }

  // Step 3: Open a new connection pool using that connection string
  const pool = new sql.ConnectionPool(secret.value);
  const tConnect = Date.now();
  await pool.connect();
  console.log(`[db-cold-start] SQL pool.connect(): ${Date.now() - tConnect}ms`);
  console.log(`[db-cold-start] total getDbPool(): ${Date.now() - tStart}ms`);

  return pool;
}

/**
 * Returns a ready-to-use SQL connection pool.
 * On first call: authenticates to Key Vault, retrieves the connection
 * string, and opens a new pool.
 * On subsequent calls: returns the already-open pool immediately.
 * Concurrent calls made before the first connection finishes all share
 * that same in-flight attempt rather than opening redundant connections.
 */
export async function getDbPool(): Promise<ConnectionPool> {
  // If we already have a working pool, reuse it - skip everything else
  if (cachedPool && cachedPool.connected) {
    return cachedPool;
  }

  if (!connectingPool) {
    connectingPool = connect()
      .then((pool) => {
        cachedPool = pool;
        return pool;
      })
      .finally(() => {
        connectingPool = null;
      });
  }

  return connectingPool;
}