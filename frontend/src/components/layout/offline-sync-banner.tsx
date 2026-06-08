"use client";

import { useEffect, useRef } from "react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { showSuccess } from "@/lib/swal";

type Props = {
  onReconnect?: () => void | Promise<void>;
};

export function OfflineSyncBanner({ onReconnect }: Props) {
  const { online, syncing, pendingCount, lastSyncedAt, lastError, retrySync } = useOfflineSync();
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;
  const prevPendingRef = useRef(pendingCount);
  const prevOnlineRef = useRef(online);

  useEffect(() => {
    if (!prevOnlineRef.current && online) {
      void onReconnectRef.current?.();
    }
    prevOnlineRef.current = online;
  }, [online]);

  useEffect(() => {
    if (prevPendingRef.current > 0 && pendingCount === 0 && online && lastSyncedAt) {
      void showSuccess("Back online", "Your saved uploads and changes have been synced.");
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount, online, lastSyncedAt]);

  if (online && pendingCount === 0 && !syncing && !lastError) {
    return null;
  }

  const tone = !online
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : syncing
      ? "border-[#0B3D91]/20 bg-[#0B3D91]/5 text-[#0B3D91]"
      : lastError
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const message = !online
    ? pendingCount > 0
      ? `You are offline. ${pendingCount} upload${pendingCount === 1 ? "" : "s"} or change${pendingCount === 1 ? "" : "s"} will sync when you reconnect.`
      : "You are offline. You can keep browsing saved content."
    : syncing
      ? `Syncing ${pendingCount} pending item${pendingCount === 1 ? "" : "s"}…`
      : lastError
        ? lastError
        : `${pendingCount} item${pendingCount === 1 ? "" : "s"} waiting to sync`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "mb-4 flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between",
        tone,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0" aria-hidden>
          {!online ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
            </svg>
          ) : syncing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
            </svg>
          )}
        </span>
        <div>
          <p className="font-semibold">{!online ? "Offline mode" : syncing ? "Syncing" : "Pending sync"}</p>
          <p className="mt-0.5 text-[13px] opacity-90">{message}</p>
        </div>
      </div>

      {online && (pendingCount > 0 || lastError) && !syncing ? (
        <button
          type="button"
          onClick={() => void retrySync()}
          className="shrink-0 rounded-xl bg-white/80 px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-black/5 transition hover:bg-white"
        >
          Retry sync
        </button>
      ) : null}
    </div>
  );
}
