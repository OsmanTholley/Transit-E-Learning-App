"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSharedSocket();
    if (!socket) return;
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const joinRooms = useCallback((rooms: string[]) => {
    socketRef.current?.emit("join", rooms);
  }, []);

  const leaveRooms = useCallback((rooms: string[]) => {
    socketRef.current?.emit("leave", rooms);
  }, []);

  const subscribe = useCallback((event: string, handler: (payload: unknown) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => undefined;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, []);

  const emitTyping = useCallback(
    (room: string, userId: string, name: string, isTyping: boolean) => {
      socketRef.current?.emit("typing", { room, userId, name, isTyping });
    },
    [],
  );

  return { connected, joinRooms, leaveRooms, subscribe, emitTyping, socket: socketRef.current };
}
