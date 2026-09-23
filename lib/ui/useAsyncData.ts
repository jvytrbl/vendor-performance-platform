"use client";

import { useCallback, useEffect, useState, type DependencyList } from "react";
import { useAccessToken } from "@/lib/auth/useAccessToken";

export type AsyncDataStatus = "loading" | "ready" | "error";

export interface UseAsyncDataResult<T> {
  status: AsyncDataStatus;
  data: T | null;
  errorMessage: string | null;
  reload: () => void;
}

/**
 * Shared fetch-on-mount / fetch-on-deps-change pattern for this app's list
 * pages and the report editor.
 *
 * The state updates live inside an async IIFE defined *inside* the effect,
 * not in a separately-referenced callback — react-hooks/set-state-in-effect
 * flags any call from an effect body to a function that sets state,
 * regardless of where that function puts its own `await`. An inline IIFE
 * with every setState placed after its own first `await` is the pattern
 * that actually satisfies the rule.
 */
export function useAsyncData<T>(
  fetcher: (accessToken: string) => Promise<T>,
  deps: DependencyList,
  fallbackErrorMessage: string,
  options?: { enabled?: boolean }
): UseAsyncDataResult<T> {
  const getAccessToken = useAccessToken();
  const enabled = options?.enabled ?? true;
  const [status, setStatus] = useState<AsyncDataStatus>("loading");
  const [data, setData] = useState<T | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      const accessToken = await getAccessToken();
      if (cancelled) return;
      setStatus("loading");
      setErrorMessage(null);
      try {
        const result = await fetcher(accessToken);
        if (cancelled) return;
        setData(result);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : fallbackErrorMessage);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // deps is an explicit, caller-supplied dependency list (the contract of
    // this hook); fetcher/getAccessToken/fallbackErrorMessage/enabled are
    // intentionally excluded to avoid re-fetching on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { status, data, errorMessage, reload };
}
