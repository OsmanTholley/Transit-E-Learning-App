"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { LoadingGrid as SharedLoadingGrid } from "@/components/ui/loading-indicator";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
      style={{
        background: "linear-gradient(135deg, #0B3D91 0%, #154ebd 100%)",
      }}
    >
      {/* Yellow accent stripe at top */}
      <div className="absolute left-0 right-0 top-0 h-1" style={{ background: "#FFC107" }} />
      {/* Background glass blobs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#FFC107]/10 blur-xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm font-medium text-white/85">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

export function StatOverviewCard({
  label,
  value,
  sub,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  sub: string;
  tone?: "blue" | "yellow" | "green" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone].split(" ")[1]}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </motion.article>
  );
}

export function SearchFilterBar({
  search,
  onSearchChange,
  placeholder = "Search...",
  filters,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  filters?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0B3D91]/40 focus:ring-2 focus:ring-[#0B3D91]/10"
        />
      </div>
      {filters}
    </div>
  );
}

export function ProgressRing({ percent, size = 88 }: { percent: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FFC107"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-bold text-[#0B3D91]">{percent}%</span>
    </div>
  );
}

export function PrimaryButton({
  children,
  href,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
    disabled ? "cursor-not-allowed opacity-60 hover:bg-[#0B3D91]" : "hover:bg-[#092d6b]"
  } ${className}`;
  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        aria-disabled={disabled}
        onClick={(e) => {
          if (!disabled) return;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200/80">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B3D91]/10 text-[#0B3D91]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function LoadingGrid() {
  return <SharedLoadingGrid />;
}
