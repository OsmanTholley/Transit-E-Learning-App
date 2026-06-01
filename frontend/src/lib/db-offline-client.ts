"use client";

import { DATABASE_OFFLINE_CODE } from "@/lib/db-errors";
import { deferCallback } from "@/lib/swal-queue";

export const DB_OFFLINE_EVENT = "transit:db-offline";

const HEALTH_URL = "/api/health";
const POLL_MS = 1500;

let outageActive = false;
let polling = false;
const recoveryCallbacks = new Set<() => void>();

export function isDatabaseOfflinePayload(
  data: unknown
): data is { code?: string; error?: string } {
  if (!data || typeof data !== "object") return false;
  const payload = data as { code?: string; error?: string };
  return payload.code === DATABASE_OFFLINE_CODE;
}

export function isDatabaseOfflineResponse(
  response: Response,
  data: unknown
): boolean {
  return response.status === 503 && isDatabaseOfflinePayload(data);
}

export async function pingDatabaseHealth(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

export function notifyDatabaseOffline() {
  if (typeof window === "undefined" || outageActive) return;
  outageActive = true;
  window.dispatchEvent(new CustomEvent(DB_OFFLINE_EVENT));
}

function runRecoveryCallbacks() {
  outageActive = false;
  const callbacks = [...recoveryCallbacks];
  recoveryCallbacks.clear();
  for (const callback of callbacks) {
    deferCallback(callback);
  }
}

function startHealthPolling() {
  if (polling) return;
  polling = true;

  const tick = async () => {
    const healthy = await pingDatabaseHealth();
    if (healthy) {
      polling = false;
      runRecoveryCallbacks();
      return;
    }
    window.setTimeout(() => {
      void tick();
    }, POLL_MS);
  };

  void tick();
}

export function onDatabaseRecovered(callback: () => void) {
  recoveryCallbacks.add(callback);
  startHealthPolling();
}

export function beginDatabaseOfflineRecovery(callback: () => void) {
  notifyDatabaseOffline();
  onDatabaseRecovered(callback);
}
