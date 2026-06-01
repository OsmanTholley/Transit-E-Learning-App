"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStudentSession } from "@/contexts/student-session-context";
import { getQuizzesViewTitle } from "@/components/student/quizzes/quizzes-nav-config";
import { CircularProgress, DashboardStat, QuizCard, QuizFilters } from "@/components/student/quizzes/quiz-ui";
import type { LeaderboardEntry, StudentQuizSummary } from "@/types/student-quizzes";

type Props = { segment?: string[] };

const LS_DRAFT = "transit.quizzes.draft.v1";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getDraftQuizIds(): string[] {
  if (typeof window === "undefined") return [];
  const drafts = safeParse<Record<string, unknown>>(localStorage.getItem(LS_DRAFT), {});
  return Object.keys(drafts);
}

export function QuizzesHub({ segment }: Props) {
  const view = segment?.[0] ?? "";
  const title = getQuizzesViewTitle(view);
  const { data: session, loading: sessionLoading, error: sessionError } = useStudentSession();

  const [quizzes, setQuizzes] = useState<StudentQuizSummary[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scoreRange, setScoreRange] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const draftIds = getDraftQuizIds();
        const qRes = await fetch(
          `/api/student/quizzes${draftIds.length ? `?inProgress=${draftIds.join(",")}` : ""}`
        );
        const qJson = await qRes.json();
        if (!qRes.ok) throw new Error(qJson?.error ?? "Failed to load quizzes.");

        if (!cancelled) setQuizzes(qJson);

        if (view === "leaderboard") {
          const lRes = await fetch("/api/student/quizzes/leaderboard");
          const lJson = await lRes.json();
          if (!lRes.ok) throw new Error(lJson?.error ?? "Failed to load leaderboard.");
          if (!cancelled) setLeaderboard(lJson);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load quizzes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [view]);

  const courses = useMemo(() => {
    const list = session?.courses ?? [];
    return list.map((c) => ({ code: c.code, title: c.title }));
  }, [session?.courses]);

  const filtered = useMemo(() => {
    let list = quizzes ?? [];

    if (view === "upcoming") list = list.filter((q) => q.status === "upcoming");
    if (view === "active") list = list.filter((q) => q.status === "active" || q.status === "in-progress");
    if (view === "completed") list = list.filter((q) => q.status === "completed");
    if (view === "results") list = list.filter((q) => q.bestScore != null);
    if (view === "history") list = list.filter((q) => q.attemptCount > 0).sort((a, b) => (b.lastAttemptAt ?? "").localeCompare(a.lastAttemptAt ?? ""));

    if (courseCode) list = list.filter((q) => q.courseCode === courseCode);
    if (statusFilter) list = list.filter((q) => q.status === statusFilter);

    if (scoreRange === "pass") list = list.filter((q) => (q.bestScore ?? 0) >= 50);
    if (scoreRange === "excellent") list = list.filter((q) => (q.bestScore ?? 0) >= 80);
    if (scoreRange === "none") list = list.filter((q) => q.bestScore == null);

    if (query) {
      const q = query.toLowerCase();
      list = list.filter((item) =>
        `${item.courseCode} ${item.courseTitle} ${item.title} ${item.lecturerName}`.toLowerCase().includes(q)
      );
    }

    return list;
  }, [quizzes, view, courseCode, statusFilter, scoreRange, query]);

  const stats = useMemo(() => {
    const all = quizzes ?? [];
    const total = all.length;
    const completed = all.filter((q) => q.status === "completed").length;
    const pending = all.filter((q) => q.status !== "completed").length;
    const scored = all.filter((q) => q.bestScore != null);
    const avg = scored.length ? Math.round(scored.reduce((s, q) => s + (q.bestScore ?? 0), 0) / scored.length) : 0;
    return { total, completed, pending, avg };
  }, [quizzes]);

  if (sessionLoading) {
    return <p className="text-sm text-slate-500">Loading your quizzes...</p>;
  }

  if (sessionError) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{sessionError}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quizzes are filtered to your department, program, level, semester, and assigned courses.
          </p>
        </div>
        <Link
          href="/student/quizzes"
          className="inline-flex items-center justify-center rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0B3D91]/90"
        >
          All Quizzes
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="Total Quizzes"
          value={String(stats.total)}
          sub="Assigned to you"
          tone="blue"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          }
        />
        <DashboardStat
          label="Completed"
          value={String(stats.completed)}
          sub="Submitted attempts"
          tone="emerald"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <DashboardStat
          label="Average Score"
          value={`${stats.avg}%`}
          sub="Across attempts"
          tone="yellow"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
            </svg>
          }
        />
        <DashboardStat
          label="Pending"
          value={String(stats.pending)}
          sub="Not yet completed"
          tone="slate"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
      </section>

      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
      ) : null}

      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/80"
          >
            Loading quizzes…
          </motion.div>
        ) : null}
      </AnimatePresence>

      {view === "leaderboard" ? (
        <LeaderboardView entries={leaderboard ?? []} />
      ) : view === "performance" ? (
        <PerformanceView quizzes={quizzes ?? []} avg={stats.avg} />
      ) : view === "practice" ? (
        <PracticeView quizzes={quizzes ?? []} />
      ) : view === "results" ? (
        <ResultsListView quizzes={filtered} />
      ) : (
        <>
          {view !== "history" ? (
            <QuizFilters
              query={query}
              onQuery={setQuery}
              course={courseCode}
              courses={courses}
              onCourse={setCourseCode}
              status={statusFilter}
              onStatus={setStatusFilter}
              scoreRange={scoreRange}
              onScoreRange={setScoreRange}
            />
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3 rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
                No quizzes match your filters yet.
              </div>
            ) : (
              filtered.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  dueLabel={quiz.dueDate ? formatDate(quiz.dueDate) : "—"}
                />
              ))
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">AI Tutor (Quiz Review)</h2>
                <p className="text-sm text-slate-500">
                  Get explanations for mistakes after submitting — not during active quizzes.
                </p>
              </div>
              <Link
                href="/student/ai-tutor"
                className="inline-flex items-center justify-center rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0B3D91] shadow-sm hover:bg-[#FFC107]/90"
              >
                Open AI Tutor
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold text-slate-600">Anti-cheating (optional)</p>
            <p className="mt-1 text-xs text-slate-500">
              Fullscreen enforcement, tab-switch detection, and auto-submit can be enabled by your institution in a future release.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function LeaderboardView({ entries }: { entries: LeaderboardEntry[] }) {
  const [tab, setTab] = useState<"weekly" | "course" | "department">("weekly");

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Leaderboard</h2>
        <p className="mt-1 text-sm text-slate-500">Top scores from quizzes in your enrolled courses.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["weekly", "course", "department"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold ring-1 capitalize",
                tab === t ? "bg-[#0B3D91] text-white ring-[#0B3D91]" : "bg-white text-slate-700 ring-slate-200",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        {entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No leaderboard data yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((e) => (
              <div key={`${e.rank}-${e.studentName}-${e.submittedAt}`} className="flex items-center gap-4 p-4">
                <span
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold",
                    e.rank <= 3 ? "bg-[#FFC107] text-[#0B3D91]" : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  #{e.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{e.studentName}</p>
                  <p className="text-xs text-slate-500">
                    {e.courseCode} · {e.quizTitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-[#0B3D91]">{e.score}%</p>
                  <p className="text-xs text-slate-400">{formatDate(e.submittedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PerformanceView({ quizzes, avg }: { quizzes: StudentQuizSummary[]; avg: number }) {
  const byCourse = useMemo(() => {
    const map = new Map<string, { code: string; title: string; total: number; completed: number; sum: number }>();
    for (const q of quizzes) {
      const prev = map.get(q.courseCode) ?? { code: q.courseCode, title: q.courseTitle, total: 0, completed: 0, sum: 0 };
      const nextCompleted = prev.completed + (q.status === "completed" ? 1 : 0);
      const nextSum = prev.sum + (q.bestScore ?? 0);
      map.set(q.courseCode, {
        ...prev,
        total: prev.total + 1,
        completed: nextCompleted,
        sum: nextSum,
      });
    }
    return Array.from(map.values()).map((c) => ({
      ...c,
      avg: c.total ? Math.round(c.sum / c.total) : 0,
      passRate: c.total ? Math.round((c.completed / c.total) * 100) : 0,
    }));
  }, [quizzes]);

  const passRate = quizzes.length
    ? Math.round((quizzes.filter((q) => (q.bestScore ?? 0) >= 50).length / quizzes.length) * 100)
    : 0;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-sm font-semibold text-slate-700">Overall average</p>
          <div className="mt-4 flex items-center gap-5">
            <CircularProgress percent={avg} />
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{avg}%</p>
              <p className="text-sm text-slate-500">Pass rate: {passRate}%</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-sm font-semibold text-slate-700">Course performance</p>
          <div className="mt-4 space-y-3">
            {byCourse.length === 0 ? (
              <p className="text-sm text-slate-500">No analytics yet.</p>
            ) : (
              byCourse.map((c) => (
                <div key={c.code} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#0B3D91]">{c.code}</p>
                      <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        Avg {c.avg}% · {c.completed}/{c.total} completed
                      </p>
                    </div>
                    <div className="w-full max-w-xs">
                      <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                        <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${c.passRate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PracticeView({ quizzes }: { quizzes: StudentQuizSummary[] }) {
  const practiceQuizzes = quizzes.filter((q) => q.questionCount > 0);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Practice Quizzes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Unlimited attempts, instant feedback, and AI Tutor support — practice mode does not affect graded attempts.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Easy", "Medium", "Hard"].map((d) => (
            <span key={d} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {d}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {practiceQuizzes.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-3 rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
            No practice quizzes available yet.
          </div>
        ) : (
          practiceQuizzes.map((quiz) => (
            <motion.article
              key={quiz.id}
              whileHover={{ y: -2 }}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"
            >
              <p className="text-xs font-bold text-[#0B3D91]">{quiz.courseCode}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{quiz.title}</h3>
              <p className="mt-2 text-xs text-slate-500">{quiz.questionCount} questions · Unlimited attempts</p>
              <Link
                href={`/student/quizzes/take/${quiz.id}?practice=1`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#FFC107] px-4 py-2.5 text-sm font-bold text-[#0B3D91] shadow-sm hover:bg-[#FFC107]/90"
              >
                Start Practice
              </Link>
            </motion.article>
          ))
        )}
      </div>
    </section>
  );
}

function ResultsListView({ quizzes }: { quizzes: StudentQuizSummary[] }) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Quiz Results</h2>
        <p className="mt-1 text-sm text-slate-500">Review scores, pass/fail status, and open detailed breakdowns.</p>
      </div>
      <div className="space-y-3">
        {quizzes.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
            No results yet. Complete a quiz to see your score.
          </div>
        ) : (
          quizzes.map((q) => {
            const passed = (q.bestScore ?? 0) >= q.passingScore;
            return (
              <div
                key={q.id}
                className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-[#0B3D91]">{q.courseCode}</p>
                  <p className="font-semibold text-slate-900">{q.title}</p>
                  <p className="text-xs text-slate-500">Submitted {q.lastAttemptAt ? formatDate(q.lastAttemptAt) : "—"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-slate-900">{q.bestScore ?? 0}%</p>
                    <p className={`text-xs font-bold ${passed ? "text-emerald-600" : "text-rose-600"}`}>
                      {passed ? "Passed" : "Failed"}
                    </p>
                  </div>
                  <Link
                    href={`/student/quizzes/review/${q.id}`}
                    className="rounded-xl bg-[#0B3D91] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0B3D91]/90"
                  >
                    Review
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
