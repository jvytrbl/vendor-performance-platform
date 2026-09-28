import { PublicClientApplication, Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    // /organizations accepts any Entra ID work/school tenant (not just ours), since
    // sign-in is now multi-tenant (our tenant + Enviros'). Deliberately not /common —
    // that would also admit personal Microsoft accounts, which we don't want.
    authority: "https://login.microsoftonline.com/organizations",
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