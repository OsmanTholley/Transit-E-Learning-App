"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatBubble, SuggestionChip, TypingIndicator } from "@/components/student/ai-tutor/ai-tutor-ui";
import {
  AI_MODEL_PROFILES,
  getAiModelProfile,
  type AiModelProfileId,
} from "@/lib/ai-models";
import type { ChatMessage } from "@/types/student-ai-tutor";

const DEFAULT_SUGGESTIONS = [
  "What is reflection of light?",
  "Explain Snell's Law with examples.",
  "Solve a physics calculation step-by-step.",
  "Summarize database normalization.",
];

type Props = {
  subject?: string;
  mode?: "formula" | "diagram" | "revision" | "default";
  initialMessages?: ChatMessage[];
  conversationId?: string | null;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  showSidebar?: boolean;
  conversations?: { id: string; title: string; updatedAt: string }[];
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  onClearChat?: () => void;
};

export function AiTutorChat({
  subject,
  mode = "default",
  initialMessages = [],
  onMessagesChange,
  showSidebar = false,
  conversations = [],
  onSelectConversation,
  onNewChat,
  onClearChat,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelProfile, setModelProfile] = useState<AiModelProfileId>("light");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || loading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: q,
        createdAt: new Date().toISOString(),
      };

      const next = [...messages, userMsg];
      setMessages(next);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/student/ai-tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, subject, mode, modelProfile }),
        });
        const json = await res.json();
        const aiMsg: ChatMessage = {
          id: json.id ?? crypto.randomUUID(),
          role: "ai",
          text: json.answer ?? json.error ?? "No response.",
          createdAt: new Date().toISOString(),
        };
        const updated = [...next, aiMsg];
        setMessages(updated);
        onMessagesChange?.(updated);
      } catch {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          text: "AI Tutor is temporarily unavailable. Please try again.",
          createdAt: new Date().toISOString(),
        };
        const updated = [...next, errMsg];
        setMessages(updated);
        onMessagesChange?.(updated);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, subject, mode, modelProfile, onMessagesChange]
  );

  return (
    <div className="flex min-h-[520px] flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {AI_MODEL_PROFILES.map((profile) => {
          const active = modelProfile === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => setModelProfile(profile.id)}
              className={[
                "rounded-xl border p-3 text-left text-xs transition",
                active
                  ? "border-[#0B3D91] bg-[#0B3D91]/5 ring-2 ring-[#0B3D91]/15"
                  : "border-slate-200 bg-white hover:border-slate-300",
              ].join(" ")}
            >
              <p className="font-bold text-slate-900">{profile.label}</p>
              <p className="mt-0.5 text-slate-500">{profile.description}</p>
              <p className="mt-1 font-mono text-[10px] text-[#0B3D91]">{profile.hint}</p>
            </button>
          );
        })}
      </div>

    <div className="flex min-h-[520px] gap-4">
      {showSidebar ? (
        <aside className="hidden w-56 shrink-0 flex-col rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80 lg:flex">
          <button
            type="button"
            onClick={onNewChat}
            className="mb-3 rounded-xl bg-[#FFC107] px-3 py-2 text-xs font-bold text-[#0B3D91]"
          >
            + New chat
          </button>
          <button
            type="button"
            onClick={onClearChat}
            className="mb-3 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
          >
            Clear chat
          </button>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">History</p>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-500">No saved chats yet</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectConversation?.(c.id)}
                  className="block w-full truncate rounded-lg px-2 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {c.title}
                </button>
              ))
            )}
          </div>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFC107] text-sm font-extrabold text-[#0B3D91]">
            AI
          </div>
          <div>
            <p className="font-bold text-slate-900">Transit College S/L AI Tutor</p>
            <p className="text-xs text-slate-500">
              Patient lecturer • Model: {getAiModelProfile(modelProfile).model}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/80 p-4" style={{ maxHeight: "min(60vh, 480px)" }}>
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Ask anything about your courses. I explain step-by-step like a patient lecturer.
              </p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_SUGGESTIONS.map((s) => (
                  <SuggestionChip key={s} onClick={() => void send(s)}>
                    {s}
                  </SuggestionChip>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <ChatBubble key={m.id} role={m.role} text={m.text} />)
          )}
          {loading ? <TypingIndicator /> : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
              📎 Upload
              <input type="file" className="hidden" accept="image/*,.pdf" disabled title="Coming soon" />
            </label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask your academic question…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
            />
            <button
              type="button"
              onClick={() => void send(input)}
              disabled={loading}
              className="rounded-xl bg-[#0B3D91] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0B3D91]/90 disabled:opacity-60"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Local Ollama models • Falls back to offline tutor if Ollama is unavailable
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
