"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useStudentSession } from "@/contexts/student-session-context";
import { PageHeader } from "@/components/student/courses/ui/course-ui";

type Notice = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  sentAt: string;
  expiresAt: string | null;
};

export function StudentNotificationsHub() {
  const { refresh: refreshSession } = useStudentSession();
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
      if (!res.ok) throw new Error(data.error ?? "Failed to load notices");
      setNotices(data.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications", { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Failed to load notices");
        setNotices(data.notifications ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load notices.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleOpenNotice(notice: Notice) {
    setExpandedId((prev) => (prev === notice.id ? null : notice.id));

    if (notice.isRead) return;

    setMarkingId(notice.id);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to mark as read");

      setNotices((prev) =>
        prev.map((n) =>
          n.id === notice.id
            ? {
                ...n,
                isRead: true,
                readAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : n,
        ),
      );
      await refreshSession();
    } catch {
      /* keep notice visible; user can retry */
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to mark all as read");
      }
      await loadNotices();
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notices.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notices"
        subtitle="Messages from your department and administrators. Read notices are removed automatically after 24 hours."
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={markingAll}
              className="rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0a3580] disabled:opacity-60"
            >
              {markingAll ? "Updating…" : "Mark all as read"}
            </button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total notices</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{notices.length}</p>
        </article>
        <article className="rounded-2xl border-l-4 border-l-amber-500 bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unread</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{unreadCount}</p>
        </article>
        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Retention</p>
          <p className="mt-2 text-sm font-medium text-slate-700">Read notices expire in 24 hours</p>
        </article>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/80">
          Loading notices…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : notices.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200/80">
          <p className="text-lg font-semibold text-slate-800">No notices</p>
          <p className="mt-2 text-sm text-slate-500">
            When administrators send you a message, it will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notices.map((notice, index) => {
            const isExpanded = expandedId === notice.id;
            return (
              <motion.li
                key={notice.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <article
                  className={[
                    "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition",
                    notice.isRead ? "ring-slate-200/80" : "ring-[#0B3D91]/25 ring-2",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => void handleOpenNotice(notice)}
                    disabled={markingId === notice.id}
                    className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-slate-50/80"
                  >
                    <span
                      className={[
                        "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        notice.isRead ? "bg-slate-100 text-slate-500" : "bg-[#0B3D91]/10 text-[#0B3D91]",
                      ].join(" ")}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{notice.title}</span>
                        {!notice.isRead ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                            New
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{notice.sentAt}</span>
                      {!isExpanded && notice.message ? (
                        <span className="mt-2 line-clamp-2 block text-sm text-slate-600">{notice.message}</span>
                      ) : null}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className={[
                        "h-5 w-5 shrink-0 text-slate-400 transition",
                        isExpanded ? "rotate-180" : "",
                      ].join(" ")}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isExpanded ? (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{notice.message}</p>
                      {notice.isRead && notice.expiresAt ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Read — removed from your inbox after {notice.expiresAt}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
