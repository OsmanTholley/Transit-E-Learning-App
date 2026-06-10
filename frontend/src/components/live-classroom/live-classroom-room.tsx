"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TransitLogo } from "@/components/brand/transit-logo";
import { LiveClassroomControls } from "@/components/live-classroom/live-classroom-controls";
import { LiveClassroomLobbyPreview } from "@/components/live-classroom/live-classroom-lobby-preview";
import { LiveClassroomSidebar } from "@/components/live-classroom/live-classroom-sidebar";
import { requestApi } from "@/lib/fetch-api";
import {
  buildJitsiConfig,
  CHAT_POLL_MS,
  HAND_POLL_MS,
  TRANSIT_CLASSROOM_BRAND,
} from "@/lib/live-classroom-config";
import "@/app/live-classroom-portal.css";

type JoinPayload = {
  roomName: string;
  jitsiDomain: string;
  displayName: string;
  isModerator: boolean;
  liveClass: {
    id: string;
    title: string | null;
    status: string;
    course: { courseCode: string; courseTitle: string } | null;
  };
};

type ChatMessage = {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
  isMine: boolean;
};

type Participant = { id: string; name: string };

type JitsiApi = {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  addListener: (event: string, listener: (...args: unknown[]) => void) => void;
  getParticipantsInfo?: () => { participantId: string; displayName: string }[];
  isAudioMuted?: () => boolean;
  isVideoMuted?: () => boolean;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
    __transitJitsiLoading?: Promise<void>;
  }
}

function loadJitsiScript(domain: string): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (window.__transitJitsiLoading) return window.__transitJitsiLoading;

  window.__transitJitsiLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the classroom video engine."));
    document.body.appendChild(script);
  });

  return window.__transitJitsiLoading;
}

type LiveClassroomRoomProps = {
  liveClassId: string;
  role: "student" | "lecturer" | "admin";
  sessionAs?: "lecturer" | "student";
};

export function LiveClassroomRoom({ liveClassId, role, sessionAs = "lecturer" }: LiveClassroomRoomProps) {
  const router = useRouter();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<JitsiApi | null>(null);
  const [joinData, setJoinData] = useState<JoinPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inLobby, setInLobby] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"chat" | "people" | "raised" | "admit">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [raisedHands, setRaisedHands] = useState<{ id: string; studentName: string }[]>([]);
  const [admissionCandidates, setAdmissionCandidates] = useState<
    { id: string; studentId: string; fullName: string; admitted: boolean; joined: boolean }[]
  >([]);
  const [handRaised, setHandRaised] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [joinWithMic, setJoinWithMic] = useState(true);
  const [joinWithCamera, setJoinWithCamera] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const isAdmin = role === "admin";
  const isHost = role === "lecturer" || (isAdmin && sessionAs === "lecturer");
  const isStudentView = role === "student" || (isAdmin && sessionAs === "student");
  const controlRole: "student" | "lecturer" = isHost ? "lecturer" : "student";
  const isLecturer = isHost;

  useEffect(() => {
    setSidebarOpen(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  const exitToHub = useCallback(() => {
    if (isAdmin) {
      router.push("/admin/live-classes");
      return;
    }
    router.push(isHost ? "/lecturer/live-classes" : "/student/live-classes");
  }, [isAdmin, isHost, router]);

  const syncMediaState = useCallback(() => {
    const api = jitsiApiRef.current;
    if (!api) return;
    if (typeof api.isAudioMuted === "function") setMicOn(!api.isAudioMuted());
    if (typeof api.isVideoMuted === "function") setCameraOn(!api.isVideoMuted());
  }, []);

  const syncParticipants = useCallback(() => {
    const api = jitsiApiRef.current;
    if (!api?.getParticipantsInfo) return;
    setParticipants(
      api.getParticipantsInfo().map((p) => ({
        id: p.participantId,
        name: p.displayName || "Participant",
      })),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function join() {
      const result = await requestApi<JoinPayload>(`/api/live-classes/${liveClassId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isAdmin ? { sessionAs } : {}),
        silent: true,
      });
      if (cancelled) return;
      if (!result.ok) {
        setError(result.offline ? "You are offline." : result.message);
        setLoading(false);
        return;
      }
      setJoinData(result.data);
      setLoading(false);
    }
    void join();
    return () => {
      cancelled = true;
    };
  }, [liveClassId, isAdmin, sessionAs]);

  const enterCall = useCallback(async () => {
    if (!joinData || !jitsiContainerRef.current || jitsiApiRef.current) return;

    setConnecting(true);
    try {
      await loadJitsiScript(joinData.jitsiDomain);
      if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return;

      const jitsiOptions = buildJitsiConfig(joinData.displayName, joinData.isModerator);
      const api = new window.JitsiMeetExternalAPI(joinData.jitsiDomain, {
        roomName: joinData.roomName,
        parentNode: jitsiContainerRef.current,
        width: "100%",
        height: "100%",
        ...jitsiOptions,
        configOverwrite: {
          ...jitsiOptions.configOverwrite,
          startWithAudioMuted: !joinWithMic,
          startWithVideoMuted: !joinWithCamera,
        },
      });

      jitsiApiRef.current = api;

      api.addListener("videoConferenceJoined", () => {
        setInCall(true);
        setConnecting(false);
        syncMediaState();
        syncParticipants();

        if (joinWithMic && api.isAudioMuted?.()) {
          api.executeCommand("toggleAudio");
        }
        if (joinWithCamera && api.isVideoMuted?.()) {
          api.executeCommand("toggleVideo");
        }
        syncMediaState();
      });

      if (joinData.isModerator) {
        api.addListener("knockingParticipant", (payload: unknown) => {
          const participant = payload as { id?: string };
          if (participant.id) {
            api.executeCommand("answerKnockingParticipant", participant.id, true);
          }
        });
      }

      api.addListener("participantJoined", syncParticipants);
      api.addListener("participantLeft", syncParticipants);
      api.addListener("audioMuteStatusChanged", (payload: unknown) => {
        const data = payload as { muted?: boolean };
        if (typeof data.muted === "boolean") setMicOn(!data.muted);
      });
      api.addListener("videoMuteStatusChanged", (payload: unknown) => {
        const data = payload as { muted?: boolean };
        if (typeof data.muted === "boolean") setCameraOn(!data.muted);
      });
      api.addListener("screenSharingStatusChanged", (payload: unknown) => {
        const data = payload as { on?: boolean };
        if (typeof data.on === "boolean") setScreenSharing(data.on);
      });
      api.addListener("readyToClose", exitToHub);

      setInLobby(false);
    } catch (mountError) {
      setConnecting(false);
      setError(mountError instanceof Error ? mountError.message : "Could not start the classroom.");
    }
  }, [joinData, joinWithMic, joinWithCamera, syncMediaState, syncParticipants, exitToHub]);

  useEffect(() => {
    if (!joinData || inCall || jitsiApiRef.current) return;

    const shouldEnter = (isHost && inLobby) || (isStudentView && !inLobby);
    if (!shouldEnter) return;

    const timer = window.setTimeout(() => {
      void enterCall();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isHost, isStudentView, joinData, inLobby, inCall, enterCall]);

  useEffect(() => {
    return () => {
      jitsiApiRef.current?.dispose();
      jitsiApiRef.current = null;
    };
  }, []);

  // Lightweight polling — only when sidebar tab needs fresh data
  useEffect(() => {
    if ((!inCall && !isHost) || !sidebarOpen) return;

    let cancelled = false;

    async function poll() {
      if (sidebarTab === "chat") {
        const result = await requestApi<{ messages: ChatMessage[] }>(
          `/api/live-classes/${liveClassId}/chat`,
          { silent: true },
        );
        if (!cancelled && result.ok) setMessages(result.data.messages);
      }

      if (sidebarTab === "raised" && isLecturer) {
        const result = await requestApi<{ raises: { id: string; studentName: string }[] }>(
          `/api/live-classes/${liveClassId}/hand`,
          { silent: true },
        );
        if (!cancelled && result.ok) setRaisedHands(result.data.raises);
      }

      if (sidebarTab === "admit" && isLecturer) {
        const result = await requestApi<{
          students: { id: string; studentId: string; fullName: string; admitted: boolean; joined: boolean }[];
        }>(`/api/live-classes/${liveClassId}/admit`, { silent: true });
        if (!cancelled && result.ok) setAdmissionCandidates(result.data.students);
      }
    }

    void poll();
    const ms = sidebarTab === "raised" && isLecturer ? HAND_POLL_MS : sidebarTab === "admit" && isLecturer ? HAND_POLL_MS : CHAT_POLL_MS;
    const timer = window.setInterval(poll, ms);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [inCall, sidebarOpen, sidebarTab, liveClassId, isLecturer]);

  const sendChat = async () => {
    const text = chatDraft.trim();
    if (!text) return;
    const result = await requestApi(`/api/live-classes/${liveClassId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
      silent: true,
    });
    if (result.ok) {
      setChatDraft("");
      const refresh = await requestApi<{ messages: ChatMessage[] }>(
        `/api/live-classes/${liveClassId}/chat`,
        { silent: true },
      );
      if (refresh.ok) setMessages(refresh.data.messages);
    }
  };

  const admitStudent = async (studentId: string) => {
    const result = await requestApi(`/api/live-classes/${liveClassId}/admit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
      silent: true,
    });
    if (result.ok) {
      setAdmissionCandidates((current) =>
        current.map((student) => (student.id === studentId ? { ...student, admitted: true } : student)),
      );
    }
  };

  const toggleHand = async () => {
    const action = handRaised ? "lower" : "raise";
    const result = await requestApi(`/api/live-classes/${liveClassId}/hand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      silent: true,
    });
    if (result.ok) setHandRaised(!handRaised);
  };

  const notifyLeave = useCallback(async (action?: "end") => {
    await requestApi(`/api/live-classes/${liveClassId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(action ? { action } : {}),
        ...(isAdmin ? { sessionAs } : {}),
      }),
      silent: true,
    });
  }, [liveClassId, isAdmin, sessionAs]);

  const leaveClass = () => {
    void notifyLeave().finally(() => {
      jitsiApiRef.current?.executeCommand("hangup");
      exitToHub();
    });
  };

  const endClass = async () => {
    await notifyLeave("end");
    jitsiApiRef.current?.executeCommand("hangup");
    exitToHub();
  };

  const startClassForStudents = async () => {
    const startEndpoint = isAdmin
      ? `/api/admin/live-classes/${liveClassId}`
      : `/api/lecturer/live-classes/${liveClassId}`;
    const result = await requestApi<{ status: string }>(startEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
      silent: true,
    });
    if (result.ok) {
      setJoinData((current) =>
        current
          ? {
              ...current,
              liveClass: { ...current.liveClass, status: result.data.status ?? "LIVE" },
            }
          : current,
      );
    }
  };

  const waitingForStudents = isHost && joinData?.liveClass.status === "SCHEDULED";
  const showStudentLobby = inLobby && isStudentView;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#252423] text-white">
        <TransitLogo size="md" variant="light" subtitle="Virtual Classroom" />
        <p className="text-sm text-white/70">Preparing classroom…</p>
      </div>
    );
  }

  if (error || !joinData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#252423] px-4 text-white">
        <TransitLogo size="md" variant="light" />
        <p className="text-center text-sm">{error ?? "Unable to join this class."}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: TRANSIT_CLASSROOM_BRAND.primary }}
        >
          Back to classes
        </button>
      </div>
    );
  }

  if (showStudentLobby) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#252423] px-4 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#292828] p-6 shadow-xl sm:p-8">
          <div className="flex justify-center">
            <TransitLogo size="md" variant="light" subtitle="Virtual Classroom" />
          </div>
          <h1 className="mt-5 text-center text-lg font-semibold sm:text-xl">
            {joinData.liveClass.title ?? "Live session"}
          </h1>
          <p className="mt-1 text-center text-sm text-white/70">
            {joinData.liveClass.course?.courseCode} · {joinData.liveClass.course?.courseTitle}
          </p>
          <p className="mt-3 text-center text-xs text-white/50">
            Joining as <strong className="text-white">{joinData.displayName}</strong>
          </p>

          <div className="mt-5">
            <LiveClassroomLobbyPreview
              micOn={joinWithMic}
              cameraOn={joinWithCamera}
              onMicChange={setJoinWithMic}
              onCameraChange={setJoinWithCamera}
            />
          </div>

          <button
            type="button"
            onClick={() => setInLobby(false)}
            className="mt-5 w-full rounded-lg py-3 text-sm font-semibold text-[#0B3D91]"
            style={{ backgroundColor: TRANSIT_CLASSROOM_BRAND.accent }}
          >
            Join now
          </button>
          <button type="button" onClick={exitToHub} className="mt-2 w-full py-2 text-sm text-white/60 hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#252423] text-white">
      <header
        className="flex shrink-0 items-center justify-between px-3 py-2 sm:px-4"
        style={{ backgroundColor: TRANSIT_CLASSROOM_BRAND.primary }}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <TransitLogo size="sm" variant="light" showText={false} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FFC107]">
              {isAdmin ? (sessionAs === "lecturer" ? "Admin host" : "Admin student view") : "Transit Classroom"}
            </p>
            <h1 className="truncate text-sm font-semibold">{joinData.liveClass.title ?? "Live session"}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {waitingForStudents ? (
            <span className="hidden rounded-full bg-[#FFC107]/20 px-2.5 py-1 text-[10px] font-medium text-[#FFC107] sm:inline">
              Waiting for students — camera &amp; mic are active
            </span>
          ) : null}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
            style={{
              backgroundColor:
                joinData.liveClass.status === "LIVE" ? TRANSIT_CLASSROOM_BRAND.live : "rgba(255,255,255,0.2)",
            }}
          >
            {joinData.liveClass.status === "LIVE" ? "Live" : joinData.liveClass.status}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="transit-jitsi-shell relative min-w-0 flex-1 bg-[#1b1a19]">
          <div ref={jitsiContainerRef} className="h-full w-full" />
          {connecting && !inCall ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#1b1a19]/90">
              <p className="text-sm text-white/80">Connecting to classroom…</p>
              <p className="text-xs text-white/50">Allow camera and microphone when your browser asks.</p>
            </div>
          ) : null}
          {inCall || isHost || !inLobby ? (
            <LiveClassroomControls
              micOn={micOn}
              cameraOn={cameraOn}
              screenSharing={screenSharing}
              handRaised={handRaised}
              role={controlRole}
              sidebarOpen={sidebarOpen}
              waitingForStudents={waitingForStudents}
              onToggleMic={() => {
                jitsiApiRef.current?.executeCommand("toggleAudio");
                window.setTimeout(syncMediaState, 300);
              }}
              onToggleCamera={() => {
                jitsiApiRef.current?.executeCommand("toggleVideo");
                window.setTimeout(syncMediaState, 300);
              }}
              onToggleScreen={() => jitsiApiRef.current?.executeCommand("toggleShareScreen")}
              onToggleHand={() => void toggleHand()}
              onToggleSidebar={() => setSidebarOpen((v) => !v)}
              onLeave={leaveClass}
              onStartClass={waitingForStudents ? () => void startClassForStudents() : undefined}
              onEndClass={isLecturer && !waitingForStudents ? () => void endClass() : undefined}
            />
          ) : null}
        </section>

        {sidebarOpen ? (
          <LiveClassroomSidebar
            tab={sidebarTab}
            onTabChange={setSidebarTab}
            messages={messages}
            chatDraft={chatDraft}
            onChatDraftChange={setChatDraft}
            onSendChat={() => void sendChat()}
            displayName={joinData.displayName}
            participants={participants}
            raisedHands={raisedHands}
            showRaisedTab={isLecturer}
            showAdmitTab={isLecturer}
            admissionCandidates={admissionCandidates}
            onAdmitStudent={(studentId) => void admitStudent(studentId)}
          />
        ) : null}
      </div>
    </div>
  );
}
