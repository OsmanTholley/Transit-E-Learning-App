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
      title={title ?? "Notifications"}
      subtitle={
        subtitle ??
        "Administrative announcements and institutional updates. Open a notice from the bell icon anytime."
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
