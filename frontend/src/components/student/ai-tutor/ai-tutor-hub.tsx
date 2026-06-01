"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useStudentSession } from "@/contexts/student-session-context";
import { AiTutorChat } from "@/components/student/ai-tutor/ai-tutor-chat";
import {
  getAiTutorViewTitle,
  subjectTutors,
} from "@/components/student/ai-tutor/ai-tutor-nav-config";
import { DashboardStat, LS_CONVERSATIONS, LS_PLANNER, LS_SOLVED } from "@/components/student/ai-tutor/ai-tutor-ui";
import type {
  AiConversation,
  AiTutorHistoryItem,
  ChatMessage,
  SolvedQuestion,
  StudyPlanItem,
} from "@/types/student-ai-tutor";

type Props = { segment?: string[] };

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function newConversation(subject = "general"): AiConversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    subject,
    messages: [],
    updatedAt: new Date().toISOString(),
    bookmarked: false,
  };
}

export function AiTutorHub({ segment }: Props) {
  const view = segment?.[0] ?? "";
  const title = getAiTutorViewTitle(view);
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get("subject") ?? "";

  const { data: session, loading: sessionLoading } = useStudentSession();

  const [conversations, setConversations] = useState<AiConversation[]>(() =>
    safeParse(typeof window === "undefined" ? null : localStorage.getItem(LS_CONVERSATIONS), [])
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dbHistory, setDbHistory] = useState<AiTutorHistoryItem[]>([]);
  const [solved, setSolved] = useState<SolvedQuestion[]>(() =>
    safeParse(typeof window === "undefined" ? null : localStorage.getItem(LS_SOLVED), [])
  );
  const [planner, setPlanner] = useState<StudyPlanItem[]>(() =>
    safeParse(typeof window === "undefined" ? null : localStorage.getItem(LS_PLANNER), [])
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_CONVERSATIONS, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_SOLVED, JSON.stringify(solved));
  }, [solved]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_PLANNER, JSON.stringify(planner));
  }, [planner]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/student/ai-tutor");
        if (res.ok) {
          const json = await res.json();
          setDbHistory(json);
        }
      } catch {
        /* ignore */
      }
    }
    loadHistory();
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const persistMessages = useCallback(
    (messages: ChatMessage[]) => {
      if (!activeId) {
        const conv = newConversation(subjectParam || "general");
        conv.messages = messages;
        if (messages[0]?.role === "user") {
          conv.title = messages[0].text.slice(0, 48) + (messages[0].text.length > 48 ? "…" : "");
        }
        conv.updatedAt = new Date().toISOString();
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);

        const lastAi = messages.filter((m) => m.role === "ai").pop();
        if (lastAi && messages.some((m) => m.role === "user")) {
          setSolved((prev) => [
            {
              id: crypto.randomUUID(),
              title: conv.title,
              subject: conv.subject,
              difficulty: "medium" as const,
              solvedAt: new Date().toISOString(),
              answerPreview: lastAi.text.slice(0, 120),
              bookmarked: false,
            },
            ...prev,
          ].slice(0, 50));
        }
        return;
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const title =
            c.title === "New conversation" && messages[0]?.role === "user"
              ? messages[0].text.slice(0, 48) + (messages[0].text.length > 48 ? "…" : "")
              : c.title;
          return { ...c, messages, title, updatedAt: new Date().toISOString() };
        })
      );
    },
    [activeId, subjectParam]
  );

  const stats = useMemo(() => {
    const questionsAsked = dbHistory.length + conversations.reduce((s, c) => s + c.messages.filter((m) => m.role === "user").length, 0);
    const studyHours = Math.max(1, Math.round(questionsAsked * 0.15));
    return {
      questionsAsked,
      studyHours,
      solvedCount: solved.length,
      recommended: session?.courses?.[0]?.title ?? "Your enrolled courses",
    };
  }, [dbHistory, conversations, solved, session?.courses]);

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [conversations, search]);

  if (sessionLoading) {
    return <p className="text-sm text-slate-500">Loading AI Tutor…</p>;
  }

  const chatMode =
    view === "formulas" ? "formula" : view === "diagrams" ? "diagram" : view === "revision" ? "revision" : "default";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your 24/7 digital lecturer — step-by-step explanations for every faculty and subject.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="Questions Asked"
          value={String(stats.questionsAsked)}
          sub="Learning interactions"
          tone="blue"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <DashboardStat
          label="Study Hours"
          value={`~${stats.studyHours}h`}
          sub="Estimated from AI sessions"
          tone="violet"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <DashboardStat
          label="Solved Problems"
          value={String(stats.solvedCount)}
          sub="Saved explanations"
          tone="emerald"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <DashboardStat
          label="Recommended"
          value="Topics"
          sub={stats.recommended}
          tone="yellow"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          }
        />
      </section>

      {view === "" || view === "formulas" || view === "diagrams" || view === "revision" ? (
        <AiTutorChat
          key={activeId ?? "new-chat"}
          subject={subjectParam || undefined}
          mode={chatMode}
          initialMessages={activeConversation?.messages ?? []}
          showSidebar
          conversations={conversations.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))}
          onSelectConversation={setActiveId}
          onNewChat={() => {
            const c = newConversation(subjectParam || "general");
            setConversations((prev) => [c, ...prev]);
            setActiveId(c.id);
          }}
          onClearChat={() => {
            if (activeId) {
              setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, messages: [] } : c)));
            }
          }}
          onMessagesChange={persistMessages}
        />
      ) : view === "conversations" ? (
        <ConversationsView
          conversations={filteredConversations}
          search={search}
          onSearch={setSearch}
          onOpen={(id) => {
            setActiveId(id);
            window.location.href = "/student/ai-tutor";
          }}
          onDelete={(id) => setConversations((prev) => prev.filter((c) => c.id !== id))}
          onBookmark={(id) =>
            setConversations((prev) =>
              prev.map((c) => (c.id === id ? { ...c, bookmarked: !c.bookmarked } : c))
            )
          }
        />
      ) : view === "subjects" ? (
        <SubjectsView activeSubject={subjectParam} />
      ) : view === "solved" ? (
        <SolvedView items={solved} onBookmark={(id) => setSolved((prev) => prev.map((s) => (s.id === id ? { ...s, bookmarked: !s.bookmarked } : s)))} />
      ) : view === "planner" ? (
        <PlannerView items={planner} courses={session?.courses ?? []} onUpdate={setPlanner} />
      ) : view === "recommended" ? (
        <RecommendedView courses={session?.courses ?? []} history={dbHistory} />
      ) : view === "analytics" ? (
        <AnalyticsView conversations={conversations} solved={solved} dbHistory={dbHistory} program={session?.profile?.program} />
      ) : (
        <AiTutorChat mode={chatMode} onMessagesChange={persistMessages} />
      )}

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold text-slate-600">AI safety</p>
        <p className="mt-1 text-xs text-slate-500">
          The AI Tutor provides educational guidance only. It encourages learning and does not give direct exam answers
          during assessments.
        </p>
      </section>
    </div>
  );
}

function ConversationsView({
  conversations,
  search,
  onSearch,
  onOpen,
  onDelete,
  onBookmark,
}: {
  conversations: AiConversation[];
  search: string;
  onSearch: (v: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onBookmark: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search conversations…"
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm"
      />
      {conversations.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
          No conversations yet. Start chatting on Ask AI.
        </p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <motion.div
              key={c.id}
              layout
              className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-500">
                  {c.subject} • {new Date(c.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onBookmark(c.id)} className="rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ring-slate-200">
                  {c.bookmarked ? "Saved" : "Save"}
                </button>
                <button type="button" onClick={() => onOpen(c.id)} className="rounded-lg bg-[#0B3D91] px-3 py-1.5 text-xs font-bold text-white">
                  Continue
                </button>
                <button type="button" onClick={() => onDelete(c.id)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200">
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function SubjectsView({ activeSubject }: { activeSubject: string }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subjectTutors.map((t) => (
        <Link
          key={t.id}
          href={`/student/ai-tutor?subject=${t.id}`}
          className={[
            "rounded-2xl bg-white p-5 shadow-sm ring-1 transition-shadow hover:shadow-md",
            activeSubject === t.id ? "ring-[#FFC107]" : "ring-slate-200/80",
          ].join(" ")}
        >
          <span className="text-2xl">{t.icon}</span>
          <h3 className="mt-2 font-bold text-slate-900">{t.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{t.description}</p>
          <p className="mt-3 text-xs font-bold text-[#0B3D91]">Start tutoring →</p>
        </Link>
      ))}
    </section>
  );
}

function SolvedView({
  items,
  onBookmark,
}: {
  items: SolvedQuestion[];
  onBookmark: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
          Solved questions appear here after you chat with the AI Tutor.
        </p>
      ) : (
        items.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500">
                  {s.subject} • {s.difficulty} • {new Date(s.solvedAt).toLocaleDateString()}
                </p>
              </div>
              <button type="button" onClick={() => onBookmark(s.id)} className="text-xs font-bold text-[#0B3D91]">
                {s.bookmarked ? "Bookmarked" : "Bookmark"}
              </button>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{s.answerPreview}</p>
          </div>
        ))
      )}
    </section>
  );
}

function PlannerView({
  items,
  courses,
  onUpdate,
}: {
  items: StudyPlanItem[];
  courses: { title: string; code: string }[];
  onUpdate: (items: StudyPlanItem[]) => void;
}) {
  const [topic, setTopic] = useState("");
  const [course, setCourse] = useState(courses[0]?.code ?? "");

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="font-bold text-slate-900">AI Study Planner</h2>
        <p className="mt-1 text-sm text-slate-500">Plan daily revision and track goals.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic to study"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          />
          <select value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            {courses.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!topic.trim()) return;
              onUpdate([
                {
                  id: crypto.randomUUID(),
                  day: new Date().toLocaleDateString(undefined, { weekday: "long" }),
                  course,
                  topic: topic.trim(),
                  durationMinutes: 45,
                  completed: false,
                },
                ...items,
              ]);
              setTopic("");
            }}
            className="rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-bold text-white"
          >
            Add task
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No study tasks yet.</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() =>
                  onUpdate(items.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)))
                }
                className="h-4 w-4 accent-[#0B3D91]"
              />
              <div>
                <p className={`font-medium ${item.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                  {item.topic}
                </p>
                <p className="text-xs text-slate-500">
                  {item.course} • {item.durationMinutes} min • {item.day}
                </p>
              </div>
            </label>
          ))
        )}
      </div>
    </section>
  );
}

function RecommendedView({
  courses,
  history,
}: {
  courses: { title: string; code: string }[];
  history: AiTutorHistoryItem[];
}) {
  const topics = useMemo(() => {
    const fromCourses = courses.map((c) => ({ title: `Revise ${c.title}`, code: c.code }));
    const fromHistory = history.slice(0, 5).map((h) => ({ title: h.question.slice(0, 60), code: "Review" }));
    return [...fromCourses, ...fromHistory];
  }, [courses, history]);

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {topics.length === 0 ? (
        <p className="text-sm text-slate-500">Enroll in courses to get recommendations.</p>
      ) : (
        topics.map((t, i) => (
          <Link
            key={`${t.title}-${i}`}
            href="/student/ai-tutor"
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 hover:ring-[#0B3D91]/30"
          >
            <p className="text-xs font-bold text-[#0B3D91]">{t.code}</p>
            <p className="mt-1 font-semibold text-slate-900">{t.title}</p>
          </Link>
        ))
      )}
    </section>
  );
}

function AnalyticsView({
  conversations,
  solved,
  dbHistory,
  program,
}: {
  conversations: AiConversation[];
  solved: SolvedQuestion[];
  dbHistory: AiTutorHistoryItem[];
  program?: string;
}) {
  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of conversations) {
      map.set(c.subject, (map.get(c.subject) ?? 0) + c.messages.filter((m) => m.role === "user").length);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [conversations]);

  const total = dbHistory.length + conversations.reduce((s, c) => s + c.messages.length, 0);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="font-bold text-slate-900">Learning analytics</h2>
        <p className="mt-1 text-sm text-slate-500">{program ?? "Your program"}</p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-slate-600">Total interactions</span>
            <span className="font-bold">{total}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-600">Conversations saved</span>
            <span className="font-bold">{conversations.length}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-600">Problems solved</span>
            <span className="font-bold">{solved.length}</span>
          </li>
        </ul>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="font-bold text-slate-900">Subject activity</h2>
        <div className="mt-4 space-y-3">
          {bySubject.length === 0 ? (
            <p className="text-sm text-slate-500">Start chatting to see insights.</p>
          ) : (
            bySubject.map(([sub, count]) => {
              const max = bySubject[0]?.[1] ?? 1;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={sub}>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize text-slate-700">{sub.replace("-", " ")}</span>
                    <span>{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
