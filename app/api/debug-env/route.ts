// TEMPORARY DIAGNOSTIC ROUTE — delete this file once the ALLOWED_TENANT_IDS
// localhost-vs-Vercel-production mismatch is understood. Not a feature.
import { NextResponse } from "next/server";
import { validateAuthHeader } from "@/lib/auth";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const authResult = await validateAuthHeader(authHeader);

  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.reason, code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const raw = process.env.ALLOWED_TENANT_IDS ?? "";
  const parsed = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return NextResponse.json({
    allowedTenantIdsRaw: JSON.stringify(raw),
    allowedTenantIdsRawLength: raw.length,
    allowedTenantIdsParsed: parsed,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    // This project declares no `export const runtime = "edge"` anywhere,
    // so every API route — including this one — runs on the default
    // Node.js runtime, not the Edge runtime.
    runtime: "nodejs (default — no `export const runtime` override present)",
  });
}
