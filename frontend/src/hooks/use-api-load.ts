"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi, type RequestApiOptions } from "@/lib/fetch-api";

type UseApiLoadOptions<T> = Omit<RequestApiOptions, "onRecovered"> & {
  errorTitle?: string;
  select?: (data: T) => unknown;
  /** Silent background reload interval (e.g. dashboards). Omit for manual refresh only. */
  refreshIntervalMs?: number;
};

export function useApiLoad<T>(url: string, options?: UseApiLoadOptions<T>) {
  const router = useRouter();
  const { errorTitle, select, silent, refreshIntervalMs, ...init } = options ?? {};
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadRef = useRef<(() => Promise<void>) | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false;
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }
    let waitingForConnection = false;

    const result = await requestApi<T>(url, {
      ...init,
      silent: silent || isSilent,
      errorTitle: isSilent ? undefined : errorTitle,
      onRecovered: () => {
        if (mountedRef.current) {
          void loadRef.current?.();
          router.refresh();
        }
      },
    });

    if (!mountedRef.current) return;

    if (result.offline) {
      waitingForConnection = true;
      return;
    }

    if (!result.ok) {
      if (!isSilent) {
        setError(result.message);
        setData(null);
        hasDataRef.current = false;
      }
    } else {
      const next = select ? (select(result.data) as T) : result.data;
      setData(next);
      hasDataRef.current = true;
      if (!isSilent) {
        setError(null);
      }
    }

    if (!waitingForConnection && !isSilent) {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- request options are stable per call site
  }, [url, errorTitle, silent, router]);

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!refreshIntervalMs) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (hasDataRef.current) {
        void load({ silent: true });
      }
    }, refreshIntervalMs);

    return () => window.clearInterval(timer);
  }, [refreshIntervalMs, load]);

  return { data, loading, error, reload: load, setData };
}
