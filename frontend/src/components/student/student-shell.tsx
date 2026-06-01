"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { useStudentSession } from "@/contexts/student-session-context";
import { logout } from "@/services/auth";
import { studentNavItems } from "@/services/student-dashboard-data";

function NavIcon({ name }: { name: string }) {
  const cls = "h-5 w-5 shrink-0";
  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "courses":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "notes":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case "videos":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="m10 9 6 4-6 4V9z" />
        </svg>
      );
    case "live":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10l5-3v10l-5-3v-6z" />
          <rect x="2" y="6" width="13" height="12" rx="2" />
          <circle cx="8.5" cy="12" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "assignments":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "quizzes":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      );
    case "discussions":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "ai":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
          <path d="M9 14h6M10 18h4" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    default:
      return null;
  }
}

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading } = useStudentSession();
  const profile = data?.profile;
  const notificationCount = data?.stats.newNotifications ?? 0;
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => ({
    "/student/courses": pathname.startsWith("/student/courses"),
    "/student/lecture-notes": pathname.startsWith("/student/lecture-notes"),
    "/student/video-lessons": pathname.startsWith("/student/video-lessons"),
    "/student/quizzes": pathname.startsWith("/student/quizzes"),
    "/student/discussions": pathname.startsWith("/student/discussions"),
    "/student/ai-tutor": pathname.startsWith("/student/ai-tutor"),
  }));

  const toggleMenu = (href: string) => {
    setOpenMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6f9]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#0B3D91] text-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFC107]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#0B3D91]" fill="currentColor">
              <path d="M12 2 2 7l10 5 10-5-10-5zm0 8.5L4.5 7.5 12 4l7.5 3.5L12 10.5zm0 2.5 10 5v2l-10 5L2 20v-2l10-5z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">TRANSIT</p>
            <p className="text-[11px] font-semibold tracking-widest text-white/90">E-LEARNING</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {studentNavItems.map((item) => {
            const hasChildren = "children" in item && item.children;
            const menuOpen = openMenus[item.href] ?? false;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (hasChildren && item.children) {
              return (
                <div key={item.href} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.href)}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-[#FFC107] text-[#0B3D91] shadow-sm" : "text-white/90 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <NavIcon name={item.icon} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {menuOpen ? (
                    <div className="ml-3 space-y-0.5 border-l border-white/20 pl-2">
                      {item.children.map((child) => {
                        const isRoot =
                          child.href === "/student/courses" ||
                          child.href === "/student/lecture-notes" ||
                          child.href === "/student/video-lessons" ||
                          child.href === "/student/quizzes" ||
                          child.href === "/student/discussions" ||
                          child.href === "/student/ai-tutor";
                        const childActive = isRoot
                          ? pathname === child.href
                          : pathname === child.href || pathname.startsWith(`${child.href}/`);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={[
                              "block rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                              childActive
                                ? "bg-white/15 text-[#FFC107]"
                                : "text-white/75 hover:bg-white/10 hover:text-white",
                            ].join(" ")}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-[#FFC107] text-[#0B3D91] shadow-sm" : "text-white/90 hover:bg-white/10",
                ].join(" ")}
              >
                <NavIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
                {item.icon === "notifications" && notificationCount > 0 ? (
                  <span
                    className={[
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                      active ? "bg-[#0B3D91] text-[#FFC107]" : "bg-[#FFC107] text-[#0B3D91]",
                    ].join(" ")}
                  >
                    {notificationCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/15 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 transition-colors hover:bg-white/10 hover:text-rose-200"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f4f6f9]/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-2xl">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search for courses, notes, videos..."
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/student/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                aria-label="Notices"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFC107] text-[9px] font-bold text-[#0B3D91]">
                    {notificationCount}
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                aria-label="Messages"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <div className="flex items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                  <span className="text-xs font-bold text-[#0B3D91]">
                    {loading ? "…" : (profile?.avatarInitials ?? "ST")}
                  </span>
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    {loading ? "Loading…" : (profile?.fullName ?? "Student")}
                  </p>
                  <p className="text-xs text-slate-500">{profile?.role ?? "Student"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
