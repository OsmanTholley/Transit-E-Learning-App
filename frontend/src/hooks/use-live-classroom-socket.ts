"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ChatMessagePayload, PollPayload } from "@/types/live-classroom";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_LIVE_CLASSROOM_SOCKET_URL || "http://localhost:3001";

export type Participant = {
  userId: string;
  name: string;
  role: string;
  handRaised?: boolean;
};

type WhiteboardStroke = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  width: number;
};

export function useLiveClassroomSocket(params: {
  sessionId: string;
  userId: string;
  name: string;
  role: "student" | "lecturer" | "admin";
  enabled: boolean;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activePoll, setActivePoll] = useState<PollPayload | null>(null);
  const [pollVotes, setPollVotes] = useState<number[]>([]);
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);
  const [raisedHands, setRaisedHands] = useState<string[]>([]);

  useEffect(() => {
    if (!params.enabled || !params.sessionId) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", {
        sessionId: params.sessionId,
        userId: params.userId,
        name: params.name,
        role: params.role,
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("chat-history", (data: { messages: ChatMessagePayload[] }) => {
      setMessages(data.messages ?? []);
    });

    socket.on("chat-message", (msg: ChatMessagePayload) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("participants-updated", (data: { participants: Participant[] }) => {
      setParticipants(data.participants ?? []);
      setRaisedHands(
        (data.participants ?? []).filter((p) => p.handRaised).map((p) => p.name)
      );
    });

    socket.on("poll-active", (poll: PollPayload) => {
      setActivePoll(poll);
      setPollVotes(poll.votes ?? poll.options.map(() => 0));
    });

    socket.on("poll-results", (data: { votes: number[] }) => {
      setPollVotes(data.votes);
    });

    socket.on("hand-raised", (data: { name: string }) => {
      setRaisedHands((prev) => (prev.includes(data.name) ? prev : [...prev, data.name]));
    });

    socket.on("hand-lowered", () => {
      /* refreshed via participants-updated */
    });

    socket.on("whiteboard-state", (data: { strokes: WhiteboardStroke[] }) => {
      setStrokes(data.strokes ?? []);
    });

    socket.on("whiteboard-draw", (data: { stroke: WhiteboardStroke }) => {
      setStrokes((prev) => [...prev, data.stroke]);
    });

    socket.on("whiteboard-clear", () => setStrokes([]));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [params.enabled, params.sessionId, params.userId, params.name, params.role]);

  function sendChat(message: string) {
    socketRef.current?.emit("chat-message", {
      sessionId: params.sessionId,
      userId: params.userId,
      name: params.name,
      role: params.role,
      message,
    });
  }

  function raiseHand(studentId?: string) {
    socketRef.current?.emit("raise-hand", {
      sessionId: params.sessionId,
      studentId: studentId ?? params.userId,
      name: params.name,
    });
  }

  function lowerHand(studentId?: string) {
    socketRef.current?.emit("lower-hand", {
      sessionId: params.sessionId,
      studentId: studentId ?? params.userId,
    });
  }

  function createPoll(question: string, options: string[]) {
    socketRef.current?.emit("poll-create", {
      sessionId: params.sessionId,
      question,
      options,
    });
  }

  function votePoll(pollId: string, studentId: string, optionIndex: number) {
    socketRef.current?.emit("poll-vote", {
      sessionId: params.sessionId,
      pollId,
      studentId,
      optionIndex,
    });
  }

  function drawStroke(stroke: WhiteboardStroke) {
    socketRef.current?.emit("whiteboard-draw", {
      sessionId: params.sessionId,
      stroke,
    });
    setStrokes((prev) => [...prev, stroke]);
  }

  function clearWhiteboard() {
    socketRef.current?.emit("whiteboard-clear", { sessionId: params.sessionId });
    setStrokes([]);
  }

  return {
    connected,
    messages,
    participants,
    activePoll,
    pollVotes,
    strokes,
    raisedHands,
    sendChat,
    raiseHand,
    lowerHand,
    createPoll,
    votePoll,
    drawStroke,
    clearWhiteboard,
  };
}
