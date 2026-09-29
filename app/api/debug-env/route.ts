// TEMPORARY DIAGNOSTIC ROUTE — UNAUTHENTICATED. Delete this file the moment
// its output has been read. Auth is deliberately removed here because the bug
// under investigation is validateAuthHeader itself rejecting valid tokens in
// production, so gating this route behind it would be circular. Only exposes
// non-secret config flags (no credentials, no user data).
import { NextResponse } from "next/server";

export async function GET() {
  const tenantIdsRaw = process.env.ALLOWED_TENANT_IDS ?? "";
  const tenantIdsParsed = tenantIdsRaw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return NextResponse.json({
    allowedTenantIdsRaw: JSON.stringify(tenantIdsRaw),
    allowedTenantIdsRawLength: tenantIdsRaw.length,
    allowedTenantIdsParsed: tenantIdsParsed,
    allowedEmailDomainRaw: JSON.stringify(process.env.ALLOWED_EMAIL_DOMAIN ?? ""),
    allowedEmailsRaw: JSON.stringify(process.env.ALLOWED_EMAILS ?? ""),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    // This project declares no `export const runtime = "edge"` anywhere,
    // so every API route — including this one — runs on the default
    // Node.js runtime, not the Edge runtime.
    runtime: "nodejs (default — no `export const runtime` override present)",
  });
}
