import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatAudienceType(type: string): string {
  switch (type) {
    case "individual":
      return "Individual";
    case "department":
      return "Department";
    case "year":
      return "Year";
    case "all":
      return "All students";
    default:
      return type;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const row = await prisma.studentMessageBroadcast.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: {
        id: row.id,
        title: row.title,
        body: row.message,
        audience: `${formatAudienceType(row.audienceType)}: ${row.audienceLabel}`,
        audienceType: row.audienceType,
        recipientCount: row.recipientCount,
        sentAt: row.createdAt.toISOString(),
        status: "Sent",
      },
    });
  } catch (error) {
    console.error("GET /api/students/messages/[id]:", error);
    return NextResponse.json({ error: "Failed to load message." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const row = await prisma.studentMessageBroadcast.update({
      where: { id },
      data: { title, message },
    });

    return NextResponse.json({
      message: "Broadcast updated.",
      broadcast: {
        id: row.id,
        title: row.title,
        audience: `${formatAudienceType(row.audienceType)}: ${row.audienceLabel}`,
        recipientCount: row.recipientCount,
        sentAt: row.createdAt.toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Sent",
      },
    });
  } catch (error) {
    console.error("PATCH /api/students/messages/[id]:", error);
    return NextResponse.json({ error: "Failed to update message." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    await prisma.studentMessageBroadcast.delete({ where: { id } });

    return NextResponse.json({ message: "Message removed from history." });
  } catch (error) {
    console.error("DELETE /api/students/messages/[id]:", error);
    return NextResponse.json({ error: "Failed to delete message." }, { status: 500 });
  }
}
