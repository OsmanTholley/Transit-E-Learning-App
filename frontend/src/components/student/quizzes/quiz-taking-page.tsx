"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { QuizQuestionView, QuizSubmitResult, StudentQuizDetail } from "@/types/student-quizzes";

import { readStudentPreference, updateStudentPreferenceRecord } from "@/hooks/use-student-preference";
import { requestApi } from "@/lib/fetch-api";
import { STUDENT_PREF_KEYS } from "@/lib/student-preference-keys";
import { studentMutation } from "@/lib/student-ui";

type Draft = {
  answers: Record<string, string>;
  currentIndex: number;
  startedAt: number;
};

function loadDraft(quizId: string): Draft | null {
  const all = readStudentPreference<Record<string, Draft>>(STUDENT_PREF_KEYS.quizDrafts, {});
  return all[quizId] ?? null;
}

function saveDraft(quizId: string, draft: Draft) {
  updateStudentPreferenceRecord<Record<string, Draft>>(STUDENT_PREF_KEYS.quizDrafts, (all) => ({
    ...all,
    [quizId]: draft,
  }));
}

function clearDraft(quizId: string) {
  updateStudentPreferenceRecord<Record<string, Draft>>(STUDENT_PREF_KEYS.quizDrafts, (all) => {
    const next = { ...all };
    delete next[quizId];
    return next;
  });
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function QuestionBody({
  question,
  value,
  onChange,
}: {
  question: QuizQuestionView;
  value: string;
  onChange: (v: string) => void;
}) {
  if (question.type === "short-answer" || question.type === "fill-blank") {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.type === "fill-blank" ? "Fill in the blank…" : "Type your answer…"}
        className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
      />
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {question.options.map((opt) => (
        <label
          key={opt.key}
          className={[
            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
            value === opt.key || value === opt.label
              ? "border-[#0B3D91] bg-[#0B3D91]/5 ring-2 ring-[#0B3D91]/20"
              : "border-slate-200 bg-white hover:bg-slate-50",
          ].join(" ")}
        >
          <input
            type="radio"
            name={question.id}
            checked={value === opt.key || value === opt.label}
            onChange={() => onChange(opt.key)}
            className="h-4 w-4 accent-[#0B3D91]"
          />
          <span className="font-semibold text-[#0B3D91]">{opt.key}.</span>
          <span className="text-slate-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export function QuizTakingPage({ quizId }: { quizId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const practiceMode = searchParams.get("practice") === "1";

  const [quiz, setQuiz] = useState<StudentQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timerWarning, setTimerWarning] = useState(false);

  const startedAtRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const mountedRef = useRef(true);
  const loadRef = useRef<(() => Promise<void>) | null>(null);

  const durationSeconds = (quiz?.durationMinutes ?? 20) * 60;
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadFailed(false);
      let waitingForConnection = false;

      const result = await requestApi<StudentQuizDetail>(`/api/student/quizzes/${quizId}`, {
        errorTitle: "Could not load quiz",
        onRecovered: () => {
          if (mountedRef.current) void loadRef.current?.();
        },
      });

      if (!mountedRef.current) return;

      if (result.offline) {
        waitingForConnection = true;
      } else if (result.ok) {
        const json = result.data;
        if (!practiceMode && json.attemptCount >= json.attemptLimit && json.status === "completed") {
          router.replace(`/student/quizzes/review/${quizId}`);
          return;
        }
        setQuiz(json);
        const draft = loadDraft(quizId);
        if (draft) {
          setAnswers(draft.answers);
          setCurrentIndex(draft.currentIndex);
          startedAtRef.current = draft.startedAt;
        } else {
          startedAtRef.current = Date.now();
        }
        setRemaining((json.durationMinutes ?? 20) * 60);
      } else {
        setLoadFailed(true);
      }

      if (!waitingForConnection && mountedRef.current) {
        setLoading(false);
      }
    }

    loadRef.current = load;
    void load();
  }, [quizId, practiceMode, router]);

  const submitQuiz = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    const timeUsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    const payload = {
      answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
      timeUsedSeconds: timeUsed,
      practiceMode,
    };
    const body = JSON.stringify(payload);

    const result = await studentMutation<QuizSubmitResult>(`/api/student/quizzes/${quizId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      errorTitle: "Submit failed",
      offlineLabel: "Quiz submission",
      offlineDetail: "Your quiz answers are saved locally and will submit when you reconnect.",
    });

    if (result.ok) {
      clearDraft(quizId);
      updateStudentPreferenceRecord<Record<string, QuizSubmitResult>>(
        STUDENT_PREF_KEYS.quizLastResults,
        (stored) => ({ ...stored, [quizId]: result.data })
      );
      router.push(`/student/quizzes/review/${quizId}${practiceMode ? "?practice=1" : ""}`);
      return;
    }

    setSubmitting(false);
  }, [quiz, submitting, answers, quizId, practiceMode, router]);

  useEffect(() => {
    if (!quiz || loading) return;

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const left = Math.max(0, durationSeconds - elapsed);
      setRemaining(left);
      if (left <= 60) setTimerWarning(true);
      if (left <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        void submitQuiz();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [quiz, loading, durationSeconds, submitQuiz]);

  useEffect(() => {
    if (!quiz) return;
    saveDraft(quizId, { answers, currentIndex, startedAt: startedAtRef.current });
  }, [answers, currentIndex, quiz, quizId]);

  const questions = useMemo(() => quiz?.questions ?? [], [quiz?.questions]);
  const current = questions[currentIndex];
  const progressPercent = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length,
    [questions, answers]
  );

  if (loading) {
    return <LoadingState message="Preparing quiz environment…" layout="inline" />;
  }

  if (loadFailed || !quiz) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
        Quiz not found or unavailable.
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
        This quiz has no questions yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold text-[#0B3D91]">{quiz.courseCode}</p>
            <h1 className="text-lg font-bold text-slate-900">{quiz.title}</h1>
            {practiceMode ? (
              <span className="mt-1 inline-block rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-[10px] font-bold text-[#0B3D91]">
                PRACTICE MODE
              </span>
            ) : null}
          </div>
          <motion.div
            animate={timerWarning ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: timerWarning ? Infinity : 0, duration: 1 }}
            className={[
              "rounded-xl px-4 py-2 text-center font-mono text-lg font-extrabold",
              timerWarning ? "bg-rose-100 text-rose-700" : "bg-[#0B3D91] text-white",
            ].join(" ")}
          >
            Time Remaining: {formatTime(remaining)}
          </motion.div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#FFC107] transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 capitalize">
                  {current.type.replace("-", " ")}
                </span>
                <span className="text-xs font-semibold text-slate-500">{current.marks} mark(s)</span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">{current.question}</h2>
              <QuestionBody
                question={current}
                value={answers[current.id] ?? ""}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [current.id]: v }))}
              />
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentIndex >= questions.length - 1}
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="ml-auto rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-extrabold text-[#0B3D91]"
            >
              Submit Quiz
            </button>
          </div>
        </section>

        <aside className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <p className="text-xs font-bold text-slate-500">Question navigation</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const answered = Boolean((answers[q.id] ?? "").trim());
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={[
                      "h-9 rounded-lg text-xs font-bold",
                      i === currentIndex
                        ? "bg-[#0B3D91] text-white"
                        : answered
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Answers save automatically.</p>
        </aside>
      </div>

      <AnimatePresence>
        {showSubmitModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-900">Submit quiz?</h3>
              <p className="mt-2 text-sm text-slate-600">
                You answered {answeredCount} of {questions.length} questions. This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submitQuiz()}
                  className="flex-1 rounded-xl bg-[#0B3D91] py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Confirm Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
