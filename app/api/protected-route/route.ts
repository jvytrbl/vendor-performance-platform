import { NextResponse } from "next/server";
import { validateAuthHeader } from "@/lib/auth";

// This route verifies the request itself — it does not rely on proxy.ts (or any
// upstream layer) to have already checked auth, per Next.js's own guidance that
// Route Handlers should be treated like public-facing API endpoints and verify
// access themselves, close to the data, rather than trusting an earlier layer.
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const result = await validateAuthHeader(authHeader);

  if (!result.valid) {
    return NextResponse.json(
      { error: result.reason ?? "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
