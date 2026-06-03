"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavigation, navigation } from "@/services/mock-data";
import { logout } from "@/services/auth";
import { AppRole, NavItem } from "@/types/app";
import { TransitLogo } from "@/components/brand/transit-logo";
import { MobileNavOverlay, MobileTopBar } from "@/components/layout/mobile-top-bar";

type AppShellProps = {
  role: AppRole;
  pageTitle: string;
  subtitle: string;
  children: React.ReactNode;
};

function NavLink({ item, active, nested }: { item: NavItem; active: boolean; nested?: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "flex items-center justify-between rounded-xl py-2 text-sm transition-colors",
        nested ? "px-3 pl-5" : "px-3",
        active ? "bg-sky-500 text-white shadow-sm" : "text-white/90 hover:bg-white/10",
      ].join(" ")}
    >
      <span className="font-medium">{item.label}</span>
      {!nested ? (
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 ${active ? "text-white/90" : "text-white/50"}`}
          fill="currentColor"
        >
          <path d="M7.5 5.5 12 10l-4.5 4.5" />
        </svg>
      ) : null}
    </Link>
  );
}

function NavItemWithChildren({ item, pathname }: { item: NavItem; pathname: string }) {
  const sectionBase = item.href.substring(0, item.href.lastIndexOf("/"));
  const isSection = pathname.startsWith(sectionBase);
  const isActive = pathname === item.href || isSection;
  const [open, setOpen] = useState(isSection);

  if (!item.children?.length) {
    return <NavLink item={item} active={pathname === item.href} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
          isActive ? "bg-sky-500 text-white shadow-sm" : "text-white/90 hover:bg-white/10",
        ].join(" ")}
      >
        <span className="font-medium">{item.label}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""} ${isActive ? "text-white/90" : "text-white/50"}`}
          fill="currentColor"
        >
          <path d="M7.5 5.5 12 10l-4.5 4.5" />
        </svg>
      </button>
      {open ? (
        <div className="mt-1 space-y-0.5 border-l border-white/15 pl-2 ml-2">
          {item.children.map((child) => (
            <NavLink key={child.href} item={child} active={pathname === child.href} nested />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ role, pageTitle, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = role === "admin" ? null : navigation[role];
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <MobileNavOverlay open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw,18rem)] flex-col border-r border-white/5 bg-[#0b3b8c] p-4 text-white shadow-xl transition-transform duration-200 lg:z-30 lg:w-72 lg:translate-x-0 lg:shadow-none",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
          <TransitLogo size="md" variant="light" subtitle={role === "lecturer" ? "Lecturer" : "E-Learning"} />
          <button
            type="button"
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <p className="mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-white/70">
          {role === "admin" ? "Admin Panel" : `${role} panel`}
        </p>

        <nav className="mt-3 space-y-4">
          {role === "admin" ? (
            <>
              <NavLink item={adminNavigation.dashboard} active={pathname === adminNavigation.dashboard.href} />
              {adminNavigation.categories.map((category) => (
                <div key={category.label}>
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                    {category.label}
                  </p>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <NavItemWithChildren key={item.href} item={item} pathname={pathname} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="space-y-1">
              {items?.map((item) => (
                <NavLink key={item.href} item={item} active={pathname === item.href} />
              ))}
            </div>
          )}
        </nav>

        <div className="mt-6 rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
          <p className="text-xs font-semibold">{role === "lecturer" ? "Lecturer" : "Admin User"}</p>
          <p className="text-xs text-white/70">{role === "lecturer" ? "Content Portal" : "Super Admin"}</p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#0b3b8c] hover:bg-white/90"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-1 flex-col lg:ml-72">
        <MobileTopBar onMenuClick={() => setMobileNavOpen(true)} />

        <header className="hidden rounded-2xl border-b border-slate-200/0 bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 lg:block">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{pageTitle}</p>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3 lg:max-w-xl">
              <div className="relative w-full max-w-md">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none ring-blue-500/20 focus:border-blue-300 focus:ring-4"
                  placeholder="Search for students, courses, lecturers..."
                  aria-label="Search"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Notifications"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-slate-900">User</p>
                  <p className="text-[11px] text-slate-500">{role === "lecturer" ? "Lecturer" : "Super Admin"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="safe-pb flex-1 px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
