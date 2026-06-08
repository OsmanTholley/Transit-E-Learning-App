"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const LS_CONVERSATIONS = "transit.aiTutor.conversations.v1";
export const LS_SOLVED        = "transit.aiTutor.solved.v1";
export const LS_PLANNER       = "transit.aiTutor.planner.v1";

/* ── Stat card (used in hub overview) ──────────────────────────── */
export function DashboardStat({
  label, value, sub, tone, icon,
}: {
  label: string; value: string; sub: string;
  tone: "blue" | "yellow" | "emerald" | "violet";
  icon: ReactNode;
}) {
  const toneCls =
    tone === "blue"    ? "bg-[#0B3D91]/10 text-[#0B3D91]" :
    tone === "yellow"  ? "bg-[#FFC107]/15 text-[#0B3D91]" :
    tone === "emerald" ? "bg-emerald-50 text-emerald-700"  :
                         "bg-violet-50 text-violet-700";
  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneCls}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </article>
  );
}

/* ── Suggestion chip ────────────────────────────────────────────── */
export function SuggestionChip({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition-all hover:border-[#0B3D91]/30 hover:bg-[#0B3D91]/5 hover:shadow-md"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0B3D91]/10 text-[#0B3D91] text-xs">→</span>
      <span className="leading-snug">{children}</span>
    </button>
  );
}

/* ── Typing indicator ───────────────────────────────────────────── */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      {/* AI avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-[#0B3D91] text-[10px] font-extrabold text-white shadow-sm">
        AI
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-slate-400"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Chat bubble ─────────────────────────────────────────────────── */
export function ChatBubble({
  role, text, initials,
}: {
  role: "user" | "ai";
  text: string;
  initials?: string;
}) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 shadow-sm">
          {initials ?? "ME"}
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-[#0B3D91] text-[10px] font-extrabold text-white shadow-sm">
          AI
        </div>
      )}

      {/* Bubble */}
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
          isUser
            ? "rounded-tr-sm bg-[#0B3D91] text-white"
            : "rounded-tl-sm bg-white text-slate-800 ring-1 ring-slate-200/80",
        ].join(" ")}
      >
        {text}
      </div>
    </motion.div>
  );
}
