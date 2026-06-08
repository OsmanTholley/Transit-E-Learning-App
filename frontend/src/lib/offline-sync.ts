"use client";

import { beginDatabaseOfflineRecovery, pingDatabaseHealth } from "@/lib/db-offline-client";
import { flushLecturerUploadQueue, getLecturerUploadQueueCount } from "@/lib/lecturer-upload-sync";

export const OFFLINE_SYNC_CHANGED_EVENT = "transit:offline-sync-changed";

const QUEUE_KEY = "transit.offlineSync.queue.v1";

export type OfflineSyncJob = {
  id: string;
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
  label: string;
  createdAt: string;
};

type SyncState = {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
};

let state: SyncState = {
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  syncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,
};

const SERVER_SNAPSHOT: SyncState = {
  online: true,
  syncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,
};

let cachedClientSnapshot: SyncState = { ...SERVER_SNAPSHOT };
let cachedClientKey = "";

const listeners = new Set<() => void>();
let flushPromise: Promise<void> | null = null;
let listenersBound = false;

function readQueue(): OfflineSyncJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineSyncJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(jobs: OfflineSyncJob[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs));
  updatePendingCount();
}

function notify() {
  if (typeof window === "undefined") return;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_CHANGED_EVENT));
}

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  notify();
}

export function getOfflineSyncSnapshot(): SyncState {
  state.pendingCount = readQueue().length + getLecturerUploadQueueCount();
  const key = `${state.online}|${state.syncing}|${state.pendingCount}|${state.lastSyncedAt}|${state.lastError}`;
  if (key !== cachedClientKey) {
    cachedClientKey = key;
    cachedClientSnapshot = { ...state };
  }
  return cachedClientSnapshot;
}

export function getOfflineSyncServerSnapshot(): SyncState {
  return SERVER_SNAPSHOT;
}

export function subscribeOfflineSync(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function bindNetworkListeners() {
  if (typeof window === "undefined" || listenersBound) return;
  listenersBound = true;

  const handleOnline = () => {
    setState({ online: true, lastError: null });
    void pingDatabaseHealth().then((healthy) => {
      if (healthy) {
        void flushOfflineSyncQueue();
      } else {
        beginDatabaseOfflineRecovery(() => {
          void flushOfflineSyncQueue();
        });
      }
    });
  };

  const handleOffline = () => {
    setState({ online: false });
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  state.pendingCount = readQueue().length + getLecturerUploadQueueCount();
  notify();
}

export function ensureOfflineSyncListeners() {
  bindNetworkListeners();
}

export function enqueueOfflineSync(
  job: Omit<OfflineSyncJob, "id" | "createdAt"> & { id?: string }
) {
  ensureOfflineSyncListeners();
  const queue = readQueue();
  const next: OfflineSyncJob = {
    id: job.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    url: job.url,
    method: job.method,
    body: job.body,
    headers: job.headers,
    label: job.label,
  };

  const existingIndex = queue.findIndex(
    (item) => item.url === next.url && item.method === next.method && item.body === next.body
  );
  if (existingIndex >= 0) {
    queue[existingIndex] = next;
  } else {
    queue.push(next);
  }

  writeQueue(queue);
  return next.id;
}

function updatePendingCount() {
  state.pendingCount = readQueue().length + getLecturerUploadQueueCount();
  notify();
}

async function runJob(job: OfflineSyncJob): Promise<boolean> {
  try {
    const res = await fetch(job.url, {
      method: job.method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...job.headers,
      },
      body: job.body,
      cache: "no-store",
    });

    if (!res.ok) {
      let message = "Sync failed";
      try {
        const data = (await res.json()) as { error?: string; message?: string };
        message = data.error ?? data.message ?? message;
      } catch {
        /* ignore */
      }
      setState({ lastError: message });
      return false;
    }

    return true;
  } catch {
    setState({ lastError: "Could not reach the server." });
    return false;
  }
}

export async function flushOfflineSyncQueue(): Promise<void> {
  ensureOfflineSyncListeners();
  if (!navigator.onLine) return;
  if (flushPromise) return flushPromise;

  const queue = readQueue();
  const uploadCount = getLecturerUploadQueueCount();
  if (queue.length === 0 && uploadCount === 0) return;

  flushPromise = (async () => {
    setState({ syncing: true, lastError: null });

    const uploadResult = await flushLecturerUploadQueue();
    if (uploadResult.lastError) {
      setState({ syncing: false, lastError: uploadResult.lastError });
      return;
    }

    let remaining = readQueue();

    for (const job of remaining) {
      if (!navigator.onLine) break;
      const ok = await runJob(job);
      if (!ok) break;
      remaining = remaining.filter((item) => item.id !== job.id);
      writeQueue(remaining);
    }

    const uploadRemaining = getLecturerUploadQueueCount();
    if (remaining.length === 0 && uploadRemaining === 0) {
      setState({
        syncing: false,
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
      });
    } else {
      setState({ syncing: false });
    }
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

export function isNetworkOfflineError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  );
}
