"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AI_MODEL_PROFILES,
  getAiModelProfile,
  type AiModelProfileId,
} from "@/lib/ai-models";

export type TransitAiMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  createdAt: string;
};

type Props = {
  apiUrl: string;
  title?: string;
  subtitle?: string;
  subject?: string;
  mode?: "formula" | "diagram" | "revision" | "default";
  courseTitle?: string;
  initialMessages?: TransitAiMessage[];
  suggestions?: string[];
  onMessagesChange?: (messages: TransitAiMessage[]) => void;
};

const DEFAULT_SUGGESTIONS = [
  "Explain a topic step-by-step.",
  "Help me solve a science problem.",
  "Summarize key points for revision.",
  "Break down a formula with examples.",
];

export function TransitAiPanel({
  apiUrl,
  title = "Transit College S/L AI Assistant",
  subtitle = "Powered by local Ollama models",
  subject,
  mode = "default",
  courseTitle,
  initialMessages = [],
  suggestions = DEFAULT_SUGGESTIONS,
  onMessagesChange,
}: Props) {
  const [modelProfile, setModelProfile] = useState<AiModelProfileId>("light");
  const [messages, setMessages] = useState<TransitAiMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSource, setLastSource] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || loading) return;

      const userMsg: TransitAiMessage = {
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
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q,
            subject,
            mode,
            courseTitle,
            modelProfile,
          }),
        });
        const json = await res.json();
        const aiMsg: TransitAiMessage = {
          id: json.id ?? crypto.randomUUID(),
          role: "ai",
          text: json.answer ?? json.error ?? "No response.",
          createdAt: new Date().toISOString(),
        };
        const updated = [...next, aiMsg];
        setMessages(updated);
        onMessagesChange?.(updated);
        setLastSource(json.source === "ollama" ? getAiModelProfile(modelProfile).model : "Offline tutor");
      } catch {
        const errMsg: TransitAiMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          text: "AI is temporarily unavailable. Ensure Ollama is running and the selected model is installed.",
          createdAt: new Date().toISOString(),
        };
        const updated = [...next, errMsg];
        setMessages(updated);
        onMessagesChange?.(updated);
        setLastSource(null);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, courseTitle, loading, messages, mode, modelProfile, onMessagesChange, subject]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {AI_MODEL_PROFILES.map((profile) => {
          const active = modelProfile === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => setModelProfile(profile.id)}
              className={[
                "rounded-2xl border p-4 text-left transition",
                active
                  ? "border-[#0B3D91] bg-[#0B3D91]/5 ring-2 ring-[#0B3D91]/15"
                  : "border-slate-200 bg-white hover:border-slate-300",
              ].join(" ")}
            >
              <p className="text-sm font-bold text-slate-900">{profile.label}</p>
              <p className="mt-1 text-xs text-slate-500">{profile.description}</p>
              <p className="mt-2 font-mono text-[11px] text-[#0B3D91]">{profile.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-[520px] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFC107] text-sm font-extrabold text-[#0B3D91]">
              AI
            </div>
            <div>
              <p className="font-bold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          {lastSource ? (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {lastSource}
            </span>
          ) : null}
        </div>

        <div
          className="flex-1 space-y-3 overflow-y-auto bg-slate-50/80 p-4"
          style={{ maxHeight: "min(60vh, 480px)" }}
        >
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Choose a model above, then ask academic questions. Responses run locally through Ollama when available.
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "max-w-[92%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-[#0B3D91] text-white"
                    : "bg-white text-slate-800 ring-1 ring-slate-200",
                ].join(" ")}
              >
                {m.text}
              </div>
            ))
          )}
          {loading ? (
            <p className="text-xs font-medium text-slate-500">Thinking with {getAiModelProfile(modelProfile).model}…</p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask your question…"
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
        </div>
      </div>
    </div>
  );
}
