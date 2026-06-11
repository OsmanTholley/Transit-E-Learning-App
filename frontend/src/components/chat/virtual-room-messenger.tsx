"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { CHAT_POLL_MS } from "@/lib/live-classroom-config";

type MessengerMessage = {
  id: string;
  body: string;
  messageType: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  isPinned?: boolean;
  isHighlighted?: boolean;
};

type Props = {
  liveClassId: string;
  active?: boolean;
};

export function VirtualRoomMessenger({ liveClassId, active = true }: Props) {
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const endpoint = `/api/live-classes/${liveClassId}/messenger`;

  const loadMessages = useCallback(async () => {
    const result = await requestApi<{
      messages: MessengerMessage[];
      currentUserId: string;
      isHost?: boolean;
    }>(endpoint, { silent: true });
    if (result.ok) {
      const next = result.data.messages ?? [];
      const lastId = next[next.length - 1]?.id ?? null;
      setMessages(next);
      setCurrentUserId(result.data.currentUserId);
      setIsHost(Boolean(result.data.isHost));
      if (lastId !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastId;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [endpoint]);

  useEffect(() => {
    if (!active) return;
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), CHAT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [active, loadMessages]);

  const sendText = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    const result = await requestApi(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, messageType: "TEXT" }),
      silent: true,
    });
    setSending(false);
    if (result.ok) {
      setDraft("");
      void loadMessages();
    }
  };

  const moderate = async (messageId: string, action: "delete" | "pin" | "highlight") => {
    const result = await requestApi(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, messageId }),
      silent: true,
    });
    if (result.ok) void loadMessages();
  };

  const pinned = messages.find((message) => message.isPinned);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {pinned ? (
        <div className="mb-2 rounded-lg border border-[#FFC107]/40 bg-[#FFC107]/10 px-3 py-2 text-xs text-[#FFC107]">
          📌 {pinned.body}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-xs text-white/40">Ask a text question during the session.</p>
        ) : null}
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                message.isHighlighted
                  ? "border border-[#FFC107]/50 bg-[#FFC107]/10"
                  : isMine
                    ? "bg-[#0B3D91]/50"
                    : "bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-medium text-[#FFC107]">
                  {message.senderName} · {message.senderRole.toLowerCase()}
                </p>
                {isHost ? (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => void moderate(message.id, "highlight")}
                      className="text-[10px] text-white/50 hover:text-[#FFC107]"
                      title="Highlight question"
                    >
                      ★
                    </button>
                    <button
                      type="button"
                      onClick={() => void moderate(message.id, "pin")}
                      className="text-[10px] text-white/50 hover:text-[#FFC107]"
                      title="Pin message"
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      onClick={() => void moderate(message.id, "delete")}
                      className="text-[10px] text-white/50 hover:text-red-400"
                      title="Delete message"
                    >
                      ✕
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-0.5 text-white/90">{message.body}</p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendText} className="mt-2 flex gap-2 border-t border-white/10 pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question…"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#252423] px-3 py-2 text-sm text-white outline-none focus:border-[#FFC107]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-md bg-[#FFC107] px-3 py-2 text-sm font-medium text-[#0B3D91] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
