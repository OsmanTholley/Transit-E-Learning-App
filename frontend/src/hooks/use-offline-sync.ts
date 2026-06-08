"use client";

import { useSyncExternalStore } from "react";
import {
  ensureOfflineSyncListeners,
  flushOfflineSyncQueue,
  getOfflineSyncServerSnapshot,
  getOfflineSyncSnapshot,
  subscribeOfflineSync,
} from "@/lib/offline-sync";

export function useOfflineSync() {
  ensureOfflineSyncListeners();

  const snapshot = useSyncExternalStore(
    subscribeOfflineSync,
    getOfflineSyncSnapshot,
    getOfflineSyncServerSnapshot
  );

  return {
    ...snapshot,
    retrySync: () => flushOfflineSyncQueue(),
  };
}
