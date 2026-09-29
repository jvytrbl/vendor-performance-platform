import { PublicClientApplication, Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    // /common accepts both work/school tenants and personal-Microsoft-account-backed
    // identities. Required over /organizations because at least one legitimate user
    // (the developer) signs in via a Gmail-based guest identity in the tenant that's
    // backed by a personal Microsoft account under the hood — /organizations rejects
    // that at the login screen. Tenant/account restriction is enforced elsewhere
    // (Azure Portal App Registration + ALLOWED_EMAIL_DOMAIN/ALLOWED_EMAILS in lib/auth.ts),
    // not by this authority value.
    authority: "https://login.microsoftonline.com/common",
    redirectUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  },
  cache: {
    // localStorage (not sessionStorage) so the session survives tab close/
    // reopen and so Playwright's context.storageState() — which only
    // captures cookies + localStorage, never sessionStorage — can actually
    // persist and restore a logged-in session across test runs.
    cacheLocation: "localStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);