"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { AppRole } from "@/types/app";

type Props = {
  role: AppRole;
  fullName: string;
  subtitle: string;
  profileImage?: string | null;
  initials: string;
  profileHref: string;
  variant?: "student" | "admin" | "lecturer";
  compact?: boolean;
};

export function TopbarUserMenu({
  fullName,
  subtitle,
  profileImage,
  initials,
  profileHref,
  variant = "student",
  compact = false,
}: Props) {
  const wrapperClass = compact
    ? "inline-flex rounded-full ring-1 ring-slate-200 transition hover:ring-[#FFC107]/60"
    : variant === "student"
      ? "flex items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-[#FFC107]/60"
      : "flex items-center gap-3 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm transition hover:border-yellow-300 hover:shadow-md";

  return (
    <Link href={profileHref} className={wrapperClass} aria-label={`Profile — ${fullName}`}>
      <UserAvatar
        fullName={fullName}
        profileImage={profileImage}
        initials={initials}
        size="sm"
        className={variant === "admin" && !compact ? "!rounded-lg" : undefined}
      />
      {!compact ? (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">{fullName}</p>
          <p className={`text-xs text-slate-500 ${variant === "admin" ? "max-w-[140px] truncate" : ""}`}>
            {subtitle}
          </p>
        </div>
      ) : null}
    </Link>
  );
}
