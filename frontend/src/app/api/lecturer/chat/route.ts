import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getValidatedUser } from "@/lib/auth";
import {
  handlePortalChatDelete,
  handlePortalChatGet,
  handlePortalChatPatch,
  handlePortalChatPost,
} from "@/lib/portal-chat-route";

export async function GET(request: NextRequest) {
  const user = await getValidatedUser(["lecturer"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return handlePortalChatGet(request, user, Role.LECTURER);
}

export async function POST(request: NextRequest) {
  const user = await getValidatedUser(["lecturer"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return handlePortalChatPost(request, user, Role.LECTURER);
}

export async function PATCH(request: NextRequest) {
  const user = await getValidatedUser(["lecturer"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return handlePortalChatPatch(request, user, Role.LECTURER);
}

export async function DELETE(request: NextRequest) {
  const user = await getValidatedUser(["lecturer"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return handlePortalChatDelete(request, user, Role.LECTURER);
}
