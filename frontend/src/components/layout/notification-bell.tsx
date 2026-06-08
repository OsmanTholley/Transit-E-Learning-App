"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSameAppPath,
  resolveNotificationTargetUrl,
} from "@/lib/notification-target-url";
import type { AppRole } from "@/types/app";

type Notice = {
  id: string;
  title: string;
  message: string;
  targetUrl: string | null;
  isRead: boolean;
  sentAt: string;
};

type NewStudentEntry = {
  id: string;
  fullName: string;
  course: string;
  enrolledAt: string;
};

type Props = {
  role: AppRole;
  variant?: "student" | "admin" | "lecturer";
  onCountChange?: (count: number) => void;
};

const INBOX_PATH: Record<AppRole, string> = {
  student: "/student/notifications",
  lecturer: "/lecturer/notifications",
  admin: "/admin/dashboard",
};

export function NotificationBell({ role, variant = "student", onCountChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [newStudents, setNewStudents] = useState<NewStudentEntry[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  const checkNewStudents = useCallback(async () => {
    if (role !== "lecturer") return;
    try {
      const res = await fetch("/api/lecturer/students", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const entries = (data.students ?? []) as NewStudentEntry[];

      if (firstLoadRef.current) {
        firstLoadRef.current = false;
        entries.forEach((s) => seenIdsRef.current.add(s.id));
        return;
      }

      const fresh = entries.filter((s) => !seenIdsRef.current.has(s.id));
      fresh.forEach((s) => seenIdsRef.current.add(s.id));
      if (fresh.length > 0) {
        setNewStudents((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const merged = [...prev, ...fresh.filter((s) => !existingIds.has(s.id))];
          return merged.slice(-10);
        });
      }
    } catch {
      /* ignore */
    }
  }, [role]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) return;
      const list = (data.notifications ?? []) as Notice[];
      setNotices(list.slice(0, 10));
      const count = data.unreadCount ?? list.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch {
      /* ignore */
    }
  }, []);

  // Notify parent of count changes AFTER render (never during render)
  useEffect(() => {
    onCountChange?.(unreadCount);
  }, [unreadCount, onCountChange]);

  useEffect(() => {
    Promise.resolve().then(() => { void load(); void checkNewStudents(); });
    const interval = setInterval(() => { void load(); void checkNewStudents(); }, 30_000);
    return () => clearInterval(interval);
  }, [load, checkNewStudents]);

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
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    // onCountChange will be called via the useEffect above once unreadCount settles
  }

  function openInbox() {
    setOpen(false);
    if (role === "student" || role === "lecturer") {
      router.push(INBOX_PATH[role]);
    }
  }

  function navigateToTarget(url: string) {
    if (isSameAppPath(pathname, url)) {
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push(url);
  }

  async function openNotice(notice: Notice) {
    if (!notice.isRead) {
      await markRead(notice.id);
    }
    setOpen(false);
    const target = resolveNotificationTargetUrl(role, notice);
    const inbox = INBOX_PATH[role];
    const isAdminMessage =
      target === inbox ||
      notice.targetUrl === inbox ||
      /message|notice|announcement/i.test(notice.title);
    if (isAdminMessage && (role === "student" || role === "lecturer")) {
      router.push(`${inbox}?id=${notice.id}`);
      return;
    }
    navigateToTarget(target);
  }

  function openNewStudent(student: NewStudentEntry) {
    setDismissedIds((prev) => new Set([...prev, student.id]));
    setOpen(false);
    router.push("/lecturer/students");
  }

  const activeNewStudents = newStudents.filter((s) => !dismissedIds.has(s.id));
  const totalBadge = unreadCount + activeNewStudents.length;

  const buttonClass =
    "relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50";

  const badgeClass =
    "absolute -right-1 -top-1 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-yellow-500 px-0.5 text-[9px] font-bold text-[#003B8E] ring-2 ring-white";

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
        {totalBadge > 0 ? (
          <span className={badgeClass}>{totalBadge > 9 ? "9+" : totalBadge}</span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            {totalBadge > 0 ? (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                {totalBadge} new
              </span>
            ) : null}
          </div>

          {activeNewStudents.length > 0 && (
            <div>
              <div
                className="px-4 py-2"
                style={{ background: "linear-gradient(90deg,#0B3D91,#082d6e)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#FFC107" }}>
                  New student assignments
                </p>
              </div>
              <ul>
                {activeNewStudents.map((s) => (
                  <li key={s.id} className="border-b border-amber-50 last:border-0" style={{ background: "#fffbea" }}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-amber-50/80"
                      onClick={() => openNewStudent(s)}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: "#FFC107", color: "#0B3D91" }}
                      >
                        {s.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{s.fullName}</p>
                        <p className="line-clamp-1 text-xs text-slate-600">Enrolled in {s.course}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {new Date(s.enrolledAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {loading && notices.length === 0 ? (
              <LoadingState message="Loading…" layout="compact" />
            ) : notices.length === 0 ? (
              <p className="px-4 py-4 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul>
                {notices.map((n) => (
                  <li key={n.id} className="border-b border-slate-50 last:border-0">
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${!n.isRead ? "bg-blue-50/50" : ""}`}
                      onClick={() => void openNotice(n)}
                    >
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.message}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-[10px] text-slate-400">{n.sentAt}</p>
                        <span className="text-[10px] font-semibold text-[#0B3D91]">Open →</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(role === "student" || role === "lecturer") && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={openInbox}
                className="w-full rounded-lg bg-[#0B3D91] px-3 py-2 text-xs font-bold text-white hover:bg-[#0a3580]"
              >
                Open Messages inbox
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
