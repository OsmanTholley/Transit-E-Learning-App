"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { showError } from "@/lib/swal";
import { StudentDashboardData } from "@/types/student-dashboard";

type StudentSessionContextValue = {
  data: StudentDashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const StudentSessionContext = createContext<StudentSessionContextValue | null>(null);

export function StudentSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardData | null>(null);
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
    let waitingForConnection = false;

    const result = await requestApi<StudentDashboardData>("/api/student/dashboard", {
      silent: true,
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
      setLoading(true);
      return;
    }

    if (!result.ok) {
      const message = result.message;
      const lower = message.toLowerCase();
      if (lower.includes("unauthorized")) {
        await showError("Session expired", "Please sign in again.");
      } else if (!lower.includes("not found")) {
        await showError("Could not load profile", message);
      }
      setError(message);
      setData(null);
    } else {
      setData(result.data);
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

  return (
    <StudentSessionContext.Provider value={{ data, loading, error, refresh: load }}>
      {children}
    </StudentSessionContext.Provider>
  );
}

export function useStudentSession() {
  const ctx = useContext(StudentSessionContext);
  if (!ctx) {
    throw new Error("useStudentSession must be used within StudentSessionProvider");
  }
  return ctx;
}
