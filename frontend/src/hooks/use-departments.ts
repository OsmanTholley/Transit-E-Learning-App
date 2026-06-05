"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/fetch-api";
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

  const loadRef = useRef<() => Promise<void>>(async () => {});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let waitingForConnection = false;

    const result = await requestApi<{ departments: DepartmentRecord[] }>("/api/departments", {
      errorTitle: "Could not load departments",
      onRecovered: () => {
        if (mountedRef.current) {
          void loadRef.current();
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
      setDepartments(result.data.departments ?? []);
      setError(null);
    }

    if (!waitingForConnection) {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void load();
    });
  }, [load]);

  return { departments, loading, error, refetch: load };
}
