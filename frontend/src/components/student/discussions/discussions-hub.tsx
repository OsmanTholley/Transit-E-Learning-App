"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStudentSession } from "@/contexts/student-session-context";
import { getDiscussionsViewTitle } from "@/components/student/discussions/discussions-nav-config";
import { useStudentPreference } from "@/hooks/use-student-preference";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { STUDENT_PREF_KEYS } from "@/lib/student-preference-keys";
import { reportStudentError, studentMutation } from "@/lib/student-ui";
import {
  DashboardStat,
  DiscussionCard,
  DiscussionFilters,
} from "@/components/student/discussions/discussion-ui";
import type { DiscussionSummary } from "@/types/student-discussions";

type Props = { segment?: string[] };

type StudyGroup = { id: string; name: string; courseCode: string; members: number };

export function DiscussionsHub({ segment }: Props) {
  const view = segment?.[0] ?? "";
  const title = getDiscussionsViewTitle(view);
  const searchParams = useSearchParams();
  const urlCourseId = searchParams.get("courseId") ?? "";
  const { data: session, loading: sessionLoading } = useStudentSession();

  const [discussions, setDiscussions] = useState<DiscussionSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const loadRef = useRef<(() => Promise<void>) | null>(null);

  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const activeCourseId = urlCourseId || courseId;
  const [sort, setSort] = useState("latest");

  const [likes, setLikes] = useStudentPreference<Record<string, number>>(
    STUDENT_PREF_KEYS.discussionLikes,
    {}
  );
  const [saved, setSaved] = useStudentPreference<Record<string, true>>(
    STUDENT_PREF_KEYS.discussionSaved,
    {}
  );
  const [groups, setGroups] = useStudentPreference<StudyGroup[]>(
    STUDENT_PREF_KEYS.discussionStudyGroups,
    []
  );

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [creating, setCreating] = useState(false);

  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    let waitingForConnection = false;
    const params = new URLSearchParams();
    if (view) params.set("view", view);
    if (activeCourseId) params.set("courseId", activeCourseId);
    if (query) params.set("search", query);

    const result = await requestApi<DiscussionSummary[]>(
      `/api/student/discussions?${params.toString()}`,
      {
        errorTitle: "Could not load discussions",
        onRecovered: () => {
          if (mountedRef.current) void loadRef.current?.();
        },
      }
    );

    if (!mountedRef.current) return;

    if (result.offline) {
      waitingForConnection = true;
    } else if (result.ok) {
      setDiscussions(result.data);
    } else {
      setDiscussions(null);
    }

    if (!waitingForConnection) {
      setLoading(false);
    }
  }, [view, activeCourseId, query]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    scheduleEffectWork(() => load());
  }, [load]);

  const courses = useMemo(() => {
    return (session?.courses ?? []).map((c) => ({ id: c.id, code: c.code, title: c.title }));
  }, [session?.courses]);

  const filtered = useMemo(() => {
    let list = discussions ?? [];

    if (view === "saved") {
      list = list.filter((d) => saved[d.id]);
    }

    if (sort === "popular") {
      list = [...list].sort(
        (a, b) => (likes[b.id] ?? b.likeCount) - (likes[a.id] ?? a.likeCount) || b.replyCount - a.replyCount
      );
    } else if (sort === "unanswered") {
      list = list.filter((d) => d.questionStatus === "unanswered");
    } else {
      list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return list;
  }, [discussions, view, saved, sort, likes]);

  const stats = useMemo(() => {
    const all = discussions ?? [];
    const mine = all.filter((d) => d.isOwn).length;
    const unanswered = all.filter((d) => d.questionStatus === "unanswered").length;
    const trending = [...all].sort((a, b) => b.replyCount - a.replyCount)[0]?.title ?? "—";
    return { total: all.length, mine, unanswered, trending };
  }, [discussions]);

  function toggleLike(id: string) {
    setLikes((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  async function createPost() {
    if (!newTitle.trim() || !newMessage.trim()) return;
    setCreating(true);
    const discussionType = newCourseId ? "COURSE" : view === "announcements" ? "PROGRAM" : "GENERAL";
    const body = JSON.stringify({
      title: newTitle,
      message: newMessage,
      courseId: newCourseId || null,
      discussionType,
    });

    const result = await studentMutation<DiscussionSummary>("/api/student/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      errorTitle: "Could not create post",
      offlineLabel: "Discussion post",
    });

    if (result.ok) {
      setDiscussions((prev) => [result.data, ...(prev ?? [])]);
      setShowCreate(false);
      setNewTitle("");
      setNewMessage("");
      setNewCourseId("");
    }
    setCreating(false);
  }

  async function askTutor() {
    const q = tutorQuestion.trim();
    if (!q) return;
    setTutorLoading(true);
    setTutorAnswer(null);
    try {
      const result = await requestApi<{ answer?: string; error?: string }>("/api/student/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
        errorTitle: "AI Tutor unavailable",
      });
      if (result.ok) {
        setTutorAnswer(result.data.answer ?? result.data.error ?? "No response.");
      }
    } catch (e) {
      reportStudentError("AI Tutor failed", e);
    } finally {
      setTutorLoading(false);
    }
  }

  if (sessionLoading) {
    return <LoadingState message="Loading discussions…" layout="inline" />;
  }

  const specialViews = ["study-groups", "notifications", "ai-tutor"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Collaborate with classmates and lecturers in your academic community.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-extrabold text-[#0B3D91] shadow-sm hover:bg-[#FFC107]/90"
        >
          + New Post
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="Total Discussions"
          value={String(stats.total)}
          sub="In your community"
          tone="blue"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <DashboardStat
          label="My Questions"
          value={String(stats.mine)}
          sub="Posts you created"
          tone="yellow"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          }
        />
        <DashboardStat
          label="Unanswered"
          value={String(stats.unanswered)}
          sub="Needs replies"
          tone="rose"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          }
        />
        <DashboardStat
          label="Trending"
          value="Hot"
          sub={stats.trending}
          tone="emerald"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          }
        />
      </section>

      {view === "study-groups" ? (
        <StudyGroupsView groups={groups} courses={courses} onCreate={(g) => setGroups((prev) => [g, ...prev])} />
      ) : view === "notifications" ? (
        <NotificationsView discussions={discussions ?? []} />
      ) : view === "ai-tutor" ? (
        <AiTutorDiscussionsView
          question={tutorQuestion}
          onQuestion={setTutorQuestion}
          answer={tutorAnswer}
          loading={tutorLoading}
          onAsk={() => void askTutor()}
        />
      ) : view === "courses" ? (
        <CourseRoomsView discussions={discussions ?? []} courses={courses} />
      ) : (
        <>
          {!specialViews.includes(view) ? (
            <DiscussionFilters
              query={query}
              onQuery={setQuery}
              course={activeCourseId}
              courses={courses}
              onCourse={setCourseId}
              sort={sort}
              onSort={setSort}
            />
          ) : null}

          {loading ? (
        <LoadingState message="Loading discussions…" layout="inline" />
      ) : (
            <section className="space-y-4">
              {filtered.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
                  No discussions yet. Start the conversation!
                </div>
              ) : (
                filtered.map((d) => (
                  <DiscussionCard
                    key={d.id}
                    discussion={d}
                    likeCount={likes[d.id] ?? d.likeCount}
                    isSaved={Boolean(saved[d.id])}
                    onLike={() => toggleLike(d.id)}
                    onSave={() => toggleSave(d.id)}
                  />
                ))
              )}
            </section>
          )}
        </>
      )}

      <AnimatePresence>
        {showCreate ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-900">Create discussion</h3>
              <div className="mt-4 space-y-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Discussion title"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
                />
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask your question or share an idea…"
                  className="min-h-28 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
                />
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">General discussion</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void createPost()}
                  className="flex-1 rounded-xl bg-[#0B3D91] py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {creating ? "Posting…" : "Post"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CourseRoomsView({
  discussions,
  courses,
}: {
  discussions: DiscussionSummary[];
  courses: { id: string; code: string; title: string }[];
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Course Discussion Rooms</h2>
        <p className="mt-1 text-sm text-slate-500">Only enrolled students can participate in each room.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => {
          const count = discussions.filter((d) => d.courseId === c.id).length;
          return (
            <Link
              key={c.id}
              href={`/student/discussions/courses?courseId=${c.id}`}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-bold text-[#0B3D91]">{c.code}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-xs text-slate-500">{count} discussions</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StudyGroupsView({
  groups,
  courses,
  onCreate,
}: {
  groups: StudyGroup[];
  courses: { id: string; code: string; title: string }[];
  onCreate: (g: StudyGroup) => void;
}) {
  const [name, setName] = useState("");
  const courseCode = courses[0]?.code ?? "GEN";

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Study Groups</h2>
        <p className="mt-1 text-sm text-slate-500">Collaborate with peers — chat, files, and announcements (UI ready).</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (!name.trim()) return;
              onCreate({ id: crypto.randomUUID(), name: name.trim(), courseCode, members: 1 });
              setName("");
            }}
            className="rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-bold text-white"
          >
            Create group
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">No study groups yet. Create one to get started.</p>
        ) : (
          groups.map((g) => (
            <div key={g.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-bold text-[#0B3D91]">{g.courseCode}</p>
              <h3 className="font-semibold text-slate-900">{g.name}</h3>
              <p className="mt-2 text-xs text-slate-500">{g.members} member(s) · Group chat ready</p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-[#FFC107] px-4 py-2 text-xs font-bold text-[#0B3D91]"
              >
                Open group
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function NotificationsView({ discussions }: { discussions: DiscussionSummary[] }) {
  const items = discussions
    .filter((d) => d.replyCount > 0)
    .slice(0, 10)
    .map((d) => ({
      id: d.id,
      title: `New activity on "${d.title}"`,
      sub: `${d.replyCount} replies`,
      time: d.createdAt,
    }));

  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-bold text-slate-900">Discussion Notifications</h2>
        <p className="text-sm text-slate-500">In-app updates when discussions get replies.</p>
      </div>
      {items.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">No discussion notifications yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500">{n.sub}</p>
              </div>
              <Link
                href={`/student/discussions/thread/${n.id}`}
                className="shrink-0 text-xs font-bold text-[#0B3D91] hover:underline"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AiTutorDiscussionsView({
  question,
  onQuestion,
  answer,
  loading,
  onAsk,
}: {
  question: string;
  onQuestion: (v: string) => void;
  answer: string | null;
  loading: boolean;
  onAsk: () => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
      <h2 className="text-lg font-bold text-slate-900">AI Tutor Discussions</h2>
      <p className="mt-1 text-sm text-slate-500">
        Ask academic questions and get explanations with formulas, examples, and study guidance.
      </p>
      <input
        value={question}
        onChange={(e) => onQuestion(e.target.value)}
        placeholder={'Try: "What is Snell\'s Law?"'}
        className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
      />
      <button
        type="button"
        onClick={onAsk}
        disabled={loading}
        className="mt-3 rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Thinking…" : "Ask AI Tutor"}
      </button>
      {answer ? (
        <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200/70">
          {answer}
        </div>
      ) : null}
    </section>
  );
}
