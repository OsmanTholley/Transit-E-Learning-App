"use client";

import { useCallback, useSyncExternalStore } from "react";

const storageListeners = new Set<() => void>();

function notifyStorageListeners() {
  storageListeners.forEach((listener) => listener());
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

type SnapshotCacheEntry = {
  raw: string | null;
  value: unknown;
};

const snapshotCache = new Map<string, SnapshotCacheEntry>();

function getCachedSnapshot<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value as T;
  }

  const value = safeParse(raw, fallback);
  snapshotCache.set(key, { raw, value });
  return value;
}

function primeSnapshotCache(key: string, value: unknown) {
  snapshotCache.set(key, { raw: JSON.stringify(value), value });
}

export function useLocalStorageState<T>(key: string, fallback: T) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    storageListeners.add(onStoreChange);
    return () => {
      storageListeners.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => getCachedSnapshot(key, fallback), [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = getCachedSnapshot(key, fallback);
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
      localStorage.setItem(key, JSON.stringify(resolved));
      primeSnapshotCache(key, resolved);
      notifyStorageListeners();
    },
    [key, fallback]
  );

  return [value, setValue] as const;
}
