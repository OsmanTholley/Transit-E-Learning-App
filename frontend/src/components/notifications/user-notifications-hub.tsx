"use client";

import { useCallback, useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/swal";

type Notice = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  sentAt: string;
  expiresAt: string | null;
};

type Props = {
  title?: string;
  subtitle?: string;
};

export function UserNotificationsHub({
  title = "Notifications",
  subtitle = "Messages and updates from your institution.",
}: Props) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load notifications");
      setNotices(data.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadNotices();
    });
  }, [loadNotices]);

  async function markRead(id: string) {
    setMarkingId(id);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update notification");
      await loadNotices();
    } catch (err) {
      await showError("Update failed", err instanceof Error ? err.message : "Could not mark as read.");
    } finally {
      setMarkingId(null);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update notifications");
      await showSuccess("Done", data.message ?? "All notifications marked as read.");
      await loadNotices();
    } catch (err) {
      await showError("Update failed", err instanceof Error ? err.message : "Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  const unread = notices.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {unread > 0 ? (
          <button
            type="button"
            disabled={markingAll}
            onClick={() => void markAllRead()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0B3D91] shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {markingAll ? "Updating…" : "Mark all as read"}
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading notifications…</p>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : notices.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No notifications yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => {
            const expanded = expandedId === notice.id;
            return (
              <li
                key={notice.id}
                className={[
                  "rounded-2xl border bg-white p-4 shadow-sm transition",
                  notice.isRead ? "border-slate-200" : "border-[#0B3D91]/30 ring-1 ring-[#0B3D91]/10",
                ].join(" ")}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedId(expanded ? null : notice.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{notice.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{notice.sentAt}</p>
                    </div>
                    {!notice.isRead ? (
                      <span className="shrink-0 rounded-full bg-[#FFC107] px-2 py-0.5 text-[10px] font-bold text-[#0B3D91]">
                        New
                      </span>
                    ) : null}
                  </div>
                  {expanded ? (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{notice.message}</p>
                  ) : (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{notice.message}</p>
                  )}
                </button>
                {!notice.isRead ? (
                  <button
                    type="button"
                    disabled={markingId === notice.id}
                    onClick={() => void markRead(notice.id)}
                    className="mt-3 text-xs font-semibold text-[#0B3D91] hover:underline disabled:opacity-60"
                  >
                    {markingId === notice.id ? "Marking…" : "Mark as read"}
                  </button>
                ) : notice.expiresAt ? (
                  <p className="mt-2 text-[10px] text-slate-400">Removes after {notice.expiresAt}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
