"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import {
  DB_OFFLINE_EVENT,
  onDatabaseRecovered,
  pingDatabaseHealth,
} from "@/lib/db-offline-client";
import { flushOfflineSyncQueue } from "@/lib/offline-sync";
import { markSwalReady } from "@/lib/swal-queue";
import { showInternetCheck } from "@/lib/swal";

export function AppProviders({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    markSwalReady();

    const onDbOffline = () => {
      void showInternetCheck();
    };

    const refreshWhenHealthy = () => {
      onDatabaseRecovered(() => {
        router.refresh();
      });
    };

    const onOnline = () => {
      void pingDatabaseHealth().then((healthy) => {
        if (healthy) {
          void flushOfflineSyncQueue().finally(() => {
            router.refresh();
          });
        } else {
          refreshWhenHealthy();
        }
      });
    };

    window.addEventListener(DB_OFFLINE_EVENT, onDbOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener(DB_OFFLINE_EVENT, onDbOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [router]);

  return children;
}
