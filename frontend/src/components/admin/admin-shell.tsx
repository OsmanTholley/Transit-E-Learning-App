"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, Suspense, useState } from "react";
import { TransitLogo } from "@/components/brand/transit-logo";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { OfflineSyncBanner } from "@/components/layout/offline-sync-banner";
import { PortalTopbar } from "@/components/layout/portal-topbar";
import { MobileNavOverlay, MobileTopBar } from "@/components/layout/mobile-top-bar";
import { avatarInitials } from "@/lib/user-profile-helpers";
import { logout } from "@/services/auth";
import { adminNavSections } from "@/services/admin-dashboard-data";
import { useMobileNav } from "@/hooks/use-mobile-nav";

function sectionBaseHref(href: string) {
  if (href.includes("/content/")) return "/admin/content";
  if (href.endsWith("/all")) return href.replace(/\/all$/, "");
  const parts = href.split("/").filter(Boolean);
  if (parts.length >= 2) return `/${parts[0]}/${parts[1]}`;
  return href;
}

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
    case "students":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "lecturers":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "departments":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
        </svg>
      );
    case "programs":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case "courses":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "content":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
        </svg>
      );
    case "ai":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
          <path d="M9 14h6M10 18h4" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
        </svg>
      );
    case "finance":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h2M10 15h4" />
        </svg>
      );
    case "live":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="m10 9 6 4-6 4V9z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2" />
        </svg>
      );
  }
}

type Props = {
  adminName: string;
  adminEmail: string;
  profileImage?: string | null;
  children: ReactNode;
};

export function AdminShell({ adminName, adminEmail, profileImage, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of adminNavSections) {
      if (section.type !== "link" || !section.item.children?.length) continue;
      const base = sectionBaseHref(section.item.href);
      initial[section.item.href] = pathname === section.item.href || pathname.startsWith(`${base}/`);
    }
    return initial;
  });

  const { mobileNavOpen, openMobileNav, closeMobileNav } = useMobileNav(pathname);

  const initials = avatarInitials(adminName);

  const toggleMenu = (href: string) => {
    setOpenMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isFullscreenRoom = /^\/admin\/live-classes\/[^/]+$/.test(pathname);
  if (isFullscreenRoom) {
    return <>{children}</>;
  }

  const isItemActive = (href: string, hasChildren: boolean) => {
    if (pathname === href) return true;
    if (hasChildren) {
      const base = sectionBaseHref(href);
      return pathname.startsWith(`${base}/`) || pathname === base;
    }
    return pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <MobileNavOverlay open={mobileNavOpen} onClose={closeMobileNav} />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw,17.5rem)] flex-col border-r border-white/5 bg-[#003B8E] text-white shadow-xl transition-transform duration-200 lg:z-30 lg:translate-x-0 lg:shadow-none",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-5">
          <TransitLogo size="md" variant="light" subtitle="Admin" />
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
          {adminNavSections.map((section, idx) => {
            if (section.type === "heading") {
              return (
                <p
                  key={`heading-${section.label}-${idx}`}
                  className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 first:mt-0"
                >
                  {section.label}
                </p>
              );
            }

            const { item } = section;
            const hasChildren = Boolean(item.children?.length);
            const menuOpen = openMenus[item.href] ?? false;
            const active = isItemActive(item.href, hasChildren);

            if (hasChildren && item.children) {
              return (
                <div key={item.href} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.href)}
                    className={[
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                      ? "bg-yellow-500 text-[#003B8E] shadow-md shadow-yellow-900/30"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                    ].join(" ")}
                  >
                    <NavIcon name={item.icon} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 text-slate-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {menuOpen ? (
                    <div className="ml-2 space-y-0.5 border-l border-white/10 pl-2">
                      {item.children.map((child) => {
                        const childActive =
                          pathname === child.href || pathname.startsWith(`${child.href}/`);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={[
                              "block rounded-md px-3 py-2 text-xs font-medium transition-colors",
                              childActive
                              ? "bg-yellow-500/10 text-[#003B8E] border border-yellow-500/20"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-yellow-500 text-[#003B8E] shadow-md shadow-yellow-900/40"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
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
        <MobileTopBar onMenuClick={openMobileNav} />
        <PortalTopbar
          role="admin"
          variant="admin"
          roleBadge="Administrator"
          searchPlaceholder="Search students, lecturers, courses..."
          fullName={adminName}
          subtitle={adminEmail || "Administrator"}
          profileImage={profileImage}
          initials={initials}
          profileHref="/admin/profile"
        />

        <main className="safe-pb flex-1 px-4 py-4 sm:px-6 sm:py-6">
          <OfflineSyncBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

     