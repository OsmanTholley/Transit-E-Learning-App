"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppRole } from "@/types/app";

type Notice = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
};

function viewAllHref(role: AppRole): string {
  if (role === "student") return "/student/notifications";
  if (role === "lecturer") return "/lecturer/notifications";
  return "/admin/notifications";
}

type Props = {
  role: AppRole;
  variant?: "student" | "admin" | "lecturer";
  onCountChange?: (count: number) => void;
};

export function NotificationBell({ role, variant = "student", onCountChange }: Props) {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) return;
      const list = (data.notifications ?? []) as Notice[];
      setNotices(list.slice(0, 6));
      const count = data.unreadCount ?? list.filter((n) => !n.isRead).length;
      setUnreadCount(count);
      onCountChange?.(count);
    } catch {
      /* ignore */
    }
  }, [onCountChange]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void load();
    });
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    void load();
  }

  const buttonClass =
    variant === "student"
      ? "relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
      : "relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50";

  const badgeClass =
    variant === "student"
      ? "absolute -right-0.5 -top-0.5 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-[#FFC107] px-0.5 text-[9px] font-bold text-[#0B3D91]"
      : "absolute -right-1 -top-1 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-yellow-500 px-0.5 text-[9px] font-bold text-[#003B8E] ring-2 ring-white";

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={buttonClass}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            setLoading(true);
            void load().finally(() => setLoading(false));
          }
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className={badgeClass}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                {unreadCount} new
              </span>
            ) : null}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading && notices.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
            ) : notices.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul>
                {notices.map((n) => (
                  <li key={n.id} className="border-b border-slate-50 last:border-0">
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${!n.isRead ? "bg-blue-50/50" : ""}`}
                      onClick={() => {
                        if (!n.isRead) void markRead(n.id);
                      }}
                    >
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.message}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{n.sentAt}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-slate-100 p-2">
            <Link
              href={viewAllHref(role)}
              className="block rounded-lg py-2 text-center text-xs font-semibold text-[#0B3D91] hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
