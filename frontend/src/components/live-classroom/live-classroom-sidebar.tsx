"use client";

import { memo } from "react";
import { TRANSIT_CLASSROOM_BRAND } from "@/lib/live-classroom-config";

type ChatMessage = {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  isMine: boolean;
};

type AdmissionCandidate = {
  id: string;
  studentId: string;
  fullName: string;
  admitted: boolean;
  joined: boolean;
};

type SidebarProps = {
  tab: "chat" | "people" | "raised" | "admit";
  onTabChange: (tab: "chat" | "people" | "raised" | "admit") => void;
  messages: ChatMessage[];
  chatDraft: string;
  onChatDraftChange: (value: string) => void;
  onSendChat: () => void;
  displayName: string;
  participants: { id: string; name: string }[];
  raisedHands: { id: string; studentName: string }[];
  showRaisedTab: boolean;
  showAdmitTab?: boolean;
  admissionCandidates?: AdmissionCandidate[];
  onAdmitStudent?: (studentId: string) => void;
};

export const LiveClassroomSidebar = memo(function LiveClassroomSidebar({
  tab,
  onTabChange,
  messages,
  chatDraft,
  onChatDraftChange,
  onSendChat,
  displayName,
  participants,
  raisedHands,
  showRaisedTab,
  showAdmitTab,
  admissionCandidates = [],
  onAdmitStudent,
}: SidebarProps) {
  const tabs = (
    ["chat", "people", ...(showRaisedTab ? (["raised"] as const) : []), ...(showAdmitTab ? (["admit"] as const) : [])] as const
  );

  return (
    <aside className="flex w-full max-w-[300px] flex-col border-l border-white/10 bg-[#292828]">
      <div
        className="grid border-b border-white/10 text-xs font-medium"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      >
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTabChange(t)}
            className={`px-2 py-3 capitalize transition ${
              tab === t ? "border-b-2 text-white" : "text-white/50 hover:text-white/80"
            }`}
            style={tab === t ? { borderColor: TRANSIT_CLASSROOM_BRAND.accent } : undefined}
          >
            {t === "raised" ? "Raised" : t === "admit" ? "Admit" : t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "chat" ? (
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-xs text-white/40">Class chat — stays in this portal.</p>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg px-3 py-2 text-sm ${message.isMine ? "bg-[#0B3D91]/50" : "bg-white/5"}`}
              >
                <p className="text-[10px] font-medium text-[#FFC107]">
                  {message.senderName} · {message.senderRole.toLowerCase()}
                </p>
                <p className="mt-0.5 text-white/90">{message.message}</p>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "people" ? (
          <div className="space-y-1.5 text-sm">
            <p className="rounded-lg bg-[#0B3D91]/40 px-3 py-2 text-white">You · {displayName}</p>
            {participants.map((p) => (
              <p key={p.id} className="rounded-lg bg-white/5 px-3 py-2 text-white/90">
                {p.name}
              </p>
            ))}
            {participants.length === 0 ? (
              <p className="text-xs text-white/40">Waiting for others to join…</p>
            ) : null}
          </div>
        ) : null}

        {tab === "raised" && showRaisedTab ? (
          <div className="space-y-1.5">
            {raisedHands.length === 0 ? (
              <p className="text-xs text-white/40">No raised hands.</p>
            ) : (
              raisedHands.map((item) => (
                <p
                  key={item.id}
                  className="rounded-lg px-3 py-2 text-sm text-[#FFC107]"
                  style={{ backgroundColor: "rgba(255,193,7,0.12)" }}
                >
                  ✋ {item.studentName}
                </p>
              ))
            )}
          </div>
        ) : null}

        {tab === "admit" && showAdmitTab ? (
          <div className="space-y-2">
            <p className="text-xs text-white/50">
              After 10 minutes, students need your approval to enter. Admit enrolled learners below.
            </p>
            {admissionCandidates.length === 0 ? (
              <p className="text-xs text-white/40">No enrolled students found.</p>
            ) : (
              admissionCandidates.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-white">{student.fullName}</p>
                    <p className="text-[10px] text-white/40">{student.studentId}</p>
                  </div>
                  {student.joined ? (
                    <span className="text-[10px] font-medium text-emerald-400">Joined</span>
                  ) : student.admitted ? (
                    <span className="text-[10px] font-medium text-[#FFC107]">Admitted</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAdmitStudent?.(student.id)}
                      className="rounded-md px-2 py-1 text-[10px] font-semibold text-[#0B3D91]"
                      style={{ backgroundColor: TRANSIT_CLASSROOM_BRAND.accent }}
                    >
                      Allow
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      {tab === "chat" ? (
        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              value={chatDraft}
              onChange={(event) => onChatDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSendChat();
              }}
              placeholder="Type a message"
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#252423] px-3 py-2 text-sm outline-none focus:border-[#FFC107]"
            />
            <button
              type="button"
              onClick={onSendChat}
              className="rounded-md px-3 py-2 text-sm font-medium text-[#0B3D91]"
              style={{ backgroundColor: TRANSIT_CLASSROOM_BRAND.accent }}
            >
              Send
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
});
