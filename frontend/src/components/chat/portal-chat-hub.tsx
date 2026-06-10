"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import type { AppRole } from "@/types/app";

type CourseRoom = {
  id: string;
  courseCode: string;
  courseTitle: string;
  threadKey: string;
  lecturerName?: string | null;
};

type DirectContact = {
  userId: string;
  fullName: string;
  studentId?: string;
  threadKey: string;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderRole: string;
};

type Props = {
  role: Extract<AppRole, "student" | "lecturer">;
};

const POLL_MS = 5000;

export function PortalChatHub({ role }: Props) {
  const endpoint = role === "student" ? "/api/student/chat" : "/api/lecturer/chat";
  const [tab, setTab] = useState<"course" | "direct">("course");
  const [courseRooms, setCourseRooms] = useState<CourseRoom[]>([]);
  const [directContacts, setDirectContacts] = useState<DirectContact[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadRooms = useCallback(async () => {
    const result = await requestApi<{ courseRooms: CourseRoom[]; directContacts: DirectContact[] }>(endpoint, {
      silent: true,
    });
    if (result.ok) {
      setCourseRooms(result.data.courseRooms ?? []);
      setDirectContacts(result.data.directContacts ?? []);
      if (!selectedCourseId && result.data.courseRooms?.[0]) {
        setSelectedCourseId(result.data.courseRooms[0].id);
      }
      if (!selectedPeerId && result.data.directContacts?.[0]) {
        setSelectedPeerId(result.data.directContacts[0].userId);
      }
    }
    setLoading(false);
  }, [endpoint, selectedCourseId, selectedPeerId]);

  const loadMessages = useCallback(async () => {
    if (tab === "course" && !selectedCourseId) return;
    if (tab === "direct" && !selectedPeerId) return;

    const params = new URLSearchParams({ kind: "messages", threadKind: tab === "course" ? "COURSE" : "DIRECT" });
    if (tab === "course" && selectedCourseId) params.set("courseId", selectedCourseId);
    if (tab === "direct" && selectedPeerId) params.set("peerUserId", selectedPeerId);

    const result = await requestApi<{ messages: ChatMessage[] }>(`${endpoint}?${params.toString()}`, {
      silent: true,
    });
    if (result.ok) {
      setMessages(result.data.messages ?? []);
    }
  }, [endpoint, tab, selectedCourseId, selectedPeerId]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    const result = await requestApi(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: tab === "course" ? "COURSE" : "DIRECT",
        body: text,
        courseId: tab === "course" ? selectedCourseId : undefined,
        peerUserId: tab === "direct" ? selectedPeerId : undefined,
      }),
      silent: true,
    });
    setSending(false);

    if (result.ok) {
      setDraft("");
      void loadMessages();
    }
  };

  const selectedCourse = courseRooms.find((room) => room.id === selectedCourseId);
  const selectedContact = directContacts.find((contact) => contact.userId === selectedPeerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Chat</h1>
        <p className="mt-1 text-sm text-slate-600">
          {role === "student"
            ? "Message classmates in course rooms or chat directly with your lecturers."
            : "Join course chat rooms and reply to students one-to-one."}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("course")}
          className={[
            "rounded-lg px-4 py-2 text-sm font-medium",
            tab === "course" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          Course rooms
        </button>
        <button
          type="button"
          onClick={() => setTab("direct")}
          className={[
            "rounded-lg px-4 py-2 text-sm font-medium",
            tab === "direct" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          Direct messages
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {tab === "course" ? "Course chat rooms" : "Contacts"}
          </div>
          {loading ? (
            <p className="px-4 py-6 text-sm text-slate-500">Loading…</p>
          ) : tab === "course" ? (
            courseRooms.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No course rooms yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {courseRooms.map((room) => (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCourseId(room.id)}
                      className={[
                        "w-full px-4 py-3 text-left text-sm transition-colors",
                        selectedCourseId === room.id ? "bg-[#0B3D91]/10 text-[#0B3D91]" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <p className="font-medium">{room.courseCode}</p>
                      <p className="truncate text-xs text-slate-500">{room.courseTitle}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : directContacts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No contacts yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {directContacts.map((contact) => (
                <li key={contact.userId}>
                  <button
                    type="button"
                    onClick={() => setSelectedPeerId(contact.userId)}
                    className={[
                      "w-full px-4 py-3 text-left text-sm transition-colors",
                      selectedPeerId === contact.userId ? "bg-[#0B3D91]/10 text-[#0B3D91]" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <p className="font-medium">{contact.fullName}</p>
                    {contact.studentId ? (
                      <p className="text-xs text-slate-500">{contact.studentId}</p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[28rem] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {tab === "course"
                ? selectedCourse
                  ? `${selectedCourse.courseCode} — ${selectedCourse.courseTitle}`
                  : "Select a course room"
                : selectedContact
                  ? selectedContact.fullName
                  : "Select a contact"}
            </p>
            {tab === "course" && selectedCourse?.lecturerName ? (
              <p className="text-xs text-slate-500">Lecturer: {selectedCourse.lecturerName}</p>
            ) : null}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{message.senderName}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-800">{message.body}</p>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 p-4">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91]/40 focus:ring-2 focus:ring-[#0B3D91]/10"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-lg bg-[#0B3D91] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3580] disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
