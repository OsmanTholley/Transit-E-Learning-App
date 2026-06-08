"use client";

import { Suspense } from "react";
import { PortalMessagesHub } from "@/components/messages/portal-messages-hub";
import { LoadingState } from "@/components/ui/loading-indicator";

type Props = {
  title?: string;
  subtitle?: string;
};

function LecturerMessagesContent({ title, subtitle }: Props) {
  return (
    <PortalMessagesHub
      role="lecturer"
      title={title ?? "Messages & Notices"}
      subtitle={
        subtitle ??
        "Administrative announcements and institutional updates. Read a message before removing it from your inbox."
      }
    />
  );
}

export function UserNotificationsHub(props: Props) {
  return (
    <Suspense fallback={<LoadingState message="Loading messages…" panel minHeight={240} />}>
      <LecturerMessagesContent {...props} />
    </Suspense>
  );
}
