"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";
import { TransitLogo } from "@/components/brand/transit-logo";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { OfflineSyncBanner } from "@/components/layout/offline-sync-banner";
import { PortalTopbar } from "@/components/layout/portal-topbar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileNavOverlay, MobileTopBar } from "@/components/layout/mobile-top-bar";
import { avatarInitials } from "@/lib/user-profile-helpers";
import { logout } from "@/services/auth";
import { lecturerNavItems } from "@/services/lecturer-dashboard-data";
import { useMobileNav } from "@/hooks/use-mobile-nav";

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
    case "quizzes":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      );
    case "assignments":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "students":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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
    case "profile":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}

type Props = {
  lecturerName: string;
  lecturerEmail: string;
  profileImage?: string | null;
  children: ReactNode;
};

export function LecturerShell({ lecturerName, lecturerEmail, profileImage, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileNavOpen, openMobileNav, closeMobileNav } = useMobileNav(pathname);
  const initials = avatarInitials(lecturerName);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications", { credentials: "include" });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setNotificationCount(data.unreadCount ?? 0);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isFullscreenRoom = /^\/lecturer\/live-classes\/[^/]+$/.test(pathname);
  if (isFullscreenRoom) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <MobileNavOverlay open={mobileNavOpen} onClose={closeMobileNav} />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw,17.5rem)] flex-col border-r border-white/5 bg-[#0B3D91] text-white shadow-xl transition-transform duration-200 lg:z-30 lg:translate-x-0 lg:shadow-none",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-5">
          <TransitLogo size="md" variant="light" subtitle="Lecturer" />
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {lecturerNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#FFC107] text-[#0B3D91] shadow-md shadow-yellow-900/30"
                    : "text-white/90 hover:bg-white/10",
                ].join(" ")}
              >
                <NavIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-1 flex-col lg:ml-[17.5rem]">
        <MobileTopBar
          onMenuClick={openMobileNav}
          trailing={
            <NotificationBell
              role="lecturer"
              variant="admin"
              onCountChange={setNotificationCount}
            />
          }
        />
        <PortalTopbar
          role="lecturer"
          variant="admin"
          roleBadge="Lecturer"
          searchPlaceholder="Search courses, materials, students..."
          fullName={lecturerName}
          subtitle={lecturerEmail || "Lecturer"}
          profileImage={profileImage}
          initials={initials}
          profileHref="/lecturer/profile"
          onNotificationCountChange={setNotificationCount}
        />
        <main className="safe-pb flex-1 px-4 py-4 sm:px-6 sm:py-6">
          <OfflineSyncBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
