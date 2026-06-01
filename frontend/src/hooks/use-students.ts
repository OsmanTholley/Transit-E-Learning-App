"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/fetch-api";
import { StudentRecord } from "@/types/student";

export function useStudents() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    let waitingForConnection = false;

    const result = await requestApi<{ students: StudentRecord[] }>("/api/students", {
      errorTitle: "Could not load students",
      onRecovered: () => {
        if (mountedRef.current) {
          void loadStudents();
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
      setStudents(result.data.students ?? []);
      setError(null);
    }

    if (!waitingForConnection) {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  return { students, loading, error, refetch: loadStudents, setStudents };
}
