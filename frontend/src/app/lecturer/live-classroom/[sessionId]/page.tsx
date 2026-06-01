"use client";

import { useParams } from "next/navigation";
import { LiveClassroomRoom } from "@/components/live-classroom/live-classroom-room";
import { useApiLoad } from "@/hooks/use-api-load";
import type { LiveClassListItem } from "@/types/live-classroom";

type ProfilePayload = {
  lecturer: { id: string; fullName: string };
};

export default function LecturerLiveClassroomSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: sessionsData, loading: sessionsLoading } = useApiLoad<{ sessions: LiveClassListItem[] }>(
    "/api/lecturer/live-classes",
    { errorTitle: "Could not load class" }
  );
  const { data: profile, loading: profileLoading } = useApiLoad<ProfilePayload>(
    "/api/lecturer/profile",
    { errorTitle: "Could not load profile" }
  );

  const session = sessionsData?.sessions.find((s) => s.id === sessionId);

  if (sessionsLoading || profileLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading classroom…</p>;
  }

  if (!session || !profile?.lecturer) {
    return <p className="p-6 text-sm text-slate-500">Class not found.</p>;
  }

  return (
    <LiveClassroomRoom
      session={session}
      userId={profile.lecturer.id}
      userName={profile.lecturer.fullName}
      role="lecturer"
      backHref="/lecturer/live-classroom"
    />
  );
}
