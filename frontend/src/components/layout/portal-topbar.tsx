"use client";

import { ReactNode } from "react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TopbarUserMenu } from "@/components/layout/topbar-user-menu";
import type { AppRole } from "@/types/app";

type TopbarVariant = "admin" | "student" | "lecturer";

type Props = {
  role: AppRole;
  variant: TopbarVariant;
  roleBadge: string;
  searchPlaceholder: string;
  searchSlot?: ReactNode;
  fullName: string;
  subtitle: string;
  profileImage?: string | null;
  initials: string;
  profileHref: string;
  onNotificationCountChange?: (count: number) => void;
};

function StaticSearch({ placeholder, variant }: { placeholder: string; variant: TopbarVariant }) {
  const focusClass =
    variant === "admin"
      ? "focus:border-yellow-500/40 focus:bg-white focus:ring-2 focus:ring-yellow-500/15"
      : "focus:border-[#0B3D91]/30 focus:bg-white focus:ring-2 focus:ring-[#0B3D91]/10";

  return (
    <div className="relative flex-1 max-w-xl">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        type="search"
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none transition ${focusClass}`}
        aria-label="Search"
      />
    </div>
  );
}

function RoleBadge({ label, variant }: { label: string; variant: TopbarVariant }) {
  const className =
    variant === "admin"
      ? "hidden rounded-full bg-yellow-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-800 ring-1 ring-yellow-200 sm:inline"
      : variant === "student"
        ? "hidden rounded-full bg-[#0B3D91]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0B3D91] ring-1 ring-[#0B3D91]/15 sm:inline"
        : "hidden rounded-full bg-[#0B3D91]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0B3D91] ring-1 ring-[#FFC107]/40 sm:inline";

  return <span className={className}>{label}</span>;
}

export function PortalTopbar({
  role,
  variant,
  roleBadge,
  searchPlaceholder,
  searchSlot,
  fullName,
  subtitle,
  profileImage,
  initials,
  profileHref,
  onNotificationCountChange,
}: Props) {
  return (
    <header className="sticky top-0 z-20 hidden border-b border-slate-200/80 bg-white px-4 py-4 sm:px-6 lg:block">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {searchSlot ?? <StaticSearch placeholder={searchPlaceholder} variant={variant} />}

        <div className="flex items-center justify-end gap-3">
          <RoleBadge label={roleBadge} variant={variant} />
          <NotificationBell
            role={role}
            variant={variant}
            onCountChange={onNotificationCountChange}
          />
          <TopbarUserMenu
            role={role}
            variant={variant}
            fullName={fullName}
            subtitle={subtitle}
            profileImage={profileImage}
            initials={initials}
            profileHref={profileHref}
          />
        </div>
      </div>
    </header>
  );
}
