"use client";

import { motion } from "framer-motion";

export const LS_CONVERSATIONS = "transit.aiTutor.conversations.v1";
export const LS_SOLVED = "transit.aiTutor.solved.v1";
export const LS_PLANNER = "transit.aiTutor.planner.v1";

export function DashboardStat({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "blue" | "yellow" | "emerald" | "violet";
  icon: React.ReactNode;
}) {
  const toneCls =
    tone === "blue"
      ? "bg-[#0B3D91]/10 text-[#0B3D91]"
      : tone === "yellow"
        ? "bg-[#FFC107]/15 text-[#0B3D91]"
        : tone === "emerald"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-violet-50 text-violet-700";

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

export function SuggestionChip({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-[#FFC107]/20 hover:ring-[#FFC107]/50"
    >
      {children}
    </button>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mr-12 flex items-center gap-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-[#0B3D91]"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
        />
      ))}
      <span className="ml-2 text-xs text-slate-500">AI is thinking…</span>
    </motion.div>
  );
}

export function ChatBubble({ role, text }: { role: "user" | "ai"; text: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        "max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
        isUser ? "ml-auto bg-[#0B3D91] text-white" : "mr-auto bg-white text-slate-800 ring-1 ring-slate-200",
      ].join(" ")}
    >
      {text}
    </motion.div>
  );
}
