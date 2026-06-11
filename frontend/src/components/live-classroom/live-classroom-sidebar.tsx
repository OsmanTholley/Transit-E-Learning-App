"use client";

import { memo } from "react";
import { VirtualRoomMessenger } from "@/components/chat/virtual-room-messenger";
import { LiveClassAttendancePanel } from "@/components/live-classroom/live-class-attendance-panel";
import { TRANSIT_CLASSROOM_BRAND } from "@/lib/live-classroom-config";

type AdmissionCandidate = {
  id: string;
  studentId: string;
  fullName: string;
  admitted: boolean;
  joined: boolean;
};

type SidebarProps = {
  liveClassId: string;
  tab: "chat" | "people" | "raised" | "admit" | "attendance";
  onTabChange: (tab: "chat" | "people" | "raised" | "admit" | "attendance") => void;
  displayName: string;
  participants: { id: string; name: string }[];
  raisedHands: { id: string; studentId?: string; studentName: string }[];
  showRaisedTab: boolean;
  showAdmitTab?: boolean;
  showAttendanceTab?: boolean;
  admissionCandidates?: AdmissionCandidate[];
  onAdmitStudent?: (studentId: string) => void;
  onDismissHand?: (studentId: string) => void;
  onLowerAllHands?: () => void;
};

export const LiveClassroomSidebar = memo(function LiveClassroomSidebar({
  liveClassId,
  tab,
  onTabChange,
  displayName,
  participants,
  raisedHands,
  showRaisedTab,
  showAdmitTab,
  showAttendanceTab,
  admissionCandidates = [],
  onAdmitStudent,
  onDismissHand,
  onLowerAllHands,
}: SidebarProps) {
  const tabs = (
    [
      "chat",
      "people",
      ...(showRaisedTab ? (["raised"] as const) : []),
      ...(showAdmitTab ? (["admit"] as const) : []),
      ...(showAttendanceTab ? (["attendance"] as const) : []),
    ] as const
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
            className={`relative px-2 py-3 capitalize transition ${
              tab === t ? "border-b-2 text-white" : "text-white/50 hover:text-white/80"
            }`}
            style={tab === t ? { borderColor: TRANSIT_CLASSROOM_BRAND.accent } : undefined}
          >
            {t === "raised" ? "Raised" : t === "admit" ? "Admit" : t}
            {t === "raised" && raisedHands.length > 0 ? (
              <span className="absolute right-1 top-1 rounded-full bg-[#FFC107] px-1.5 text-[9px] font-bold text-[#0B3D91]">
                {raisedHands.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className={`min-h-0 flex-1 p-3 ${tab === "chat" ? "flex flex-col overflow-hidden" : "overflow-y-auto"}`}>
        {tab === "chat" ? <VirtualRoomMessenger liveClassId={liveClassId} active={tab === "chat"} /> : null}

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
          <div className="space-y-2">
            {raisedHands.length > 0 ? (
              <button
                type="button"
                onClick={onLowerAllHands}
                className="w-full rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
              >
                Lower all hands
              </button>
            ) : null}
            {raisedHands.length === 0 ? (
              <p className="text-xs text-white/40">No raised hands.</p>
            ) : (
              raisedHands.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-[#FFC107]"
                  style={{ backgroundColor: "rgba(255,193,7,0.12)" }}
                >
                  <span>
                    ✋ #{index + 1} {item.studentName}
                  </span>
                  {item.studentId ? (
                    <button
                      type="button"
                      onClick={() => onDismissHand?.(item.studentId!)}
                      className="text-[10px] text-white/60 hover:text-white"
                    >
                      Lower
                    </button>
                  ) : null}
                </div>
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

        {tab === "attendance" && showAttendanceTab ? (
          <LiveClassAttendancePanel liveClassId={liveClassId} active={tab === "attendance"} />
        ) : null}
      </div>
    </aside>
  );
});
