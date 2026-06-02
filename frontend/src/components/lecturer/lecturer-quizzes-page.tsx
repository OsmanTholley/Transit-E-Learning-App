"use client";

import { FormEvent, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { requestApi } from "@/lib/fetch-api";
import {
  CourseSelect,
  FieldLabel,
  inputClass,
  textareaClass,
  useLecturerCourses,
} from "@/components/lecturer/lecturer-ui";
import { Panel, PrimaryButton, SecondaryButton } from "@/components/student-management/ui";
import type { LecturerQuizRow } from "@/types/lecturer-content";

type QuestionDraft = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  marks: string;
};

const emptyQuestion = (): QuestionDraft => ({
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  marks: "1",
});

export function LecturerQuizzesPage() {
  const { data: coursesData } = useLecturerCourses();
  const { data, loading, setData } = useApiLoad<{ quizzes: LecturerQuizRow[] }>(
    "/api/lecturer/quizzes",
    { errorTitle: "Could not load quizzes" }
  );

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const courses = coursesData?.courses ?? [];
  const quizzes = data?.quizzes ?? [];

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await requestApi<{ quiz: LecturerQuizRow }>("/api/lecturer/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        title,
        instructions,
        durationMinutes: durationMinutes || null,
        questions: questions.map((q) => ({
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          marks: Number(q.marks) || 1,
        })),
      }),
      errorTitle: "Could not create quiz",
    });
    if (result.ok) {
      setData({ quizzes: [result.data.quiz, ...quizzes] });
      setTitle("");
      setInstructions("");
      setDurationMinutes("");
      setQuestions([emptyQuestion()]);
      setShowForm(false);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#072d6b] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Quiz management</h2>
            <p className="mt-2 text-sm text-blue-100">
              Build multiple-choice quizzes for enrolled students. Scores appear after they submit
              attempts.
            </p>
          </div>
          <SecondaryButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Hide builder" : "Create quiz"}
          </SecondaryButton>
        </div>
      </section>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="font-bold text-slate-900">New quiz</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <CourseSelect courses={courses} value={courseId} onChange={setCourseId} />
            <label className="block">
              <FieldLabel>Quiz title</FieldLabel>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </label>
            <label className="block lg:col-span-2">
              <FieldLabel>Instructions (optional)</FieldLabel>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                className={textareaClass}
              />
            </label>
            <label className="block">
              <FieldLabel>Duration (minutes)</FieldLabel>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-sm font-semibold text-slate-700">Questions</p>
            {questions.map((q, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Question {index + 1}
                  </span>
                  {questions.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                      className="text-xs font-semibold text-rose-600"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(index, { question: e.target.value })}
                  placeholder="Question text"
                  required
                  rows={2}
                  className={textareaClass}
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(["A", "B", "C", "D"] as const).map((letter) => {
                    const key = `option${letter}` as keyof QuestionDraft;
                    return (
                      <input
                        key={letter}
                        value={q[key] as string}
                        onChange={(e) => updateQuestion(index, { [key]: e.target.value })}
                        placeholder={`Option ${letter}`}
                        className={inputClass}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  <label className="text-sm">
                    <FieldLabel>Correct</FieldLabel>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(index, { correctAnswer: e.target.value })}
                      className={inputClass}
                    >
                      {["A", "B", "C", "D"].map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <FieldLabel>Marks</FieldLabel>
                    <input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => updateQuestion(index, { marks: e.target.value })}
                      className={`${inputClass} w-24`}
                    />
                  </label>
                </div>
              </div>
            ))}
            <SecondaryButton type="button" onClick={() => setQuestions((p) => [...p, emptyQuestion()])}>
              Add question
            </SecondaryButton>
          </div>

          <div className="mt-4">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Publishing…" : "Publish quiz"}
            </PrimaryButton>
          </div>
        </form>
      ) : null}

      <Panel title="Your quizzes">
        {loading && !data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-slate-500">No quizzes yet. Create one to get started.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Quiz", "Course", "Questions", "Attempts", "Average"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quizzes.map((q) => (
                <tr key={q.id}>
                  <td className="px-3 py-2 font-medium">{q.title}</td>
                  <td className="px-3 py-2">{q.course}</td>
                  <td className="px-3 py-2">{q.questionCount}</td>
                  <td className="px-3 py-2">{q.attempts}</td>
                  <td className="px-3 py-2">{q.averageScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
