"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { DepartmentRecord } from "@/types/department";

export function useDepartments() {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

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

    const result = await requestApi<{ departments: DepartmentRecord[] }>("/api/departments", {
      errorTitle: isSilent ? undefined : "Could not load departments",
      silent: isSilent,
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
      if (!isSilent) setError(result.message);
    } else {
      setDepartments(result.data.departments ?? []);
      if (!isSilent) setError(null);
    }

    if (!waitingForConnection && !isSilent) {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    scheduleEffectWork(() => load());
  }, [load]);

  return { departments, loading, error, refetch: load };
}
