"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCourseBookmarks } from "@/hooks/use-course-bookmarks";
import { ContentEngagementPanel } from "@/components/content/content-engagement-panel";
import { AssignmentSubmitCard } from "@/components/student/courses/assignment-submit-card";
import {
  EmptyState,
  LoadingGrid,
  PageHeader,
  PrimaryButton,
  SearchFilterBar,
} from "@/components/student/courses/ui/course-ui";
import type {
  AssignmentItem,
  DiscussionItem,
  LectureNoteItem,
  QuizItem,
  VideoItem,
} from "@/types/student-courses";

type MaterialType = "lecture-notes" | "videos" | "assignments" | "quizzes" | "discussions";

const pageMeta: Record<MaterialType, { title: string; subtitle: string }> = {
  "lecture-notes": {
    title: "Lecture Notes",
    subtitle: "Read, download, and bookmark course materials",
  },
  videos: { title: "Video Lessons", subtitle: "Watch lessons and track your progress" },
  assignments: { title: "Assignments", subtitle: "View deadlines and submission status" },
  quizzes: { title: "Quizzes", subtitle: "Take quizzes and review your scores" },
  discussions: { title: "Discussions", subtitle: "Ask questions and join course conversations" },
};

function statusColor(status: AssignmentItem["status"]) {
  if (status === "submitted") return "bg-emerald-100 text-emerald-700";
  if (status === "late") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export function MaterialsPage({ type }: { type: MaterialType }) {
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { toggleBookmark, isBookmarked } = useCourseBookmarks();
  const meta = pageMeta[type];

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/courses/materials?type=${type}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setItems(json.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, [type]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [items, search]);

  if (loading) return <LoadingGrid />;
  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={meta.title} subtitle={meta.subtitle} />
      <SearchFilterBar search={search} onSearchChange={setSearch} placeholder={`Search ${meta.title.toLowerCase()}...`} />

      {filtered.length === 0 ? (
        <EmptyState title={`No ${meta.title.toLowerCase()} yet`} message="Materials will appear when your lecturer uploads them." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {type === "lecture-notes" &&
            (filtered as LectureNoteItem[]).map((note, i) => (
              <motion.article
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {note.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={note.coverImageUrl}
                        alt=""
                        className="h-20 w-14 shrink-0 rounded-lg object-cover shadow-sm"
                      />
                    ) : null}
                    <div>
                    <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                      {note.fileType}
                    </span>
                    <h3 className="mt-2 font-semibold text-slate-900">{note.title}</h3>
                    <p className="text-sm text-slate-500">{note.courseTitle}</p>
                    <p className="text-xs text-slate-400">
                      {note.lecturerName} · {note.uploadedAt}
                    </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleBookmark({
                        id: note.id,
                        type: "note",
                        title: note.title,
                        courseTitle: note.courseTitle,
                        href: `/student/courses/${note.courseId}`,
                      })
                    }
                    className={`rounded-lg p-2 ${isBookmarked(note.id, "note") ? "text-[#FFC107]" : "text-slate-400"}`}
                    aria-label="Bookmark"
                  >
                    ★
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-[#0B3D91] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Download
                  </a>
                  <PrimaryButton href={`/student/lecture-notes/view/${note.id}`}>Open Note</PrimaryButton>
                </div>
                <ContentEngagementPanel
                  targetType="lecture-note"
                  targetId={note.id}
                  compact
                />
              </motion.article>
            ))}

          {type === "videos" &&
            (filtered as VideoItem[]).map((video) => (
              <motion.article
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80"
              >
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#0B3D91] to-indigo-800">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFC107] text-[#0B3D91]">
                    ▶
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{video.title}</h3>
                  <p className="text-sm text-slate-500">{video.courseTitle}</p>
                  {video.deletionNotice ? (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900 ring-1 ring-amber-200">
                      {video.deletionNotice}
                    </p>
                  ) : null}
                  {video.expiresAt ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Available until {new Date(video.expiresAt).toLocaleString()}
                    </p>
                  ) : null}
                  <a
                    href={video.videoUrl}
                    download
                    className="mt-2 inline-block text-xs font-semibold text-[#0B3D91]"
                  >
                    Download video
                  </a>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${video.progress}%` }} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleBookmark({
                          id: video.id,
                          type: "video",
                          title: video.title,
                          courseTitle: video.courseTitle,
                          href: `/student/courses/${video.courseId}`,
                        })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                    >
                      {isBookmarked(video.id, "video") ? "Bookmarked" : "Bookmark"}
                    </button>
                    <PrimaryButton href={`/student/video-lessons/watch/${video.id}`}>Watch</PrimaryButton>
                  </div>
                  <ContentEngagementPanel targetType="video" targetId={video.id} compact />
                </div>
              </motion.article>
            ))}

          {type === "assignments" &&
            (filtered as AssignmentItem[]).map((a) => (
              <article key={a.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <p className="text-sm text-slate-500">{a.courseTitle}</p>
                    <p className="mt-1 text-xs text-slate-400">Due: {a.dueDate ?? "No due date"}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColor(a.status)}`}>
                    {a.status}
                  </span>
                </div>
                {a.marks ? <p className="mt-2 text-sm font-medium text-emerald-600">Marks: {a.marks}</p> : null}
                <AssignmentSubmitCard assignment={a} onSubmitted={() => void loadItems()} />
              </article>
            ))}

          {type === "quizzes" &&
            (filtered as QuizItem[]).map((q) => (
              <article key={q.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                <h3 className="font-semibold text-slate-900">{q.title}</h3>
                <p className="text-sm text-slate-500">{q.courseTitle}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {q.questionCount} questions · {q.durationMinutes ?? "—"} min · {q.totalMarks ?? "—"} marks
                </p>
                {q.bestScore != null ? (
                  <p className="mt-2 text-sm font-semibold text-[#0B3D91]">Best score: {q.bestScore}%</p>
                ) : null}
                <PrimaryButton
                  href={q.attempted ? `/student/quizzes/review/${q.id}` : `/student/quizzes/take/${q.id}`}
                  className="mt-4"
                >
                  {q.attempted ? "Review Quiz" : "Take Quiz"}
                </PrimaryButton>
              </article>
            ))}

          {type === "discussions" &&
            (filtered as DiscussionItem[]).map((d) => (
              <article key={d.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                <span className="rounded-full bg-[#0B3D91]/10 px-2 py-0.5 text-xs font-medium text-[#0B3D91]">
                  {d.type}
                </span>
                <h3 className="mt-2 font-semibold text-slate-900">{d.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{d.message}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {d.courseTitle ?? "General"} · {d.commentCount} replies · {d.createdAt}
                </p>
                <Link
                  href={`/student/discussions/thread/${d.id}`}
                  className="mt-3 inline-block text-sm font-semibold text-[#0B3D91]"
                >
                  Join discussion →
                </Link>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}
