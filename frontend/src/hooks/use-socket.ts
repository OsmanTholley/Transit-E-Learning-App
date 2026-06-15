"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { SOCKET_PATH } from "@/lib/socket-events";

let sharedSocket: Socket | null = null;

function getSharedSocket() {
  if (typeof window === "undefined") return null;
  if (!sharedSocket) {
    sharedSocket = io({
      path: SOCKET_PATH,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });
  }
  return sharedSocket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const shared = getSharedSocket();
    if (!shared) return;
    socketRef.current = shared;
    scheduleEffectWork(() => setSocket(shared));

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    shared.on("connect", onConnect);
    shared.on("disconnect", onDisconnect);
    if (shared.connected) {
      scheduleEffectWork(() => setConnected(true));
    }

    return () => {
      shared.off("connect", onConnect);
      shared.off("disconnect", onDisconnect);
    };
  }, []);

  const joinRooms = useCallback((rooms: string[]) => {
    socketRef.current?.emit("join", rooms);
  }, []);

  const leaveRooms = useCallback((rooms: string[]) => {
    socketRef.current?.emit("leave", rooms);
  }, []);

  const subscribe = useCallback((event: string, handler: (payload: unknown) => void) => {
    const activeSocket = socketRef.current;
    if (!activeSocket) return () => undefined;
    activeSocket.on(event, handler);
    return () => {
      activeSocket.off(event, handler);
    };
  }, []);

  const emitTyping = useCallback(
    (room: string, userId: string, name: string, isTyping: boolean) => {
      socketRef.current?.emit("typing", { room, userId, name, isTyping });
    },
    [],
  );

  return { connected, joinRooms, leaveRooms, subscribe, emitTyping, socket };
}
