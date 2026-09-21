"use client";

import { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/lib/msalConfig";

export default function MsalProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    msalInstance.initialize().then(() => setIsInitialized(true));
  }, []);

  if (!isInitialized) {
    return null;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}