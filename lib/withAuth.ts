import { NextResponse } from "next/server";
import { validateAuthHeader, type AuthResult } from "./auth";

// TContext defaults to `any` rather than `undefined` because Next.js's App Router
// always calls every route handler with a second argument shaped
// `{ params: Promise<{...}> }` — even for routes with no dynamic segments, where
// it's `{ params: Promise<{}> }`. `any` here is a deliberate, narrow accommodation
// of that real calling convention, not a general escape hatch; dynamic routes still
// override this with a specific shape, e.g. withAuth<{ params: Promise<{ id: string }> }>.
export function withAuth<TContext = any>(
  handler: (request: Request, auth: AuthResult, context?: TContext) => Promise<Response>
) {
  return async (request: Request, context?: TContext): Promise<Response> => {
    const authHeader = request.headers.get("Authorization");
    const auth = await validateAuthHeader(authHeader);

    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.reason ?? "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    return handler(request, auth, context);
  };
}