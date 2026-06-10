"use client";

import dynamic from "next/dynamic";

const LiveClassroomRoom = dynamic(
  () => import("@/components/live-classroom/live-classroom-room").then((m) => m.LiveClassroomRoom),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#252423] text-sm text-white/70">
        Loading classroom…
      </div>
    ),
  },
);

type LiveClassroomRoomEntryProps = {
  liveClassId: string;
  role: "student" | "lecturer" | "admin";
  sessionAs?: "lecturer" | "student";
};

export function LiveClassroomRoomEntry({ liveClassId, role, sessionAs = "lecturer" }: LiveClassroomRoomEntryProps) {
  return <LiveClassroomRoom liveClassId={liveClassId} role={role} sessionAs={sessionAs} />;
}
