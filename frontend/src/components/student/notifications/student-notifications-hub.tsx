"use client";

import { Suspense } from "react";
import { PortalMessagesHub } from "@/components/messages/portal-messages-hub";
import { LoadingState } from "@/components/ui/loading-indicator";

function StudentMessagesContent() {
  return (
    <PortalMessagesHub
      role="student"
      title="Messages & Notices"
      subtitle="Official communications from administrators, department heads, and course coordinators. Open a message to mark it as read."
    />
  );
}

export function StudentNotificationsHub() {
  return (
    <Suspense fallback={<LoadingState message="Loading messages…" panel minHeight={240} />}>
      <StudentMessagesContent />
    </Suspense>
  );
}
