"use client";

import { useParams } from "next/navigation";
import { LiveClassroomRoom } from "@/components/live-classroom/live-classroom-room";
import { useApiLoad } from "@/hooks/use-api-load";
import { useStudentSession } from "@/contexts/student-session-context";
import type { LiveClassListItem } from "@/types/live-classroom";

export default function StudentLiveClassroomSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: studentSession, loading: sessionLoading } = useStudentSession();
  const { data, loading } = useApiLoad<{ sessions: LiveClassListItem[] }>("/api/student/live-classes", {
    errorTitle: "Could not load class",
  });

  const session = data?.sessions.find((s) => s.id === sessionId);

  if (loading || sessionLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading classroom…</p>;
  }

  if (!session || !studentSession?.profile) {
    return <p className="p-6 text-sm text-slate-500">Class not found.</p>;
  }

  return (
    <LiveClassroomRoom
      session={session}
      userId={studentSession.profile.userId}
      userName={studentSession.profile.fullName}
      role="student"
      studentDbId={studentSession.profile.id}
      backHref="/student/live-classroom"
    />
  );
}
