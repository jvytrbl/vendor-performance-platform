import { PublicClientApplication, Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
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