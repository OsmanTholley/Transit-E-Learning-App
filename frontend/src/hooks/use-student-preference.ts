"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { enqueueOfflineSync, flushOfflineSyncQueue } from "@/lib/offline-sync";
import type { StudentPrefKey } from "@/lib/student-preference-keys";

const storageListeners = new Set<() => void>();
let hydratePromise: Promise<void> | null = null;
let hydrated = false;

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

/** Return a stable reference until localStorage for `key` changes. */
function getCachedSnapshot<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

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

async function hydrateFromServer() {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/student/preferences", { credentials: "include" });
    if (!res.ok) return;
    const json = (await res.json()) as { preferences?: Record<string, unknown> };
    const serverPrefs = json.preferences ?? {};
    const toUpload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(serverPrefs)) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key in serverPrefs) continue;
      if (!key.startsWith("transit.") && key !== "transit_course_bookmarks") continue;
      const localValue = safeParse(localStorage.getItem(key), null);
      if (localValue !== null) toUpload[key] = localValue;
    }

    if (Object.keys(toUpload).length > 0) {
      const body = JSON.stringify({ preferences: toUpload });
      try {
        const res = await fetch("/api/student/preferences", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) throw new Error("Failed to upload local preferences");
      } catch {
        enqueueOfflineSync({
          url: "/api/student/preferences",
          method: "PUT",
          body,
          label: "Preference sync",
        });
      }
    }

    notifyStorageListeners();
  } catch {
    /* offline — local cache still works */
  } finally {
    hydrated = true;
  }
}

function ensureHydrated() {
  if (typeof window === "undefined" || hydrated) return;
  hydratePromise ??= hydrateFromServer();
}

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleSave(key: string, value: unknown) {
  const existing = saveTimers.get(key);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    key,
    setTimeout(() => {
      const body = JSON.stringify({ key, value });
      void (async () => {
        try {
          const res = await fetch("/api/student/preferences", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body,
          });
          if (!res.ok) throw new Error("Failed to save preference");
          if (navigator.onLine) {
            await flushOfflineSyncQueue();
          }
        } catch {
          enqueueOfflineSync({
            url: "/api/student/preferences",
            method: "PUT",
            body,
            label: "Preference sync",
          });
        } finally {
          saveTimers.delete(key);
        }
      })();
    }, 400)
  );
}

export function useStudentPreference<T>(key: StudentPrefKey | string, fallback: T) {
  ensureHydrated();

  const subscribe = useCallback((onStoreChange: () => void) => {
    storageListeners.add(onStoreChange);
    return () => {
      storageListeners.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => getCachedSnapshot(key, fallback), [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureHydrated();
    if (hydratePromise) {
      void hydratePromise.then(() => notifyStorageListeners());
    }
  }, []);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = getCachedSnapshot(key, fallback);
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
      localStorage.setItem(key, JSON.stringify(resolved));
      primeSnapshotCache(key, resolved);
      scheduleSave(key, resolved);
      notifyStorageListeners();
    },
    [key, fallback]
  );

  return [value, setValue] as const;
}

export function readStudentPreference<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  ensureHydrated();
  return safeParse(localStorage.getItem(key), fallback);
}

export function writeStudentPreference<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  primeSnapshotCache(key, value);
  scheduleSave(key, value);
  notifyStorageListeners();
}

export function updateStudentPreferenceRecord<T extends Record<string, unknown>>(
  key: string,
  updater: (prev: T) => T
) {
  const prev = readStudentPreference(key, {} as T);
  const next = updater(prev);
  writeStudentPreference(key, next);
  return next;
}
