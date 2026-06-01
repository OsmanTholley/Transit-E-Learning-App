"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi, type RequestApiOptions } from "@/lib/fetch-api";

type UseApiLoadOptions<T> = Omit<RequestApiOptions, "onRecovered"> & {
  errorTitle?: string;
  select?: (data: T) => unknown;
};

export function useApiLoad<T>(url: string, options?: UseApiLoadOptions<T>) {
  const router = useRouter();
  const { errorTitle, select, silent, ...init } = options ?? {};
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let waitingForConnection = false;

    const result = await requestApi<T>(url, {
      ...init,
      silent,
      errorTitle,
      onRecovered: () => {
        if (mountedRef.current) {
          void load();
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
      setError(result.message);
      setData(null);
    } else {
      const next = select ? (select(result.data) as T) : result.data;
      setData(next);
      setError(null);
    }

    if (!waitingForConnection) {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- request options are stable per call site
  }, [url, errorTitle, silent, router]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
