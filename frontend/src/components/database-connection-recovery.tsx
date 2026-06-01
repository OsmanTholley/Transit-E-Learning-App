"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { beginDatabaseOfflineRecovery } from "@/lib/db-offline-client";

/** Shown when the server cannot reach the database; recovers silently when connectivity returns. */
export function DatabaseConnectionRecovery() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    beginDatabaseOfflineRecovery(() => {
      router.refresh();
    });
  }, [router]);

  return <div className="min-h-screen bg-slate-100" aria-hidden />;
}
