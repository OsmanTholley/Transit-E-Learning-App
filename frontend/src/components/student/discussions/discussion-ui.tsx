"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { DiscussionSummary, QuestionStatus } from "@/types/student-discussions";

export const LS_LIKES = "transit.discussions.likes.v1";
export const LS_SAVED = "transit.discussions.saved.v1";

export function questionStatusStyles(status: QuestionStatus) {
  switch (status) {
    case "answered":
      return "bg-emerald-100 text-emerald-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "unanswered":
      return "bg-rose-100 text-rose-800";
  }
}

export function questionStatusLabel(status: QuestionStatus) {
  switch (status) {
    case "answered":
      return "Answered";
    case "pending":
      return "Pending";
    case "unanswered":
      return "Unanswered";
  }
}

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
  tone: "blue" | "yellow" | "emerald" | "rose";
  icon: React.ReactNode;
}) {
  const toneCls =
    tone === "blue"
      ? "bg-[#0B3D91]/10 text-[#0B3D91]"
      : tone === "yellow"
        ? "bg-[#FFC107]/15 text-[#0B3D91]"
        : tone === "emerald"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700";

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

export function DiscussionFilters({
  query,
  onQuery,
  course,
  courses,
  onCourse,
  sort,
  onSort,
}: {
  query: string;
  onQuery: (v: string) => void;
  course: string;
  courses: { id: string; code: string; title: string }[];
  onCourse: (v: string) => void;
  sort: string;
  onSort: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 md:grid-cols-12">
      <div className="md:col-span-6">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search discussions, courses, topics…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-11 pr-3 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
          />
        </div>
      </div>
      <div className="md:col-span-3">
        <select
          value={course}
          onChange={(e) => onCourse(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-3">
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        >
          <option value="latest">Latest activity</option>
          <option value="popular">Most popular</option>
          <option value="unanswered">Unanswered</option>
        </select>
      </div>
    </div>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function DiscussionCard({
  discussion,
  likeCount,
  isSaved,
  onLike,
  onSave,
}: {
  discussion: DiscussionSummary;
  likeCount: number;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
}) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B3D91]/10 text-sm font-extrabold text-[#0B3D91]">
          {discussion.authorInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{discussion.authorName}</p>
            {discussion.isOwn ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">You</span>
            ) : null}
            {discussion.courseCode ? (
              <span className="rounded-full bg-[#0B3D91]/10 px-2 py-0.5 text-[10px] font-bold text-[#0B3D91]">
                {discussion.courseCode}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">General</span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${questionStatusStyles(discussion.questionStatus)}`}
            >
              {questionStatusLabel(discussion.questionStatus)}
            </span>
          </div>
          <h3 className="mt-2 font-bold text-slate-900">{discussion.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{discussion.preview}</p>
          <p className="mt-2 text-xs text-slate-400">{formatRelative(discussion.createdAt)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onLike}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
        >
          ♥ {likeCount}
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
          💬 {discussion.replyCount} replies
        </span>
        <button
          type="button"
          onClick={onSave}
          className={[
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ring-1",
            isSaved
              ? "bg-[#FFC107] text-[#0B3D91] ring-[#FFC107]"
              : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
          ].join(" ")}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
        <Link
          href={`/student/discussions/thread/${discussion.id}`}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#0B3D91] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0B3D91]/90"
        >
          Open Discussion
        </Link>
      </div>
    </motion.article>
  );
}
