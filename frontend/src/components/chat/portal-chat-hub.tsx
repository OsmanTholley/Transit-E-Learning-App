"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { requestApi } from "@/lib/fetch-api";
import { directThreadKey, groupThreadKey, SOCKET_EVENTS, threadRoom } from "@/lib/socket-events";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { showDeleteConfirm, showError, showSuccess } from "@/lib/swal";
import type { AppRole } from "@/types/app";

type Contact = {
  userId: string;
  fullName: string;
  role: string;
  studentId?: string | null;
  staffId?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  programId?: string | null;
  programName?: string | null;
  threadKey: string;
};

type ChatGroup = {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  memberCount: number;
  threadKey: string;
  members: Array<{ userId: string; fullName: string; role: string }>;
};

type CourseRoom = {
  id: string;
  courseCode: string;
  courseTitle: string;
  threadKey: string;
  lecturerName?: string | null;
};

type ChatMessage = {
  id: string;
  body: string;
  messageType?: string;
  audioData?: string | null;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  edited?: boolean;
  readStatus?: "sent" | "delivered" | "read";
};

type FilterOption = { id: string; name: string; departmentId?: string | null };

type ActiveThread =
  | { kind: "DIRECT"; peerUserId: string; title: string; subtitle?: string }
  | { kind: "GROUP"; groupId: string; title: string; subtitle?: string; group?: ChatGroup }
  | { kind: "COURSE"; courseId: string; title: string; subtitle?: string };

type Props = {
  role: Extract<AppRole, "student" | "lecturer" | "admin">;
};

const POLL_MS = 30_000;

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role: string) {
  if (role === "STUDENT") return "Student";
  if (role === "LECTURER") return "Lecturer";
  if (role === "ADMIN") return "Admin";
  return role;
}

function readReceiptLabel(status?: ChatMessage["readStatus"]) {
  if (status === "read") return "✓✓";
  if (status === "delivered") return "✓✓";
  return "✓";
}

function threadUnreadCount(contact: Contact, unreadByThread: Record<string, number>) {
  return unreadByThread[contact.threadKey] ?? 0;
}

function roleBadgeClass(role: string) {
  if (role === "LECTURER") return "bg-violet-100 text-violet-700";
  if (role === "ADMIN") return "bg-amber-100 text-amber-800";
  return "bg-sky-100 text-sky-700";
}

export function PortalChatHub({ role }: Props) {
  const endpoint =
    role === "student" ? "/api/student/chat" : role === "lecturer" ? "/api/lecturer/chat" : "/api/admin/chat";

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [directThreads, setDirectThreads] = useState<Contact[]>([]);
  const [unreadByThread, setUnreadByThread] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [courseRooms, setCourseRooms] = useState<CourseRoom[]>([]);
  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [programs, setPrograms] = useState<FilterOption[]>([]);

  const [sidebarTab, setSidebarTab] = useState<"chats" | "people">("chats");
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STUDENT" | "LECTURER" | "ADMIN">("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "role" | "department">("name");

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const { joinRooms, leaveRooms, subscribe, emitTyping } = useSocket();

  const loadInbox = useCallback(async () => {
    const result = await requestApi<{
      contacts: Contact[];
      directThreads?: Contact[];
      groups: ChatGroup[];
      courseRooms: CourseRoom[];
      filters: { departments: FilterOption[]; programs: FilterOption[] };
      currentUserId: string;
      unreadByThread?: Record<string, number>;
      totalUnread?: number;
    }>(endpoint, { silent: true });

    if (result.ok) {
      setContacts(result.data.contacts ?? []);
      setDirectThreads(result.data.directThreads ?? []);
      setUnreadByThread(result.data.unreadByThread ?? {});
      setTotalUnread(result.data.totalUnread ?? 0);
      setGroups(result.data.groups ?? []);
      setCourseRooms(result.data.courseRooms ?? []);
      setDepartments(result.data.filters?.departments ?? []);
      setPrograms(result.data.filters?.programs ?? []);
      setCurrentUserId(result.data.currentUserId);
    }
    setLoading(false);
  }, [endpoint]);

  const loadMessages = useCallback(async () => {
    if (!activeThread) return;

    const params = new URLSearchParams({ kind: "messages", threadKind: activeThread.kind });
    if (activeThread.kind === "DIRECT") params.set("peerUserId", activeThread.peerUserId);
    if (activeThread.kind === "GROUP") params.set("groupId", activeThread.groupId);
    if (activeThread.kind === "COURSE") params.set("courseId", activeThread.courseId);

    const result = await requestApi<{ messages: ChatMessage[] }>(`${endpoint}?${params.toString()}`, {
      silent: true,
    });
    if (result.ok) {
      const next = result.data.messages ?? [];
      const lastId = next[next.length - 1]?.id ?? null;
      setMessages(next);
      if (lastId !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastId;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [endpoint, activeThread]);

  const sendVoiceMessage = useCallback(
    async (audioData: string) => {
      if (!activeThread || sending) return;
      setSending(true);
      const payload: Record<string, string> = { kind: activeThread.kind, messageType: "VOICE", audioData };
      if (activeThread.kind === "DIRECT") payload.peerUserId = activeThread.peerUserId;
      if (activeThread.kind === "GROUP") payload.groupId = activeThread.groupId;
      if (activeThread.kind === "COURSE") payload.courseId = activeThread.courseId;

      const result = await requestApi(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        silent: true,
      });
      setSending(false);
      if (result.ok) void loadMessages();
      else if (!result.offline) await showError("Could not send voice message", result.message);
    },
    [activeThread, endpoint, sending, loadMessages],
  );

  const { recording, toggleRecording } = useVoiceRecorder({
    onRecorded: sendVoiceMessage,
    onError: () => void showError("Microphone unavailable", "Allow microphone access to send voice messages."),
  });

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const activeThreadKey = useMemo(() => {
    if (!activeThread || !currentUserId) return null;
    if (activeThread.kind === "DIRECT") {
      return directThreadKey(currentUserId, activeThread.peerUserId);
    }
    if (activeThread.kind === "GROUP") return groupThreadKey(activeThread.groupId);
    return `course:${activeThread.courseId}`;
  }, [activeThread, currentUserId]);

  useEffect(() => {
    void loadMessages();
    if (!activeThreadKey) return undefined;
    const room = threadRoom(activeThreadKey);
    joinRooms([room]);
    const unsubscribe = subscribe(SOCKET_EVENTS.CHAT_MESSAGE, (payload) => {
      const data = payload as { threadKey?: string; message?: ChatMessage };
      if (data.threadKey === activeThreadKey && data.message) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === data.message!.id)) return prev;
          return [...prev, data.message!];
        });
        lastMessageIdRef.current = data.message.id;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    });
    const timer = window.setInterval(() => void loadMessages(), POLL_MS);
    return () => {
      window.clearInterval(timer);
      leaveRooms([room]);
      unsubscribe?.();
    };
  }, [loadMessages, activeThreadKey, joinRooms, leaveRooms, subscribe]);

  const filteredPrograms = useMemo(() => {
    if (!departmentFilter) return programs;
    return programs.filter((p) => p.departmentId === departmentFilter);
  }, [programs, departmentFilter]);

  const chatsTabDirectContacts = useMemo(() => {
    const merged = new Map<string, Contact>();
    for (const contact of contacts) merged.set(contact.userId, contact);
    for (const thread of directThreads) {
      if (!merged.has(thread.userId)) merged.set(thread.userId, thread);
    }
    let list = [...merged.values()];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.studentId?.toLowerCase().includes(q) ||
          c.departmentName?.toLowerCase().includes(q) ||
          c.programName?.toLowerCase().includes(q),
      );
    }

    if (roleFilter !== "ALL") {
      list = list.filter((c) => c.role === roleFilter);
    }

    return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [contacts, directThreads, search, roleFilter]);

  const filteredContacts = useMemo(() => {
    let list = [...contacts];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.studentId?.toLowerCase().includes(q) ||
          c.departmentName?.toLowerCase().includes(q) ||
          c.programName?.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "ALL") {
      list = list.filter((c) => c.role === roleFilter);
    }

    if (departmentFilter) {
      list = list.filter((c) => c.departmentId === departmentFilter);
    }

    if (programFilter) {
      list = list.filter((c) => c.programId === programFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "role") return a.role.localeCompare(b.role) || a.fullName.localeCompare(b.fullName);
      if (sortBy === "department") {
        const da = a.departmentName ?? "";
        const db = b.departmentName ?? "";
        return da.localeCompare(db) || a.fullName.localeCompare(b.fullName);
      }
      return a.fullName.localeCompare(b.fullName);
    });

    return list;
  }, [contacts, search, roleFilter, departmentFilter, programFilter, sortBy]);

  const openDirect = (contact: Contact) => {
    setActiveThread({
      kind: "DIRECT",
      peerUserId: contact.userId,
      title: contact.fullName,
      subtitle: [roleLabel(contact.role), contact.studentId, contact.departmentName].filter(Boolean).join(" · "),
    });
    setMobileShowChat(true);
    setSidebarTab("chats");
  };

  const openGroup = (group: ChatGroup) => {
    setActiveThread({
      kind: "GROUP",
      groupId: group.id,
      title: group.name,
      subtitle: `${group.memberCount} members`,
      group,
    });
    setMobileShowChat(true);
    setSidebarTab("chats");
  };

  const openCourse = (room: CourseRoom) => {
    setActiveThread({
      kind: "COURSE",
      courseId: room.id,
      title: `${room.courseCode} — ${room.courseTitle}`,
      subtitle: room.lecturerName ? `Lecturer: ${room.lecturerName}` : undefined,
    });
    setMobileShowChat(true);
    setSidebarTab("chats");
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending || !activeThread) return;

    setSending(true);
    const payload: Record<string, string> = { kind: activeThread.kind, body: text };
    if (activeThread.kind === "DIRECT") payload.peerUserId = activeThread.peerUserId;
    if (activeThread.kind === "GROUP") payload.groupId = activeThread.groupId;
    if (activeThread.kind === "COURSE") payload.courseId = activeThread.courseId;

    const result = await requestApi(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      silent: true,
    });
    setSending(false);

    if (result.ok) {
      setDraft("");
      void loadMessages();
    } else if (!result.offline) {
      await showError("Could not send", result.message);
    }
  };

  const saveEditMessage = async () => {
    if (!editingMessageId || !editDraft.trim()) return;
    const result = await requestApi(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateMessage", messageId: editingMessageId, body: editDraft }),
      silent: true,
    });
    if (result.ok) {
      setEditingMessageId(null);
      setEditDraft("");
      void loadMessages();
    } else if (!result.offline) {
      await showError("Could not edit", result.message);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!(await showDeleteConfirm("this message"))) return;
    const result = await requestApi(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteMessage", messageId }),
      silent: true,
    });
    if (result.ok) void loadMessages();
    else if (!result.offline) await showError("Could not delete", result.message);
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      await showError("Group name required");
      return;
    }
    const result = await requestApi<{ group: ChatGroup }>(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createGroup",
        name: groupName,
        description: groupDescription,
        memberIds: selectedMemberIds,
      }),
      silent: true,
    });
    if (result.ok) {
      await showSuccess("Group created");
      setShowCreateGroup(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedMemberIds([]);
      void loadInbox();
      openGroup(result.data.group);
    } else if (!result.offline) {
      await showError("Could not create group", result.message);
    }
  };

  const updateGroup = async () => {
    if (!activeThread || activeThread.kind !== "GROUP") return;
    const result = await requestApi<{ group: ChatGroup }>(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateGroup",
        groupId: activeThread.groupId,
        name: groupName,
        description: groupDescription,
      }),
      silent: true,
    });
    if (result.ok) {
      await showSuccess("Group updated");
      setShowGroupSettings(false);
      void loadInbox();
      setActiveThread({
        ...activeThread,
        title: result.data.group.name,
        group: result.data.group,
      });
    } else if (!result.offline) {
      await showError("Could not update group", result.message);
    }
  };

  const addMembersToGroup = async () => {
    if (!activeThread || activeThread.kind !== "GROUP" || selectedMemberIds.length === 0) return;
    const result = await requestApi<{ group: ChatGroup }>(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addMembers",
        groupId: activeThread.groupId,
        memberIds: selectedMemberIds,
      }),
      silent: true,
    });
    if (result.ok) {
      await showSuccess("Members added");
      setSelectedMemberIds([]);
      void loadInbox();
      setActiveThread({
        ...activeThread,
        group: result.data.group,
        subtitle: `${result.data.group.memberCount} members`,
      });
    } else if (!result.offline) {
      await showError("Could not add members", result.message);
    }
  };

  const removeMemberFromGroup = async (memberId: string) => {
    if (!activeThread || activeThread.kind !== "GROUP") return;
    const result = await requestApi(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "removeMember",
        groupId: activeThread.groupId,
        memberId,
      }),
      silent: true,
    });
    if (result.ok) {
      const inbox = await requestApi<{ groups: ChatGroup[] }>(endpoint, { silent: true });
      if (memberId === currentUserId) {
        setActiveThread(null);
        setShowGroupSettings(false);
        setMobileShowChat(false);
      } else if (inbox.ok && activeThread.kind === "GROUP") {
        const updated = inbox.data.groups.find((g) => g.id === activeThread.groupId);
        if (updated) {
          setActiveThread({
            ...activeThread,
            group: updated,
            title: updated.name,
            subtitle: `${updated.memberCount} members`,
          });
        }
      }
      void loadInbox();
    } else if (!result.offline) {
      await showError("Could not remove member", result.message);
    }
  };

  const deleteGroup = async () => {
    if (!activeThread || activeThread.kind !== "GROUP") return;
    if (!(await showDeleteConfirm(activeThread.title))) return;
    const result = await requestApi(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteGroup", groupId: activeThread.groupId }),
      silent: true,
    });
    if (result.ok) {
      setActiveThread(null);
      setMobileShowChat(false);
      setShowGroupSettings(false);
      void loadInbox();
    } else if (!result.offline) {
      await showError("Could not delete group", result.message);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const isGroupCreator =
    activeThread?.kind === "GROUP" && activeThread.group?.createdById === currentUserId;

  return (
    <div className="-mx-4 -my-4 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden sm:-mx-6 sm:-my-6 max-[480px]:h-[calc(100dvh-3.5rem)]">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm sm:rounded-xl">
        {/* Sidebar */}
        <aside
          className={[
            "flex w-full shrink-0 flex-col border-r border-slate-200 bg-[#f0f2f5] sm:w-80 lg:w-96",
            mobileShowChat ? "max-[480px]:hidden" : "max-[480px]:flex",
          ].join(" ")}
        >
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <h1 className="text-lg font-bold text-slate-900">
              Chats
              {totalUnread > 0 ? (
                <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {totalUnread}
                </span>
              ) : null}
            </h1>
            <p className="text-xs text-slate-500">
              {role === "student"
                ? "Message students and lecturers. Admins appear here only after they message you."
                : "Message students, lecturers, and admins."}
            </p>
          </div>

          <div className="flex gap-1 border-b border-slate-200 bg-white px-2 py-2">
            {(["chats", "people"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSidebarTab(tab)}
                className={[
                  "flex-1 rounded-lg py-2 text-sm font-medium capitalize",
                  sidebarTab === tab ? "bg-[#0B3D91] text-white" : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setShowCreateGroup(true);
                setGroupName("");
                setGroupDescription("");
                setSelectedMemberIds([]);
              }}
              className="rounded-lg bg-[#0B3D91]/10 px-3 py-2 text-sm font-medium text-[#0B3D91] hover:bg-[#0B3D91]/20"
              title="Create group"
            >
              +
            </button>
          </div>

          <div className="space-y-2 border-b border-slate-200 bg-white p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-full border border-slate-200 bg-[#f0f2f5] px-4 py-2 text-sm outline-none focus:border-[#0B3D91]/40"
            />
            {sidebarTab === "people" ? (
              <div className="grid grid-cols-2 gap-2 max-[480px]:grid-cols-1">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                >
                  <option value="ALL">All roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="LECTURER">Lecturers</option>
                  {role === "lecturer" ? <option value="ADMIN">Admins</option> : null}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                >
                  <option value="name">Sort: Name</option>
                  <option value="role">Sort: Role</option>
                  <option value="department">Sort: Department</option>
                </select>
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setProgramFilter("");
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                >
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                >
                  <option value="">All programs</option>
                  {filteredPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">Loading…</p>
            ) : sidebarTab === "people" ? (
              filteredContacts.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No contacts match your filters.</p>
              ) : (
                <ul>
                  {filteredContacts.map((contact) => (
                    <li key={contact.userId}>
                      <button
                        type="button"
                        onClick={() => openDirect(contact)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/80"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-sm font-semibold text-white">
                          {initials(contact.fullName)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium text-slate-900">{contact.fullName}</span>
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${roleBadgeClass(contact.role)}`}>
                              {roleLabel(contact.role)}
                            </span>
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {[contact.studentId, contact.departmentName, contact.programName]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <>
                {groups.length > 0 ? (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Groups</p>
                    <ul>
                      {groups.map((group) => (
                        <li key={group.id}>
                          <button
                            type="button"
                            onClick={() => openGroup(group)}
                            className={[
                              "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/80",
                              activeThread?.kind === "GROUP" && activeThread.groupId === group.id
                                ? "bg-white"
                                : "",
                            ].join(" ")}
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-semibold text-white">
                              {initials(group.name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-900">{group.name}</span>
                              <span className="text-xs text-slate-500">{group.memberCount} members</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {courseRooms.length > 0 ? (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Course rooms
                    </p>
                    <ul>
                      {courseRooms.map((room) => (
                        <li key={room.id}>
                          <button
                            type="button"
                            onClick={() => openCourse(room)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/80"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                              {room.courseCode.slice(0, 2)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-900">{room.courseCode}</span>
                              <span className="block truncate text-xs text-slate-500">{room.courseTitle}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Direct messages
                  </p>
                  {chatsTabDirectContacts.length === 0 ? (
                    <p className="px-4 pb-4 text-sm text-slate-500">No direct messages yet.</p>
                  ) : (
                    <ul>
                      {chatsTabDirectContacts.slice(0, 30).map((contact) => (
                        <li key={contact.userId}>
                          <button
                            type="button"
                            onClick={() => openDirect(contact)}
                            className={[
                              "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/80",
                              activeThread?.kind === "DIRECT" && activeThread.peerUserId === contact.userId
                                ? "bg-white"
                                : "",
                            ].join(" ")}
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-sm font-semibold text-white">
                              {initials(contact.fullName)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-slate-900">{contact.fullName}</span>
                              <span className="text-xs text-slate-500">{roleLabel(contact.role)}</span>
                            </span>
                            {threadUnreadCount(contact, unreadByThread) > 0 ? (
                              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                {threadUnreadCount(contact, unreadByThread)}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <section
          className={[
            "flex min-w-0 flex-1 flex-col bg-white",
            mobileShowChat ? "max-[480px]:flex" : "max-[480px]:hidden",
          ].join(" ")}
        >
          {!activeThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-[#f0f2f5] p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0B3D91]/10 text-2xl text-[#0B3D91]">
                💬
              </div>
              <p className="text-lg font-semibold text-slate-800">Your messages</p>
              <p className="max-w-xs text-sm text-slate-500">
                Select a conversation or browse people to start chatting.
              </p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 max-[480px]:inline-flex"
                  aria-label="Back"
                >
                  ←
                </button>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-xs font-semibold text-white">
                  {initials(activeThread.title)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{activeThread.title}</p>
                  {activeThread.subtitle ? (
                    <p className="truncate text-xs text-slate-500">{activeThread.subtitle}</p>
                  ) : null}
                </div>
                {activeThread.kind === "GROUP" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setGroupName(activeThread.title);
                      setGroupDescription(activeThread.group?.description ?? "");
                      setShowGroupSettings(true);
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    ⋯
                  </button>
                ) : null}
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto bg-[#f0f2f5] px-3 py-4 sm:px-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">No messages yet. Say hello!</p>
                ) : (
                  messages.map((message) => {
                    const isMine = message.senderId === currentUserId;
                    const isEditing = editingMessageId === message.id;

                    return (
                      <div
                        key={message.id}
                        className={["flex", isMine ? "justify-end" : "justify-start"].join(" ")}
                      >
                        <div className={["max-w-[85%] sm:max-w-[70%]", isMine ? "items-end" : "items-start"].join(" ")}>
                          {!isMine ? (
                            <p className="mb-0.5 px-1 text-[11px] font-medium text-slate-500">
                              {message.senderName}
                            </p>
                          ) : null}
                          <div className="group relative">
                            {isEditing ? (
                              <div className="rounded-2xl bg-white p-2 shadow-sm">
                                <input
                                  value={editDraft}
                                  onChange={(e) => setEditDraft(e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                                />
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void saveEditMessage()}
                                    className="rounded-lg bg-[#0B3D91] px-3 py-1 text-xs text-white"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMessageId(null)}
                                    className="rounded-lg bg-slate-200 px-3 py-1 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={[
                                  "rounded-2xl px-3 py-2 text-sm shadow-sm",
                                  isMine
                                    ? "rounded-br-md bg-[#0B3D91] text-white"
                                    : "rounded-bl-md bg-white text-slate-800",
                                ].join(" ")}
                              >
                                {message.messageType === "VOICE" && message.audioData ? (
                                  <audio controls src={message.audioData} className="mt-0.5 w-full max-w-[240px]" preload="metadata" />
                                ) : (
                                  <>
                                    {message.body}
                                    {message.edited ? (
                                      <span className={`ml-1 text-[10px] ${isMine ? "text-blue-200" : "text-slate-400"}`}>
                                        (edited)
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            )}
                            {isMine && !isEditing ? (
                              <div className="mt-1 flex justify-end gap-2 opacity-0 transition group-hover:opacity-100 max-[480px]:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(message.id);
                                    setEditDraft(message.body);
                                  }}
                                  className="text-[11px] text-slate-500 hover:text-[#0B3D91]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void deleteMessage(message.id)}
                                  className="text-[11px] text-red-500 hover:text-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <p className={`mt-0.5 px-1 text-[10px] text-slate-400 ${isMine ? "text-right" : ""}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isMine && message.readStatus ? (
                              <span
                                className={`ml-1 ${message.readStatus === "read" ? "text-sky-500" : "text-slate-400"}`}
                              >
                                {readReceiptLabel(message.readStatus)}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={sendMessage}
                className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 max-[480px]:p-2"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Aa"
                  className="flex-1 rounded-full border border-slate-200 bg-[#f0f2f5] px-4 py-2.5 text-sm outline-none focus:border-[#0B3D91]/40 max-[480px]:py-3"
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={sending || !activeThread || activeThread.kind !== "DIRECT"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm ${
                    recording ? "bg-red-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  } disabled:opacity-50 ${activeThread?.kind !== "DIRECT" ? "hidden" : ""}`}
                  title={recording ? "Stop recording" : "Voice message"}
                  aria-label={recording ? "Stop voice recording" : "Record voice message"}
                >
                  {recording ? "■" : "🎤"}
                </button>
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-white hover:bg-[#0a3580] disabled:opacity-50"
                  aria-label="Send"
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {/* Create group modal */}
      {showCreateGroup ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Create group</h2>
            <div className="mt-4 space-y-3">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <p className="text-xs font-medium text-slate-600">Add members</p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                {contacts.map((contact) => (
                  <label
                    key={contact.userId}
                    className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(contact.userId)}
                      onChange={() => toggleMember(contact.userId)}
                    />
                    <span className="text-sm">{contact.fullName}</span>
                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] ${roleBadgeClass(contact.role)}`}>
                      {roleLabel(contact.role)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createGroup()}
                className="flex-1 rounded-lg bg-[#0B3D91] py-2 text-sm font-medium text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Group settings modal */}
      {showGroupSettings && activeThread?.kind === "GROUP" ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Group settings</h2>
            <div className="mt-4 space-y-3">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                disabled={!isGroupCreator}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
              />
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                disabled={!isGroupCreator}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
              />
              <p className="text-xs font-medium text-slate-600">Members</p>
              <ul className="rounded-lg border border-slate-200">
                {activeThread.group?.members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 last:border-0"
                  >
                    <span className="text-sm">{member.fullName}</span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${roleBadgeClass(member.role)}`}>
                        {roleLabel(member.role)}
                      </span>
                      {(isGroupCreator || member.userId === currentUserId) &&
                      member.userId !== activeThread.group?.createdById ? (
                        <button
                          type="button"
                          onClick={() => void removeMemberFromGroup(member.userId)}
                          className="text-xs text-red-500"
                        >
                          Remove
                        </button>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              {isGroupCreator ? (
                <>
                  <p className="text-xs font-medium text-slate-600">Add more members</p>
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200">
                    {contacts
                      .filter((c) => !activeThread.group?.members.some((m) => m.userId === c.userId))
                      .map((contact) => (
                        <label
                          key={contact.userId}
                          className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(contact.userId)}
                            onChange={() => toggleMember(contact.userId)}
                          />
                          <span className="text-sm">{contact.fullName}</span>
                        </label>
                      ))}
                  </div>
                  {selectedMemberIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => void addMembersToGroup()}
                      className="w-full rounded-lg border border-[#0B3D91] py-2 text-sm text-[#0B3D91]"
                    >
                      Add selected members
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              {isGroupCreator ? (
                <>
                  <button
                    type="button"
                    onClick={() => void updateGroup()}
                    className="rounded-lg bg-[#0B3D91] py-2 text-sm font-medium text-white"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteGroup()}
                    className="rounded-lg border border-red-200 py-2 text-sm text-red-600"
                  >
                    Delete group
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setShowGroupSettings(false)}
                className="rounded-lg border border-slate-200 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
