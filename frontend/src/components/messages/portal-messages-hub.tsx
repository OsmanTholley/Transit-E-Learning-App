"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingState } from "@/components/ui/loading-indicator";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import {
  isSameAppPath,
  resolveNotificationTargetUrl,
} from "@/lib/notification-target-url";
import type { AppRole } from "@/types/app";

export type PortalNotice = {
  id: string;
  title: string;
  message: string;
  targetUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  sentAt: string;
  expiresAt: string | null;
};

type Props = {
  role: AppRole;
  title?: string;
  subtitle?: string;
  onUnreadChange?: (count: number) => void;
};

function NoticeIcon({ read }: { read: boolean }) {
  return (
    <span
      className={[
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        read ? "bg-slate-100 text-slate-500" : "bg-[#0B3D91]/10 text-[#0B3D91]",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        <path d="M22 6l-10 7L2 6" />
      </svg>
    </span>
  );
}

export function PortalMessagesHub({
  role,
  title = "Notifications",
  subtitle = "Official announcements and updates from your institution.",
  onUnreadChange,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("id");

  const [notices, setNotices] = useState<PortalNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotices = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load messages");
      const list = (data.notifications ?? []) as PortalNotice[];
      setNotices(list);
      const unread = data.unreadCount ?? list.filter((n) => !n.isRead).length;
      onUnreadChange?.(unread);
      return list;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    scheduleEffectWork(() => loadNotices());
  }, [loadNotices]);

  const unreadCount = notices.filter((n) => !n.isRead).length;

  async function markRead(id: string, reload = true) {
    setMarkingId(id);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return;
      setNotices((prev) => {
        const next = prev.map((n) =>
          n.id === id
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
            : n
        );
        onUnreadChange?.(next.filter((n) => !n.isRead).length);
        return next;
      });
      if (reload) await loadNotices();
    } finally {
      setMarkingId(null);
    }
  }

  const selected = useMemo(
    () => notices.find((n) => n.id === selectedId) ?? null,
    [notices, selectedId]
  );

  useEffect(() => {
    if (!deepLinkId || notices.length === 0) return;
    const match = notices.find((n) => n.id === deepLinkId);
    if (match) {
      scheduleEffectWork(() => {
        setSelectedId(match.id);
        if (!match.isRead) void markRead(match.id, false);
      });
    }
  }, [deepLinkId, notices]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) return;
      await loadNotices();
    } finally {
      setMarkingAll(false);
    }
  }

  async function deleteNotice(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return;
      setNotices((prev) => {
        const next = prev.filter((n) => n.id !== id);
        onUnreadChange?.(next.filter((n) => !n.isRead).length);
        return next;
      });
      if (selectedId === id) setSelectedId(null);
    } finally {
      setDeletingId(null);
    }
  }

  function openLinkedResource(notice: PortalNotice) {
    const url = resolveNotificationTargetUrl(role, notice);
    if (typeof window !== "undefined" && isSameAppPath(window.location.pathname, url)) {
      router.refresh();
      return;
    }
    router.push(url);
  }

  async function selectNotice(notice: PortalNotice) {
    setSelectedId(notice.id);
    if (!notice.isRead) await markRead(notice.id, false);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0B3D91] via-[#0a3580] to-[#072d6b] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#FFC107]">Inbox</p>
            <h1 className="mt-1 text-2xl font-bold">{title}</h1>
            {/* <p className="mt-2 max-w-2xl text-sm text-blue-100">{subtitle}</p> */}
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={markingAll}
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/25 disabled:opacity-60"
            >
              {markingAll ? "Updating…" : `Mark all read (${unreadCount})`}
            </button>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-xs text-blue-200">Total messages</p>
            <p className="text-xl font-bold">{notices.length}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-xs text-blue-200">Unread</p>
            <p className="text-xl font-bold text-[#FFC107]">{unreadCount}</p>
          </div>
          {/* <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-xs text-blue-200">Retention</p>
            <p className="text-sm font-medium">Read messages auto-remove after 24h</p>
          </div> */}
        </div>
      </section>

      {loading ? (
        <LoadingState message="Loading your messages…" panel minHeight={240} />
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : notices.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-800">Your inbox is clear</p>
          {/* <p className="mt-2 text-sm text-slate-500">
            When administrators send notices, they will appear here and in your notification bell.
          </p> */}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <aside className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Message list</p>
              </div>
              <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
                {notices.map((notice) => {
                  const active = selectedId === notice.id;
                  return (
                    <li key={notice.id}>
                      <button
                        type="button"
                        onClick={() => void selectNotice(notice)}
                        className={[
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition",
                          active ? "bg-[#0B3D91]/5" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <NoticeIcon read={notice.isRead} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">{notice.title}</span>
                            {!notice.isRead ? (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#FFC107]" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">{notice.sentAt}</span>
                          <span className="mt-1 line-clamp-2 block text-xs text-slate-600">{notice.message}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <section className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.article
                  key={selected.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80"
                >
                  <header className="border-b border-slate-100 px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#0B3D91]">
                          {selected.isRead ? "Read message" : "New message"}
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-slate-900">{selected.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">Received {selected.sentAt}</p>
                      </div>
                      {!selected.isRead ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          Unread
                        </span>
                      ) : null}
                    </div>
                  </header>
                  <div className="px-6 py-5">
                    <div className="rounded-xl bg-slate-50 p-5 ring-1 ring-slate-100">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {selected.message}
                      </p>
                    </div>
                    {selected.isRead && selected.expiresAt ? (
                      <p className="mt-3 text-xs text-slate-500">
                        This message will be removed from your inbox after {selected.expiresAt}.
                      </p>
                    ) : null}
                  </div>
                  <footer className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-6 py-4">
                    {selected.targetUrl &&
                    !["/student/dashboard", "/lecturer/dashboard"].includes(selected.targetUrl) ? (
                      <button
                        type="button"
                        onClick={() => openLinkedResource(selected)}
                        className="rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a3580]"
                      >
                        Open linked resource
                      </button>
                    ) : null}
                    {!selected.isRead ? (
                      <button
                        type="button"
                        disabled={markingId === selected.id}
                        onClick={() => void markRead(selected.id)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0B3D91] hover:bg-slate-50 disabled:opacity-60"
                      >
                        {markingId === selected.id ? "Marking…" : "Mark as read"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={deletingId === selected.id}
                        onClick={() => void deleteNotice(selected.id)}
                        className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                      >
                        {deletingId === selected.id ? "Removing…" : "Remove from inbox"}
                      </button>
                    )}
                  </footer>
                </motion.article>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex min-h-[20rem] items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/80"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Select a message to read</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Unread messages are highlighted. After reading, you may remove them from your inbox.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      )}
    </div>
  );
}
