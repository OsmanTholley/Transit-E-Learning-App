"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { QuizStatus, StudentQuizSummary } from "@/types/student-quizzes";

export function statusStyles(status: QuizStatus) {
  switch (status) {
    case "upcoming":
      return "bg-sky-100 text-sky-800";
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "in-progress":
      return "bg-amber-100 text-amber-800";
    case "completed":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function statusLabel(status: QuizStatus) {
  switch (status) {
    case "in-progress":
      return "In Progress";
    case "upcoming":
      return "Upcoming";
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    default:
      return status;
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
  tone: "blue" | "yellow" | "emerald" | "slate";
  icon: React.ReactNode;
}) {
  const toneCls =
    tone === "blue"
      ? "bg-[#0B3D91]/10 text-[#0B3D91]"
      : tone === "yellow"
        ? "bg-[#FFC107]/15 text-[#0B3D91]"
        : tone === "emerald"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-700";

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

export function QuizFilters({
  query,
  onQuery,
  course,
  courses,
  onCourse,
  status,
  onStatus,
  scoreRange,
  onScoreRange,
}: {
  query: string;
  onQuery: (v: string) => void;
  course: string;
  courses: { code: string; title: string }[];
  onCourse: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  scoreRange: string;
  onScoreRange: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 md:grid-cols-12">
      <div className="md:col-span-5">
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
            placeholder="Search quizzes, courses, lecturers…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-3 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
          />
        </div>
      </div>
      <div className="md:col-span-3">
        <select
          value={course}
          onChange={(e) => onCourse(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <select
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        >
          <option value="">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <select
          value={scoreRange}
          onChange={(e) => onScoreRange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        >
          <option value="">Any score</option>
          <option value="pass">Pass (≥50%)</option>
          <option value="excellent">Excellent (≥80%)</option>
          <option value="none">Not attempted</option>
        </select>
      </div>
    </div>
  );
}

export function QuizCard({
  quiz,
  dueLabel,
}: {
  quiz: StudentQuizSummary;
  dueLabel?: string;
}) {
  const canStart = quiz.status !== "completed" && quiz.questionCount > 0;
  const href = canStart
    ? `/student/quizzes/quiz/${quiz.id}`
    : `/student/quizzes/review/${quiz.id}`;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80"
    >
      <div className="bg-gradient-to-r from-[#0B3D91] to-[#0B3D91]/85 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#FFC107]">{quiz.courseCode}</p>
            <h3 className="mt-1 line-clamp-2 text-base font-bold">{quiz.title}</h3>
            <p className="mt-1 text-xs text-white/80">{quiz.courseTitle}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusStyles(quiz.status)}`}>
            {statusLabel(quiz.status)}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Lecturer:</span> {quiz.lecturerName}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200/60">
            <p className="font-semibold text-slate-500">Duration</p>
            <p className="mt-0.5 font-bold text-slate-900">{quiz.durationMinutes ?? "—"} min</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200/60">
            <p className="font-semibold text-slate-500">Questions</p>
            <p className="mt-0.5 font-bold text-slate-900">{quiz.questionCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200/60">
            <p className="font-semibold text-slate-500">Marks</p>
            <p className="mt-0.5 font-bold text-slate-900">{quiz.totalMarks ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200/60">
            <p className="font-semibold text-slate-500">Due</p>
            <p className="mt-0.5 font-bold text-slate-900">{dueLabel ?? "—"}</p>
          </div>
        </div>

        {quiz.bestScore != null ? (
          <div className="rounded-xl bg-[#FFC107]/10 px-3 py-2 ring-1 ring-[#FFC107]/30">
            <p className="text-xs font-semibold text-[#0B3D91]">Best score: {quiz.bestScore}%</p>
          </div>
        ) : null}

        <Link
          href={href}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0B3D91]/90"
        >
          {quiz.status === "completed" ? "View Results" : quiz.status === "in-progress" ? "Continue Quiz" : "Start Quiz"}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.article>
  );
}

export function CircularProgress({ percent }: { percent: number }) {
  const size = 86;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const offset = c - (p / 100) * c;

  return (
    <div className="relative h-[86px] w-[86px]">
      <svg width={size} height={size} className="block">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-slate-100" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-[#0B3D91]"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-sm font-extrabold text-slate-900">{p}%</span>
      </div>
    </div>
  );
}
