"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useStudentSession } from "@/contexts/student-session-context";
import { useStudentPreference } from "@/hooks/use-student-preference";
import { STUDENT_PREF_KEYS } from "@/lib/student-preference-keys";
import { TransitAiAssistant } from "@/components/ai/transit-ai-assistant";
import { AiTutorChat } from "@/components/student/ai-tutor/ai-tutor-chat";
import { getAiTutorViewTitle } from "@/components/student/ai-tutor/ai-tutor-nav-config";
import type {
  AiConversation,
  ChatMessage,
  SolvedQuestion,
  StudyPlanItem,
} from "@/types/student-ai-tutor";

type Props = { segment?: string[] };

const EMPTY_CONVERSATIONS: AiConversation[] = [];
const EMPTY_SOLVED: SolvedQuestion[] = [];
const EMPTY_PLANNER: StudyPlanItem[] = [];

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

  const { data: session } = useStudentSession();

  const [conversations, setConversations] = useStudentPreference(
    STUDENT_PREF_KEYS.aiConversations,
    EMPTY_CONVERSATIONS
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [solved, setSolved] = useStudentPreference(STUDENT_PREF_KEYS.aiSolved, EMPTY_SOLVED);
  const [planner, setPlanner] = useStudentPreference(STUDENT_PREF_KEYS.aiPlanner, EMPTY_PLANNER);
  const [search, setSearch] = useState("");

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

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [conversations, search]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Title only for non-chat views */}
      {view !== "" && (
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      )}

      {view === "" ? (
        <div className="min-h-0 flex-1">
          <TransitAiAssistant
            roleLabel="Student"
            feature={subjectParam || "academic tutoring"}
            suggestions={[
              "Explain this topic step by step.",
              "Summarize my lecture notes.",
              "Create a study guide for my upcoming exam.",
              "Help me solve this assignment question.",
            ]}
          />
        </div>
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
      ) : view === "solved" ? (
        <SolvedView
          items={solved}
          onBookmark={(id) => setSolved((prev) => prev.map((s) => (s.id === id ? { ...s, bookmarked: !s.bookmarked } : s)))}
        />
      ) : view === "planner" ? (
        <PlannerView items={planner} courses={session?.courses ?? []} onUpdate={setPlanner} />
      ) : (
        /* Unknown route — fall back to chat */
        <div className="min-h-0 flex-1">
          <AiTutorChat onMessagesChange={persistMessages} />
        </div>
      )}
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

/* ── Solved Questions ───────────────────────────────────────────── */
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
        <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
          Solved questions will appear here after you chat with the AI Tutor.
        </p>
      ) : (
        items.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {s.subject} · {s.difficulty} · {new Date(s.solvedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onBookmark(s.id)}
                className={`text-xs font-bold ${s.bookmarked ? "text-[#FFC107]" : "text-slate-400 hover:text-[#0B3D91]"}`}
              >
                {s.bookmarked ? "★ Saved" : "☆ Save"}
              </button>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{s.answerPreview}</p>
          </div>
        ))
      )}
    </section>
  );
}

/* ── Study Planner ──────────────────────────────────────────────── */
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
        <h2 className="font-bold text-slate-900">Study Planner</h2>
        <p className="mt-0.5 text-sm text-slate-500">Plan daily revision sessions and track your goals.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic to study…"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0B3D91]/40 focus:ring-2 focus:ring-[#0B3D91]/10"
          />
          {courses.length > 0 && (
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            >
              {courses.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.title}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => {
              if (!topic.trim()) return;
              onUpdate([
                {
                  id: crypto.randomUUID(),
                  day: new Date().toLocaleDateString(undefined, { weekday: "long" }),
                  course: course || "General",
                  topic: topic.trim(),
                  durationMinutes: 45,
                  completed: false,
                },
                ...items,
              ]);
              setTopic("");
            }}
            className="rounded-xl bg-[#0B3D91] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0B3D91]/90"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
            No study tasks yet. Add your first topic above.
          </p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 transition hover:ring-slate-300"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() =>
                  onUpdate(items.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)))
                }
                className="h-4 w-4 accent-[#0B3D91]"
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${item.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                  {item.topic}
                </p>
                <p className="text-xs text-slate-500">
                  {item.course} · {item.durationMinutes} min · {item.day}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onUpdate(items.filter((i) => i.id !== item.id)); }}
                className="shrink-0 text-xs text-slate-400 hover:text-rose-500"
                aria-label="Remove task"
              >
                ✕
              </button>
            </label>
          ))
        )}
      </div>
    </section>
  );
}
