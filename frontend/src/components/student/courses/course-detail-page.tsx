"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCourseBookmarks } from "@/hooks/use-course-bookmarks";
import { ProgressRing, PrimaryButton } from "@/components/student/courses/ui/course-ui";
import type { CourseDetail } from "@/types/student-courses";

const tabs = [
  "Overview",
  "Lecture Notes",
  "Video Lessons",
  "Assignments",
  "Quizzes",
  "Discussions",
  "Announcements",
  "AI Tutor",
] as const;

type Tab = (typeof tabs)[number];

function AiTutorPanel({ courseTitle }: { courseTitle: string }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    const q = question.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/student/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, courseTitle }),
      });
      const json = await res.json();
      setMessages((m) => [...m, { role: "ai", text: json.answer ?? json.error ?? "No response." }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Could not reach AI Tutor." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ask anything about this course — definitions, formulas, or step-by-step help.
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 text-sm ${
                msg.role === "user" ? "ml-8 bg-[#0B3D91] text-white" : "mr-8 bg-white ring-1 ring-slate-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="e.g. What is reflection of light?"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/20"
        />
        <button
          type="button"
          onClick={ask}
          disabled={loading}
          className="rounded-xl bg-[#FFC107] px-4 py-2.5 text-sm font-semibold text-[#0B3D91] disabled:opacity-60"
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
}

export function CourseDetailPage({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const { toggleBookmark, isBookmarked } = useCourseBookmarks();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/student/courses/${courseId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load course");
        setCourse(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  if (loading) return <p className="text-sm text-slate-500">Loading course...</p>;
  if (error || !course) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
        {error ?? "Course not found"}
        <Link href="/student/courses" className="ml-2 font-semibold underline">
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/student/courses" className="text-sm font-medium text-[#0B3D91] hover:underline">
            ← My Courses
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">{course.title}</h1>
          <p className="text-sm font-medium text-[#0B3D91]">{course.code}</p>
          <p className="mt-1 text-sm text-slate-500">
            {course.lecturerName} · {course.department} · {course.semester}
          </p>
        </div>
        <ProgressRing percent={course.progress} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
              tab === t ? "bg-[#0B3D91] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80"
        >
          {tab === "Overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="font-bold text-slate-900">Course description</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {course.description ?? "No description provided for this course yet."}
                </p>
                <h3 className="mt-6 font-bold text-slate-900">Objectives</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {course.objectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
                {(course.syllabusText || course.syllabusUrl) && (
                  <div className="mt-6">
                    <h3 className="font-bold text-slate-900">Syllabus</h3>
                    {course.syllabusText ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {course.syllabusText}
                      </p>
                    ) : null}
                    {course.syllabusUrl ? (
                      <a
                        href={course.syllabusUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm font-semibold text-[#0B3D91] hover:underline"
                      >
                        Open syllabus document →
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-[#0B3D91]/5 p-5">
                <h3 className="font-bold text-[#0B3D91]">Lecturer</h3>
                <p className="mt-2 text-lg font-semibold text-slate-900">{course.lecturerName}</p>
                <p className="text-sm text-slate-500">{course.lecturerSpecialization ?? "Faculty"}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="rounded-lg bg-white p-3">
                    <p className="font-bold text-[#0B3D91]">{course.stats.lectureNotes}</p>
                    <p className="text-xs text-slate-500">Notes</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="font-bold text-[#0B3D91]">{course.stats.videos}</p>
                    <p className="text-xs text-slate-500">Videos</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "Lecture Notes" && (
            <ul className="divide-y divide-slate-100">
              {course.lectureNotes.length === 0 ? (
                <p className="text-sm text-slate-500">No lecture notes yet.</p>
              ) : (
                course.lectureNotes.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500">
                        {n.fileType} · {n.uploadedAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleBookmark({
                            id: n.id,
                            type: "note",
                            title: n.title,
                            courseTitle: course.title,
                            href: `/student/courses/${course.id}`,
                          })
                        }
                        className="text-lg"
                      >
                        {isBookmarked(n.id, "note") ? "★" : "☆"}
                      </button>
                      <a href={n.fileUrl} className="rounded-lg bg-[#0B3D91] px-3 py-1.5 text-xs font-semibold text-white">
                        Download
                      </a>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}

          {tab === "Video Lessons" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {course.videos.map((v) => (
                <div key={v.id} className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#0B3D91] to-indigo-700 text-white">
                    ▶ {v.title}
                  </div>
                  <div className="p-3">
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${v.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Assignments" && (
            <ul className="space-y-3">
              {course.assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-slate-500">Due {a.dueDate ?? "—"} · {a.status}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      a.status === "submitted"
                        ? "bg-emerald-100 text-emerald-700"
                        : a.status === "late"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {tab === "Quizzes" && (
            <ul className="space-y-3">
              {course.quizzes.map((q) => (
                <li key={q.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">{q.title}</p>
                  <p className="text-xs text-slate-500">
                    {q.questionCount} questions · {q.durationMinutes ?? "—"} min
                  </p>
                  {q.bestScore != null ? (
                    <p className="mt-1 text-sm font-semibold text-[#0B3D91]">Score: {q.bestScore}%</p>
                  ) : null}
                  <PrimaryButton className="mt-3">{q.attempted ? "Review" : "Start Quiz"}</PrimaryButton>
                </li>
              ))}
            </ul>
          )}

          {tab === "Discussions" && (
            <ul className="space-y-3">
              {course.discussions.map((d) => (
                <li key={d.id} className="rounded-xl border border-slate-100 p-4">
                  <p className="font-medium">{d.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{d.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{d.commentCount} comments</p>
                </li>
              ))}
            </ul>
          )}

          {tab === "Announcements" && (
            <ul className="space-y-3">
              {course.announcements.map((a) => (
                <li key={a.id} className="rounded-xl border-l-4 border-[#FFC107] bg-amber-50/50 p-4">
                  <p className="font-semibold text-slate-900">{a.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{a.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{a.createdAt}</p>
                </li>
              ))}
            </ul>
          )}

          {tab === "AI Tutor" && <AiTutorPanel courseTitle={course.title} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
