"use client";

import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

type Props = {
  token: string;
  serverUrl: string;
  canPublish: boolean;
};

export function LiveKitRoomPanel({ token, serverUrl, canPublish }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      <LiveKitRoom
        video
        audio
        token={token}
        serverUrl={serverUrl}
        connect
        data-lk-theme="default"
        style={{ height: "min(70vh, 520px)" }}
      >
        <VideoConference />
      </LiveKitRoom>
      {!canPublish ? (
        <p className="bg-slate-900 px-3 py-2 text-center text-xs text-slate-400">
          You are viewing the lecturer stream (screen share, slides, and video).
        </p>
      ) : (
        <p className="bg-slate-900 px-3 py-2 text-center text-xs text-slate-400">
          Share your screen to present PowerPoint, PDFs, or demos. Recording is available when LiveKit
          egress is configured.
        </p>
      )}
    </div>
  );
}
