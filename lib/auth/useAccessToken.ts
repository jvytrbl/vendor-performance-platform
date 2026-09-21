"use client";

import { useCallback } from "react";
import { useMsal } from "@azure/msal-react";

const API_SCOPE = "api://542c58fb-c9a9-4e98-a11e-da6fea5b1809/access_as_user";

export function useAccessToken() {
  const { instance, accounts } = useMsal();

  return useCallback(async () => {
    if (accounts.length === 0) {
      throw new Error("Not signed in");
    }
    const tokenResponse = await instance.acquireTokenSilent({
      scopes: [API_SCOPE],
      account: accounts[0],
    });
    return tokenResponse.accessToken;
  }, [instance, accounts]);
}