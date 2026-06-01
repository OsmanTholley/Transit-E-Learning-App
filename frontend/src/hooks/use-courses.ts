"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/fetch-api";
import { CourseRecord } from "@/types/academic";

export function useCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
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

    const result = await requestApi<{ courses: CourseRecord[] }>("/api/courses", {
      errorTitle: "Could not load courses",
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
      setCourses(result.data.courses ?? []);
      setError(null);
    }

    if (!waitingForConnection) {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return { courses, loading, error, refetch: load };
}
