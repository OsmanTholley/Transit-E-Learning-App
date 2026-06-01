"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { QuizSubmitResult, StudentQuizSummary } from "@/types/student-quizzes";
import { CircularProgress } from "@/components/student/quizzes/quiz-ui";

const LS_LAST_RESULT = "transit.quizzes.lastResult.v1";

function loadResult(quizId: string): QuizSubmitResult | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem(LS_LAST_RESULT) ?? "{}") as Record<string, QuizSubmitResult>;
    return all[quizId] ?? null;
  } catch {
    return null;
  }
}

export function QuizResultsPage({ quizId }: { quizId: string }) {
  const searchParams = useSearchParams();
  const practiceMode = searchParams.get("practice") === "1";

  const [quiz, setQuiz] = useState<StudentQuizSummary | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const stored = loadResult(quizId);
      if (!cancelled) setResult(stored);

      try {
        const res = await fetch(`/api/student/quizzes/${quizId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load");
        if (!cancelled) setQuiz(json);
      } catch {
        /* quiz meta optional if only result stored */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  async function askTutor() {
    const q = tutorQuestion.trim();
    if (!q) return;
    setTutorLoading(true);
    setTutorAnswer(null);
    try {
      const res = await fetch("/api/student/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `After completing a quiz${quiz ? ` (${quiz.courseCode} - ${quiz.title})` : ""}, the student asks for learning help (NOT quiz answers): ${q}`,
          courseTitle: quiz?.courseTitle,
        }),
      });
      const json = await res.json();
      setTutorAnswer(json.answer ?? json.error ?? "No response.");
    } catch (e) {
      setTutorAnswer(e instanceof Error ? e.message : "AI Tutor failed.");
    } finally {
      setTutorLoading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading results…</p>;
  }

  const percentage = result?.percentage ?? quiz?.bestScore ?? 0;
  const passed = result?.passed ?? percentage >= (quiz?.passingScore ?? 50);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/student/quizzes/results" className="text-sm font-semibold text-[#0B3D91] hover:underline">
          ← All results
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Quiz Results</h1>
        {quiz ? (
          <p className="mt-1 text-sm text-slate-500">
            {quiz.courseCode} · {quiz.title}
            {practiceMode ? " · Practice attempt" : ""}
          </p>
        ) : null}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <CircularProgress percent={percentage} />
          <div className="flex-1">
            <p className={`text-sm font-bold uppercase ${passed ? "text-emerald-600" : "text-rose-600"}`}>
              {passed ? "Passed" : "Failed"}
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">{percentage}%</p>
            {result ? (
              <p className="mt-2 text-sm text-slate-600">
                Score: {result.score} / {result.totalMarks} marks · Time used:{" "}
                {Math.floor(result.timeUsedSeconds / 60)}m {result.timeUsedSeconds % 60}s
              </p>
            ) : quiz?.bestScore != null ? (
              <p className="mt-2 text-sm text-slate-600">Best recorded score: {quiz.bestScore}%</p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Complete a quiz to see detailed breakdown.</p>
            )}
          </div>
        </div>
      </motion.section>

      {result?.breakdown?.length ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900">Answer review</h2>
          <div className="mt-4 space-y-3">
            {result.breakdown.map((b, i) => (
              <div
                key={b.questionId}
                className={[
                  "rounded-xl p-4 ring-1",
                  b.correct ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">Question {i + 1}</p>
                  <span className={`text-xs font-bold ${b.correct ? "text-emerald-700" : "text-rose-700"}`}>
                    {b.correct ? "Correct" : "Incorrect"} · {b.earned}/{b.marks}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">Your answer: {b.studentAnswer || "—"}</p>
                {!b.correct && b.correctAnswer ? (
                  <p className="mt-1 text-sm text-slate-600">Expected: {b.correctAnswer}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">AI Tutor — understand your mistakes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ask why an answer was wrong, request formulas, examples, and step-by-step explanations. The AI will not give
          answers for quizzes still in progress.
        </p>
        <input
          value={tutorQuestion}
          onChange={(e) => setTutorQuestion(e.target.value)}
          placeholder='Try: "Why was my answer wrong?"'
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        />
        <button
          type="button"
          onClick={() => void askTutor()}
          disabled={tutorLoading}
          className="mt-3 rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {tutorLoading ? "Thinking…" : "Ask AI Tutor"}
        </button>
        {tutorAnswer ? (
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200/70">
            {tutorAnswer}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/student/quizzes"
          className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Back to quizzes
        </Link>
        {quiz && quiz.attemptCount < quiz.attemptLimit ? (
          <Link
            href={`/student/quizzes/quiz/${quizId}`}
            className="rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0B3D91]"
          >
            Retake (if allowed)
          </Link>
        ) : null}
        <Link
          href={`/student/quizzes/take/${quizId}?practice=1`}
          className="rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-bold text-white"
        >
          Practice again
        </Link>
      </div>
    </div>
  );
}
