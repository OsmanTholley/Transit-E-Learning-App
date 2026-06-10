"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, Suspense, useEffect, useRef, useState } from "react";
import type { StudentSearchResult } from "@/lib/student-search";
import { TransitLogo } from "@/components/brand/transit-logo";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { LoadingSpinner } from "@/components/ui/loading-indicator";
import { PortalTopbar } from "@/components/layout/portal-topbar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { OfflineSyncBanner } from "@/components/layout/offline-sync-banner";
import { MobileNavOverlay, MobileTopBar } from "@/components/layout/mobile-top-bar";
import { useStudentSession } from "@/contexts/student-session-context";
import { useMobileNav } from "@/hooks/use-mobile-nav";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { requestApi } from "@/lib/fetch-api";
import { reportStudentError, studentError, studentWarning } from "@/lib/student-ui";
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
    case "chat":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "live":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="m10 9 6 4-6 4V9z" />
        </svg>
      );
    case "billing":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h2M10 15h4" />
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

const SEARCH_TYPE_LABELS: Record<StudentSearchResult["type"], string> = {
  course: "Course",
  note: "Note",
  video: "Video",
  quiz: "Quiz",
  assignment: "Assignment",
};

function StudentPortalErrorHandler() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      reportStudentError("Something went wrong", event.reason);
    };

    const onWindowError = (event: ErrorEvent) => {
      if (event.defaultPrevented) return;
      reportStudentError("Something went wrong", event.error ?? event.message);
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return null;
}

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading, refresh } = useStudentSession();
  const { online } = useOfflineSync();
  const profile = data?.profile;
  const sessionNotificationCount = data?.stats.newNotifications ?? 0;
  const [notificationOverride, setNotificationOverride] = useState<number | null>(null);
  const [notificationSource, setNotificationSource] = useState(sessionNotificationCount);
  const { mobileNavOpen, openMobileNav, closeMobileNav } = useMobileNav(pathname);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOffline, setSearchOffline] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notificationSource !== sessionNotificationCount) {
      setNotificationSource(sessionNotificationCount);
      setNotificationOverride(null);
    }
  }, [notificationSource, sessionNotificationCount]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchOffline(false);
      return;
    }

    if (!online) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchOffline(true);
      return;
    }

    setSearchLoading(true);
    setSearchOffline(false);
    const timer = window.setTimeout(async () => {
      const result = await requestApi<{ results?: StudentSearchResult[] }>(
        `/api/student/search?q=${encodeURIComponent(q)}`,
        {
          silent: true,
          errorTitle: "Search unavailable",
          onRecovered: () => {
            if (searchQuery.trim().length >= 2) {
              void loadSearch(searchQuery.trim());
            }
          },
        }
      );

      if (result.offline) {
        setSearchResults([]);
        setSearchOffline(true);
        setSearchLoading(false);
        return;
      }

      if (!result.ok) {
        setSearchResults([]);
        await studentError("Search failed", result.message);
      } else {
        setSearchResults(result.data.results ?? []);
      }
      setSearchLoading(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, online]);

  async function loadSearch(q: string) {
    setSearchLoading(true);
    const result = await requestApi<{ results?: StudentSearchResult[] }>(
      `/api/student/search?q=${encodeURIComponent(q)}`,
      { silent: true, errorTitle: "Search unavailable" }
    );

    if (result.offline) {
      setSearchResults([]);
      setSearchOffline(true);
    } else if (!result.ok) {
      setSearchResults([]);
      await studentError("Search failed", result.message);
    } else {
      setSearchResults(result.data.results ?? []);
      setSearchOffline(false);
    }
    setSearchLoading(false);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    if (!online) {
      void studentWarning("You are offline", "Search needs an internet connection.");
      return;
    }
    const first = searchResults[0];
    if (first) {
      setSearchOpen(false);
      router.push(first.href);
    }
  }

  const notificationCount = notificationOverride ?? sessionNotificationCount;

  const isFullscreenRoom = /^\/student\/live-classes\/[^/]+$/.test(pathname);
  if (isFullscreenRoom) {
    return <>{children}</>;
  }

  const onLogout = async () => {
    try {
      const result = await logout();
      if (result.offline) {
        await studentWarning("You are offline", "Logout will complete when you reconnect.");
        return;
      }
      if (!result.ok) {
        await studentError("Logout failed", result.message ?? "Please try again.");
        return;
      }
      router.push("/login");
    } catch (error) {
      reportStudentError("Logout failed", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6f9]">
      <StudentPortalErrorHandler />
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <MobileNavOverlay open={mobileNavOpen} onClose={closeMobileNav} />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw,18rem)] flex-col bg-[#0B3D91] text-white shadow-xl transition-transform duration-200 lg:z-30 lg:w-64 lg:translate-x-0 lg:shadow-none",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <TransitLogo size="md" variant="light" subtitle="Student" />
          <button
            type="button"
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
            onClick={closeMobileNav}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {studentNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-[#FFC107] text-[#0B3D91] shadow-sm" : "text-white/90 hover:bg-white/10",
                ].join(" ")}
              >
                <NavIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
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

      <div className="flex min-h-screen w-full flex-1 flex-col lg:ml-64">
        <MobileTopBar
          onMenuClick={openMobileNav}
          trailing={
            <NotificationBell
              role="student"
              variant="admin"
              onCountChange={setNotificationOverride}
            />
          }
        />
        <PortalTopbar
          role="student"
          variant="admin"
          roleBadge="Student"
          searchPlaceholder="Search for courses, notes, videos..."
          searchSlot={
            <div ref={searchRef} className="relative flex-1 max-w-2xl">
              <form onSubmit={handleSearchSubmit}>
                <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search for courses, notes, videos..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
                />
              </form>
              {searchOpen && searchQuery.trim().length >= 2 ? (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {searchLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3">
                      <LoadingSpinner size="sm" />
                      <p className="text-sm text-slate-500">Searching…</p>
                    </div>
                  ) : searchOffline ? (
                    <p className="px-4 py-3 text-sm text-amber-700">
                      Search is unavailable offline. Reconnect to find courses, notes, and videos.
                    </p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-500">No results found.</p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto py-1">
                      {searchResults.map((result) => (
                        <li key={`${result.type}-${result.id}`}>
                          <Link
                            href={result.href}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                          >
                            <span className="mt-0.5 rounded-full bg-[#0B3D91]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B3D91]">
                              {SEARCH_TYPE_LABELS[result.type]}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-900">
                                {result.title}
                              </span>
                              <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          }
          fullName={loading ? "Loading…" : (profile?.fullName ?? "Student")}
          subtitle={profile?.email ?? profile?.role ?? "Student"}
          profileImage={profile?.profileImage}
          initials={profile?.avatarInitials ?? "ST"}
          profileHref="/student/profile"
          onNotificationCountChange={setNotificationOverride}
        />

        <main className="safe-pb flex-1 px-4 py-4 sm:px-6 sm:py-6">
          <OfflineSyncBanner onReconnect={refresh} />
          {children}
        </main>
      </div>
    </div>
  );
}
