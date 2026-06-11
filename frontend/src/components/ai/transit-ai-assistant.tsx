"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  AI_MODEL_PROFILES,
  type AiModelProfileId,
} from "@/lib/ai-models";
import { requestApi } from "@/lib/fetch-api";
import { showDeleteConfirm } from "@/lib/swal";

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type Usage = {
  messagesUsed: number;
  totalTokensUsed: number;
  lastUsageAt: string | null;
};

type Props = {
  roleLabel: string;
  feature?: string;
  suggestions?: string[];
};

const DEFAULT_SUGGESTIONS = [
  "Explain this topic step by step.",
  "Summarize my notes into key points.",
  "Create a study guide for my exam.",
  "Help me understand this assignment question.",
];

export function TransitAiAssistant({
  roleLabel,
  feature,
  suggestions = DEFAULT_SUGGESTIONS,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [modelProfile, setModelProfile] = useState<AiModelProfileId>("light");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const result = await requestApi<{ conversations: Conversation[]; usage: Usage | null }>(
      "/api/ai/assistant",
      { silent: true },
    );
    if (result.ok) {
      setConversations(result.data.conversations);
      setUsage(result.data.usage);
    }
    setBootLoading(false);
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    const result = await requestApi<{ conversation: { messages: ChatMessage[] }; usage: Usage | null }>(
      `/api/ai/assistant?conversationId=${encodeURIComponent(conversationId)}`,
      { silent: true },
    );
    if (result.ok) {
      setMessages(result.data.conversation.messages);
      setUsage(result.data.usage);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) void loadConversation(activeId);
    else setMessages([]);
  }, [activeId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startNewChat = async () => {
    const result = await requestApi<{ conversation: Conversation }>("/api/ai/assistant", {
      method: "POST",
      body: { action: "create_conversation" },
    });
    if (result.ok) {
      setConversations((prev) => [result.data.conversation, ...prev]);
      setActiveId(result.data.conversation.id);
      setMessages([]);
    }
  };

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    let conversationId = activeId;
    if (!conversationId) {
      const created = await requestApi<{ conversation: Conversation }>("/api/ai/assistant", {
        method: "POST",
        body: { action: "create_conversation" },
      });
      if (!created.ok) return;
      conversationId = created.data.conversation.id;
      setActiveId(conversationId);
      setConversations((prev) => [created.data.conversation, ...prev]);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const result = await requestApi<{
      conversationId: string;
      message: ChatMessage;
    }>("/api/ai/assistant", {
      method: "POST",
      body: {
        action: "send_message",
        conversationId,
        question,
        modelProfile,
        feature,
      },
    });

    setLoading(false);
    if (result.ok) {
      setMessages((prev) => [...prev, result.data.message]);
      void loadConversations();
      if (!activeId) setActiveId(result.data.conversationId);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleRename = async (conversationId: string) => {
    if (!renameValue.trim()) return;
    await requestApi("/api/ai/assistant", {
      method: "POST",
      body: { action: "rename_conversation", conversationId, title: renameValue },
    });
    setRenamingId(null);
    void loadConversations();
  };

  const handleDelete = async (conversationId: string, title: string) => {
    const confirmed = await showDeleteConfirm(`Delete "${title}"?`);
    if (!confirmed) return;
    await requestApi("/api/ai/assistant", {
      method: "POST",
      body: { action: "delete_conversation", conversationId },
    });
    if (activeId === conversationId) {
      setActiveId(null);
      setMessages([]);
    }
    void loadConversations();
  };

  if (bootLoading) {
    return <div className="flex h-[70vh] items-center justify-center text-sm text-slate-500">Loading AI Assistant…</div>;
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex">
        <div className="border-b border-slate-200 p-4">
          <button
            type="button"
            onClick={() => void startNewChat()}
            className="w-full rounded-lg bg-[#0B3D91] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3580]"
          >
            + New Chat
          </button>
          {usage ? (
            <p className="mt-3 text-xs text-slate-500">
              {usage.messagesUsed} messages · {usage.totalTokensUsed.toLocaleString()} tokens
            </p>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={[
                "group mb-1 rounded-lg px-3 py-2",
                activeId === conversation.id ? "bg-white shadow-sm" : "hover:bg-white/80",
              ].join(" ")}
            >
              {renamingId === conversation.id ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleRename(conversation.id);
                  }}
                >
                  <input
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    autoFocus
                  />
                </form>
              ) : (
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveId(conversation.id)}
                    className="flex-1 text-left text-sm text-slate-800"
                  >
                    <span className="line-clamp-2 font-medium">{conversation.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {conversation._count?.messages ?? 0} messages
                    </span>
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      title="Rename"
                      onClick={() => {
                        setRenamingId(conversation.id);
                        setRenameValue(conversation.title);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => void handleDelete(conversation.id, conversation.title)}
                      className="text-xs text-rose-500 hover:text-rose-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI Assistant</h2>
            <p className="text-xs text-slate-500">{roleLabel} · ChatGPT-style workspace</p>
          </div>
          <select
            value={modelProfile}
            onChange={(event) => setModelProfile(event.target.value as AiModelProfileId)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            {AI_MODEL_PROFILES.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-2xl font-bold text-slate-900">How can I help you today?</h3>
              <p className="mt-2 text-sm text-slate-500">Start a new chat or pick a suggestion below.</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 hover:bg-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={[
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "ml-8 bg-[#0B3D91] text-white"
                      : "mr-8 border border-slate-200 bg-slate-50 text-slate-800",
                  ].join(" ")}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
              {loading ? (
                <div className="mr-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Thinking…
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
          <div className="mx-auto flex max-w-3xl gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Message Transit AI…"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0B3D91]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-[#0B3D91] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
