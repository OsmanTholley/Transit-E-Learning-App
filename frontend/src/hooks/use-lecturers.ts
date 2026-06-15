"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { LecturerRecord } from "@/types/lecturer";

export function useLecturers() {
  const router = useRouter();
  const [lecturers, setLecturers] = useState<LecturerRecord[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let waitingForConnection = false;

    const result = await requestApi<{ lecturers: LecturerRecord[] }>("/api/lecturers", {
      errorTitle: "Could not load lecturers",
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
      setError(result.message);
    } else {
      setLecturers(result.data.lecturers ?? []);
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
    scheduleEffectWork(() => load());
  }, [load]);

  return { lecturers, loading, error, refetch: load };
}
