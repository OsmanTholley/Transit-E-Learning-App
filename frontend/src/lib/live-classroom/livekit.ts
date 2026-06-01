import { AccessToken } from "livekit-server-sdk";
import type { AppRole } from "@/types/app";

export function isLiveKitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET &&
      process.env.NEXT_PUBLIC_LIVEKIT_URL
  );
}

export async function createLiveKitToken(params: {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  role: AppRole;
}): Promise<string | null> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const canPublish = params.role === "lecturer" || params.role === "admin";
  const token = new AccessToken(apiKey, apiSecret, {
    identity: params.participantIdentity,
    name: params.participantName,
    ttl: 60 * 60 * 4,
  });

  token.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
    roomRecord: canPublish,
    roomAdmin: params.role === "lecturer" || params.role === "admin",
  });

  return await token.toJwt();
}

export function buildRoomName(classId: string): string {
  return `transit-${classId.replace(/-/g, "").slice(0, 24)}`;
}
