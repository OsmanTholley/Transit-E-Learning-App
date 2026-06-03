import { NextRequest } from "next/server";
import { handleAiChatPost } from "@/lib/ai-chat-route";

export async function POST(request: NextRequest) {
  return handleAiChatPost(request, ["admin"]);
}
