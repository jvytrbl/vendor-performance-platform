import { createRemoteJWKSet, jwtVerify } from "jose";

// The shape every call to validateAuthHeader returns:
// - valid: did the request's token check out?
// - reason: only set when valid is false — a short, specific explanation of why it was rejected
export interface AuthResult {
  valid: boolean;
  reason?: string;
}

// Entra ID's public verification keys — the /common/ endpoint serves keys valid for
// any tenant, since we now accept sign-ins from multiple tenants (our own + Enviros').
// Which tenant a token actually came from is checked separately via the issuer pattern below.
const jwks = createRemoteJWKSet(
  new URL(`https://login.microsoftonline.com/common/discovery/v2.0/keys`)
);

// Matches a genuine Entra ID v1 issuer for any tenant: https://sts.windows.net/{tenant-guid}/
// This isn't tenant allow-listing (that's ALLOWED_EMAIL_DOMAIN) — it rejects tokens whose
// issuer isn't even shaped like a real Microsoft tenant issuer, which jwtVerify's signature
// check alone wouldn't catch (a token could be correctly signed by the shared /common/ JWKS
// yet carry a garbage/spoofed `iss` claim).
const ENTRA_ISSUER_PATTERN = /^https:\/\/sts\.windows\.net\/[0-9a-f-]{36}\/$/;

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
    // audience stays fixed: regardless of which tenant the user came from, the token
    // must still have been minted for this specific app registration.
    const { payload } = await jwtVerify(token, jwks, {
      audience: `api://${process.env.AZURE_CLIENT_ID}`,
    });

    // issuer is no longer a single hardcoded tenant string — validated by shape instead,
    // since jose's `issuer` option can't express "any real Entra tenant" as a pattern.
    if (typeof payload.iss !== "string" || !ENTRA_ISSUER_PATTERN.test(payload.iss)) {
      return { valid: false, reason: "Invalid or Expired token" };
    }

    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN ?? "").trim().toLowerCase();
    const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedDomain && allowedEmails.length === 0) {
      // fail closed: if neither allow-list is configured, trust nobody
      return { valid: false, reason: "Access not configured" };
    }

    const claimedEmail = (
      payload.email ??
      payload.preferred_username ??
      payload.upn ??
      ""
    ).toString().toLowerCase();

    // domain match covers the org (e.g. Enviros); explicit list covers individually
    // approved accounts outside that domain (e.g. the developer's own personal account).
    const domainOk = Boolean(allowedDomain) && claimedEmail.endsWith("@" + allowedDomain);
    const explicitOk = allowedEmails.includes(claimedEmail);

    if (!claimedEmail || (!domainOk && !explicitOk)) {
      return { valid: false, reason: "Account not authorized for this application" };
    }

    return { valid: true };
  } catch (error) {
    console.error("Token verification failed:", error);
    return { valid: false, reason: "Invalid or Expired token" };
  }
}
