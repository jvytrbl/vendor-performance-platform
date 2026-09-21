import { createRemoteJWKSet, jwtVerify } from "jose";

// The shape every call to validateAuthHeader returns:
// - valid: did the request's token check out?
// - reason: only set when valid is false — a short, specific explanation of why it was rejected
export interface AuthResult {
  valid: boolean;
  reason?: string;
}

// Entra ID's public verification keys for our tenant — fetched once, reused for every request.
const jwks = createRemoteJWKSet(
  new URL(`https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`)
);

// Called explicitly by every protected route — this is the authoritative auth check
// (per Next.js's own guidance: Proxy should only ever do lightweight/optimistic checks,
// real verification belongs close to the data, i.e. in the route handler itself).
// Input: the raw "Authorization" header value from the incoming request (or null if absent).
// Output: { valid: true } for a genuinely good token, or { valid: false, reason } otherwise.
export async function validateAuthHeader(
  authorizationHeader: string | null
): Promise<AuthResult> {
  if (!authorizationHeader) {
    return { valid: false };
  }

  if (!authorizationHeader.startsWith("Bearer ")) {
    return { valid: false, reason: "Invalid authorization header" };
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    await jwtVerify(token, jwks, {
      issuer: `https://sts.windows.net/${process.env.AZURE_TENANT_ID}/`,
      audience: `api://${process.env.AZURE_CLIENT_ID}`,
    });
    return { valid: true };
  } catch (error) {
    console.error("Token verification failed:", error);
    return { valid: false, reason: "Invalid or Expired token" };
  }
}
