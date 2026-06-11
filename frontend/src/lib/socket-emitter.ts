import type { Server } from "socket.io";
import { SOCKET_EVENTS } from "@/lib/socket-events";

declare global {
  // eslint-disable-next-line no-var
  var __transitSocketIO: Server | undefined;
}

export function getSocketIO(): Server | undefined {
  return globalThis.__transitSocketIO;
}

export function emitSocketEvent(room: string, event: string, payload: unknown) {
  getSocketIO()?.to(room).emit(event, payload);
}

export function emitSocketEvents(rooms: string[], event: string, payload: unknown) {
  const io = getSocketIO();
  if (!io) return;
  for (const room of rooms) {
    io.to(room).emit(event, payload);
  }
}

export { SOCKET_EVENTS };
