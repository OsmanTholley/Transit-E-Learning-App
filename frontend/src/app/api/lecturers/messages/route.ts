import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import {
  LecturerMessageAudienceType,
  listLecturerMessageBroadcasts,
  sendLecturerMessage,
} from "@/lib/lecturer-message-service";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const messages = await listLecturerMessageBroadcasts();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/lecturers/messages:", error);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const audienceType = body.audienceType as LecturerMessageAudienceType;

    if (!["individual", "department", "all"].includes(audienceType)) {
      return NextResponse.json({ error: "Invalid audience type." }, { status: 400 });
    }

    const result = await sendLecturerMessage({
      title: body.title ?? "",
      message: body.message ?? "",
      audienceType,
      targetId: body.targetId ?? null,
      sentByUserId: admin.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: `Message sent to ${result.recipientCount} lecturer${result.recipientCount === 1 ? "" : "s"}.`,
      broadcast: result.broadcast,
    });
  } catch (error) {
    console.error("POST /api/lecturers/messages:", error);
    const message =
      error instanceof Error && error.message.includes("lecturer_message_broadcasts")
        ? "Message storage is not set up. Run database migrations (npx prisma migrate deploy)."
        : "Failed to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
