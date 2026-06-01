"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { StudentQuizDetail } from "@/types/student-quizzes";
import { statusLabel, statusStyles } from "@/components/student/quizzes/quiz-ui";

export function QuizDetailsPage({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<StudentQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/quizzes/${quizId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load quiz");
        if (!cancelled) setQuiz(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load quiz");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading quiz details…</p>;
  }

  if (error || !quiz) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700 ring-1 ring-rose-200">{error ?? "Quiz not found"}</div>
    );
  }

  const canAttempt = quiz.attemptCount < quiz.attemptLimit && quiz.status !== "completed";
  const startHref =
    quiz.status === "in-progress"
      ? `/student/quizzes/take/${quiz.id}`
      : `/student/quizzes/take/${quiz.id}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/student/quizzes" className="text-sm font-semibold text-[#0B3D91] hover:underline">
          ← Back to quizzes
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#0B3D91]">{quiz.courseCode}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{quiz.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{quiz.courseTitle}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles(quiz.status)}`}>
            {statusLabel(quiz.status)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80"
          >
            <h2 className="text-lg font-bold text-slate-900">Quiz instructions</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
              {quiz.instructions ??
                "Read each question carefully. Select the best answer for multiple choice questions. You may navigate between questions before submitting."}
            </p>
          </motion.section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
            <h2 className="text-lg font-bold text-slate-900">Quiz rules</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold text-[#0B3D91]">•</span>
                Time limit: {quiz.durationMinutes ?? "No"} minutes
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#0B3D91]">•</span>
                Passing score: {quiz.passingScore}%
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#0B3D91]">•</span>
                Attempt limit: {quiz.attemptLimit} graded attempt(s)
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#0B3D91]">•</span>
                Questions: {quiz.questionCount} · Total marks: {quiz.totalMarks ?? "—"}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#0B3D91]">•</span>
                Auto-submit when the timer ends
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-rose-600">•</span>
                Anti-cheating: Do not switch tabs or use unauthorized materials during the quiz.
              </li>
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <h3 className="font-bold text-slate-900">Course & lecturer</h3>
            <p className="mt-2 text-sm text-slate-600">{quiz.courseTitle}</p>
            <p className="text-sm text-slate-500">Lecturer: {quiz.lecturerName}</p>
            {quiz.bestScore != null ? (
              <p className="mt-3 text-sm font-semibold text-[#0B3D91]">Previous best: {quiz.bestScore}%</p>
            ) : null}
          </div>

          {canAttempt ? (
            <Link
              href={startHref}
              className="flex w-full items-center justify-center rounded-2xl bg-[#FFC107] px-4 py-3 text-sm font-extrabold text-[#0B3D91] shadow-sm hover:bg-[#FFC107]/90"
            >
              {quiz.status === "in-progress" ? "Continue Quiz" : "Start Quiz"}
            </Link>
          ) : (
            <Link
              href={`/student/quizzes/review/${quiz.id}`}
              className="flex w-full items-center justify-center rounded-2xl bg-[#0B3D91] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#0B3D91]/90"
            >
              View Results
            </Link>
          )}

          <Link
            href={`/student/quizzes/take/${quiz.id}?practice=1`}
            className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Practice Mode
          </Link>
        </aside>
      </div>
    </div>
  );
}
