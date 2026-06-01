"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveClassroomSocket } from "@/hooks/use-live-classroom-socket";
import { requestApi } from "@/lib/fetch-api";
import type { LiveClassListItem } from "@/types/live-classroom";

const LiveKitRoom = dynamic(
  () => import("@/components/live-classroom/livekit-room").then((m) => m.LiveKitRoomPanel),
  { ssr: false, loading: () => <div className="aspect-video rounded-xl bg-slate-900" /> }
);

type Props = {
  session: LiveClassListItem;
  userId: string;
  userName: string;
  role: "student" | "lecturer" | "admin";
  studentDbId?: string;
  backHref: string;
};

export function LiveClassroomRoom({
  session,
  userId,
  userName,
  role,
  studentDbId,
  backHref,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const [chatInput, setChatInput] = useState("");
  const [liveKit, setLiveKit] = useState<{
    configured: boolean;
    token?: string;
    serverUrl?: string;
    roomName?: string;
  } | null>(null);
  const [attendanceInfo, setAttendanceInfo] = useState<string | null>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("Yes\nNo");
  const [recordingUrl, setRecordingUrl] = useState("");

  const socket = useLiveClassroomSocket({
    sessionId: session.id,
    userId,
    name: userName,
    role,
    enabled: true,
  });

  useEffect(() => {
    async function init() {
      if (role === "student" && studentDbId) {
        const join = await requestApi<{ joinTime: string }>(
          `/api/student/live-classes/${session.id}/join`,
          { method: "POST", silent: true }
        );
        if (join.ok) {
          setAttendanceInfo(`Joined at ${new Date(join.data.joinTime).toLocaleTimeString()}`);
        }
      }

      const tokenRes = await requestApi<{
        configured: boolean;
        token?: string;
        serverUrl?: string;
        roomName?: string;
      }>("/api/live-classroom/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveClassId: session.id }),
        silent: true,
      });
      if (tokenRes.ok) setLiveKit(tokenRes.data);

      if (role === "lecturer" && session.status !== "LIVE") {
        await requestApi(`/api/lecturer/live-classes/${session.id}/start`, {
          method: "POST",
          silent: true,
        });
      }
    }
    void init();

    return () => {
      if (role === "student" && studentDbId) {
        void requestApi(`/api/student/live-classes/${session.id}/leave`, {
          method: "POST",
          silent: true,
        });
      }
    };
  }, [role, session.id, session.status, studentDbId]);

  useEffect(() => {
    if (role !== "student" || !studentDbId) return;
    const interval = setInterval(() => {
      void requestApi(`/api/student/live-classes/${session.id}/heartbeat`, {
        method: "POST",
        silent: true,
      }).then((res) => {
        if (res.ok) {
          setAttendanceInfo(
            `${res.data.statusLabel} · ${Math.round(res.data.attendancePercent)}% of class time`
          );
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [role, session.id, studentDbId]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    for (const stroke of socket.strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(stroke.x0, stroke.y0);
      ctx.lineTo(stroke.x1, stroke.y1);
      ctx.stroke();
    }
  }, [socket.strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  async function endClass() {
    await requestApi(`/api/lecturer/live-classes/${session.id}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordingUrl }),
      errorTitle: "Could not end class",
    });
    window.location.href = backHref;
  }

  const isLecturer = role === "lecturer" || role === "admin";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 lg:px-6">
        <div>
          <Link href={backHref} className="text-xs font-semibold text-sky-300 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-1 text-lg font-bold">{session.title}</h1>
          <p className="text-xs text-slate-400">
            {session.courseCode} · {session.lecturerName} ·{" "}
            <span className="uppercase">{session.status}</span>
            {socket.connected ? " · Live" : " · Connecting…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {attendanceInfo ? (
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200">
              {attendanceInfo}
            </span>
          ) : null}
          {isLecturer ? (
            <>
              <input
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="Recording URL (after class)"
                className="hidden rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs sm:block sm:w-56"
              />
              <button
                type="button"
                onClick={() => void endClass()}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold hover:bg-rose-500"
              >
                End class
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px] lg:p-6">
        <div className="space-y-4">
          {liveKit?.configured && liveKit.token && liveKit.serverUrl ? (
            <LiveKitRoom
              token={liveKit.token}
              serverUrl={liveKit.serverUrl}
              canPublish={isLecturer}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/80 p-8 text-center">
              <p className="text-sm font-semibold text-slate-200">Collaboration classroom mode</p>
              <p className="mt-2 text-xs text-slate-400">
                Configure LiveKit (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`)
                for HD video, screen sharing, and cloud recording.
              </p>
              <p className="mt-4 text-xs text-slate-500">
                Screen share · PowerPoint/PDF via presenter screen share · Whiteboard · Chat · Polls ·
                Attendance tracking are active.
              </p>
            </div>
          )}

          <section className="rounded-2xl border border-white/10 bg-slate-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">Interactive whiteboard</h2>
              {isLecturer ? (
                <button
                  type="button"
                  onClick={() => socket.clearWhiteboard()}
                  className="text-xs font-semibold text-sky-300 hover:underline"
                >
                  Clear board
                </button>
              ) : null}
            </div>
            <canvas
              ref={canvasRef}
              width={900}
              height={400}
              className="w-full cursor-crosshair rounded-xl bg-white"
              onMouseDown={(e) => {
                if (!isLecturer) return;
                drawingRef.current = true;
                lastPoint.current = getCanvasPoint(e);
              }}
              onMouseUp={() => {
                drawingRef.current = false;
              }}
              onMouseLeave={() => {
                drawingRef.current = false;
              }}
              onMouseMove={(e) => {
                if (!drawingRef.current || !isLecturer) return;
                const point = getCanvasPoint(e);
                const stroke = {
                  x0: lastPoint.current.x,
                  y0: lastPoint.current.y,
                  x1: point.x,
                  y1: point.y,
                  color: "#0B3D91",
                  width: 3,
                };
                lastPoint.current = point;
                socket.drawStroke(stroke);
              }}
            />
          </section>
        </div>

        <aside className="space-y-4">
          <Panel title={`Participants (${socket.participants.length})`}>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
              {socket.participants.map((p) => (
                <li key={p.userId} className="flex justify-between rounded-lg bg-white/5 px-2 py-1">
                  <span>{p.name}</span>
                  <span className="text-slate-400">{p.role}</span>
                </li>
              ))}
            </ul>
            {socket.raisedHands.length > 0 ? (
              <p className="mt-2 text-xs text-amber-300">
                ✋ Raised: {socket.raisedHands.join(", ")}
              </p>
            ) : null}
          </Panel>

          <Panel title="Live chat">
            <div className="max-h-40 space-y-2 overflow-y-auto text-xs">
              {socket.messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-white/5 px-2 py-1.5">
                  <span className="font-semibold text-sky-200">{m.senderName}</span>
                  <p className="mt-0.5 text-slate-200">{m.message}</p>
                </div>
              ))}
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                socket.sendChat(chatInput);
                setChatInput("");
              }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs"
                placeholder="Type a message…"
              />
              <button type="submit" className="rounded-lg bg-[#0B3D91] px-3 py-1.5 text-xs font-bold">
                Send
              </button>
            </form>
          </Panel>

          {!isLecturer ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => socket.raiseHand(studentDbId)}
                className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-900"
              >
                Raise hand
              </button>
              <button
                type="button"
                onClick={() => socket.lowerHand(studentDbId)}
                className="flex-1 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold"
              >
                Lower hand
              </button>
            </div>
          ) : null}

          {socket.activePoll ? (
            <Panel title="Active poll">
              <p className="text-sm font-semibold">{socket.activePoll.question}</p>
              <ul className="mt-2 space-y-1">
                {socket.activePoll.options.map((opt, i) => (
                  <li key={opt}>
                    {!isLecturer && studentDbId ? (
                      <button
                        type="button"
                        onClick={() =>
                          socket.votePoll(socket.activePoll!.id, studentDbId, i)
                        }
                        className="w-full rounded-lg bg-white/10 px-2 py-1.5 text-left text-xs hover:bg-white/20"
                      >
                        {opt} ({socket.pollVotes[i] ?? 0})
                      </button>
                    ) : (
                      <p className="text-xs text-slate-300">
                        {opt}: {socket.pollVotes[i] ?? 0} votes
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : isLecturer ? (
            <Panel title="Create poll">
              <input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question"
                className="mb-2 w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs"
              />
              <textarea
                value={pollOptions}
                onChange={(e) => setPollOptions(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  socket.createPoll(
                    pollQuestion,
                    pollOptions.split("\n").map((o) => o.trim()).filter(Boolean)
                  )
                }
                className="mt-2 w-full rounded-lg bg-[#FFC107] py-2 text-xs font-bold text-[#0B3D91]"
              >
                Launch poll
              </button>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </section>
  );
}
