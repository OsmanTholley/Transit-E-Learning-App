import type { ReactNode } from "react";
import Link from "next/link";
import { StatIcon, type StatIconName } from "@/components/ui/stat-icon";

export type DashboardStatTone =
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "teal"
  | "indigo"
  | "slate";

const toneStyles: Record<
  DashboardStatTone,
  { card: string; icon: string; accent: string }
> = {
  blue: {
    card: "from-blue-50/80 to-white",
    icon: "bg-gradient-to-br from-blue-500 to-[#0B3D91] text-white shadow-blue-500/30",
    accent: "text-blue-600",
  },
  emerald: {
    card: "from-emerald-50/80 to-white",
    icon: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30",
    accent: "text-emerald-600",
  },
  amber: {
    card: "from-yellow-50/80 to-white",
    icon: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-[#003B8E] shadow-yellow-500/40",
    accent: "text-yellow-700",
  },
  rose: {
    card: "from-rose-50/80 to-white",
    icon: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/30",
    accent: "text-rose-600",
  },
  violet: {
    card: "from-violet-50/80 to-white",
    icon: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/30",
    accent: "text-violet-600",
  },
  teal: {
    card: "from-teal-50/80 to-white",
    icon: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-teal-500/30",
    accent: "text-teal-600",
  },
  indigo: {
    card: "from-indigo-50/80 to-white",
    icon: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/30",
    accent: "text-indigo-600",
  },
  slate: {
    card: "from-slate-50/80 to-white",
    icon: "bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-slate-500/30",
    accent: "text-slate-600",
  },
};

export function DashboardStatCard({
  label,
  value,
  subtitle,
  tone = "blue",
  icon = "default",
  href,
  children,
  className = "",
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: DashboardStatTone;
  icon?: StatIconName;
  href?: string;
  children?: ReactNode;
  className?: string;
}) {
  const t = toneStyles[tone];

  const inner = (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br p-4 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-[#0B3D91]/10",
        t.card,
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC107]/10 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${t.icon}`}
        >
          {children ?? <StatIcon name={icon} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
            {value}
          </p>
          {subtitle ? (
            <p className={`mt-1 text-xs font-medium ${t.accent}`}>{subtitle}</p>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function DashboardStatsGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
}) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }[columns];

  return <div className={`grid grid-cols-1 gap-4 ${colClass}`}>{children}</div>;
}
