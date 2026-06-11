export const SOCKET_PATH = "/api/socket/io";

export const SOCKET_EVENTS = {
  CHAT_MESSAGE: "chat:message",
  CHAT_READ: "chat:read",
  CHAT_TYPING: "typing",
  LIVE_HAND: "live:hand",
  LIVE_ATTENDANCE: "live:attendance",
  LIVE_SESSION: "live:session",
  LIVE_CHAT: "live:chat",
  NOTIFICATION: "notification:new",
  FEE_UPDATED: "fee:updated",
} as const;

export function threadRoom(threadKey: string) {
  return `thread:${threadKey}`;
}

export function liveClassRoom(liveClassId: string) {
  return `liveclass:${liveClassId}`;
}

export function userRoom(userId: string) {
  return `user:${userId}`;
}

export function directThreadKey(userIdA: string, userIdB: string) {
  const [a, b] = [userIdA, userIdB].sort();
  return `direct:${a}:${b}`;
}

export function groupThreadKey(groupId: string) {
  return `group:${groupId}`;
}
