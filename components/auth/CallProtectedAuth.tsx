"use client";

import { useMsal } from "@azure/msal-react";
import { useState } from "react";

const API_SCOPE = "api://542c58fb-c9a9-4e98-a11e-da6fea5b1809/access_as_user";

export default function CallProtectedRoute() {
  const { instance, accounts } = useMsal();
  const [result, setResult] = useState<string | null>(null);

  const handleCall = async () => {
    if (accounts.length === 0) {
      setResult("Not signed in");
      return;
    }

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: [API_SCOPE],
        account: accounts[0],
      });

      const response = await fetch("/api/protected-route", {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      });

      const body = await response.json();
      setResult(`Status ${response.status}: ${JSON.stringify(body)}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    }
  };

  return (
    <div>
      <button onClick={handleCall}>Call protected route</button>
      {result && <p>{result}</p>}
    </div>
  );
}