import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import {
  listStudentMessageBroadcasts,
  MessageAudienceType,
  sendStudentMessage,
} from "@/lib/student-message-service";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const messages = await listStudentMessageBroadcasts();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/students/messages:", error);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const audienceType = body.audienceType as MessageAudienceType;

    if (!["individual", "department", "year", "all"].includes(audienceType)) {
      return NextResponse.json({ error: "Invalid audience type." }, { status: 400 });
    }

    const result = await sendStudentMessage({
      title: body.title ?? "",
      message: body.message ?? "",
      audienceType,
      targetId: body.targetId ?? null,
      targetValue: body.targetValue ?? null,
      sentByUserId: admin.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: `Message sent to ${result.recipientCount} student${result.recipientCount === 1 ? "" : "s"}.`,
      broadcast: result.broadcast,
    });
  } catch (error) {
    console.error("POST /api/students/messages:", error);
    const message =
      error instanceof Error && error.message.includes("student_message_broadcasts")
        ? "Message storage is not set up. Run database migrations (npx prisma migrate deploy)."
        : "Failed to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
