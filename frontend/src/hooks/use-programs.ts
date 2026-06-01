"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/fetch-api";
import { ProgramRecord } from "@/types/academic";

export function usePrograms() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
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

    const result = await requestApi<{ programs: ProgramRecord[] }>("/api/programs", {
      errorTitle: "Could not load programs",
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
    } else {
      setPrograms(result.data.programs ?? []);
      setError(null);
    }

    if (!waitingForConnection) {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return { programs, loading, error, refetch: load };
}
