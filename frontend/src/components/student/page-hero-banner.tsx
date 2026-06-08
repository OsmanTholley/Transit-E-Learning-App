"use client";

import type { ReactNode } from "react";

type Tone = "blue" | "teal" | "amber" | "violet" | "rose" | "emerald";

const toneStyles: Record<
  Tone,
  { gradient: string; icon: string; badge: string; dot: string; circle: string }
> = {
  blue: {
    gradient: "from-blue-50 to-indigo-50",
    icon: "bg-[#0B3D91]/10 text-[#0B3D91]",
    badge: "bg-[#0B3D91] text-white",
    dot: "bg-blue-500",
    circle: "bg-blue-100/60",
  },
  teal: {
    gradient: "from-teal-50 to-sky-50",
    icon: "bg-teal-600/10 text-teal-700",
    badge: "bg-teal-600 text-white",
    dot: "bg-teal-500",
    circle: "bg-teal-100/60",
  },
  amber: {
    gradient: "from-amber-50 to-yellow-50",
    icon: "bg-amber-500/10 text-amber-600",
    badge: "bg-amber-500 text-white",
    dot: "bg-amber-400",
    circle: "bg-amber-100/60",
  },
  violet: {
    gradient: "from-violet-50 to-purple-50",
    icon: "bg-violet-600/10 text-violet-700",
    badge: "bg-violet-600 text-white",
    dot: "bg-violet-500",
    circle: "bg-violet-100/60",
  },
  rose: {
    gradient: "from-rose-50 to-pink-50",
    icon: "bg-rose-500/10 text-rose-600",
    badge: "bg-rose-500 text-white",
    dot: "bg-rose-400",
    circle: "bg-rose-100/60",
  },
  emerald: {
    gradient: "from-emerald-50 to-teal-50",
    icon: "bg-emerald-600/10 text-emerald-700",
    badge: "bg-emerald-600 text-white",
    dot: "bg-emerald-500",
    circle: "bg-emerald-100/60",
  },
};

export function PageHeroBanner({
  icon,
  title,
  subtitle,
  badge,
  action,
  tone = "blue",
}: {
  /** SVG element or emoji string to render in the icon circle */
  icon: ReactNode;
  title: string;
  subtitle: string;
  /** Optional small pill label (e.g. "AI Powered", "Live") */
  badge?: string;
  /** Optional right-aligned action element (button / link) */
  action?: ReactNode;
  tone?: Tone;
}) {
  const s = toneStyles[tone];

  return (
    <section className="portal-card relative overflow-hidden p-6 md:p-8">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -right-12 -top-12 h-48 w-48 rounded-full ${s.circle} blur-2xl`}
        />
        <div
          className={`absolute bottom-0 right-24 h-3 w-3 rounded-full ${s.dot}`}
        />
        <div
          className={`absolute right-40 top-6 h-2 w-2 rounded-full ${s.dot} opacity-50`}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className={`flex items-start gap-4 rounded-2xl bg-gradient-to-r ${s.gradient} p-5 ring-1 ring-black/[0.04] flex-1`}>
          {/* Icon */}
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.icon} text-xl font-bold`}
          >
            {icon}
          </div>

          {/* Text */}
          <div className="min-w-0">
            {badge ? (
              <span
                className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.badge}`}
              >
                {badge}
              </span>
            ) : null}
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Optional action slot */}
        {action ? (
          <div className="shrink-0 sm:pt-1">{action}</div>
        ) : null}
      </div>
    </section>
  );
}
