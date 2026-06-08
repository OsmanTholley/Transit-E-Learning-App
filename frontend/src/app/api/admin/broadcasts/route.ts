import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import {
  listLecturerMessageBroadcasts,
  sendLecturerMessage,
  type LecturerMessageAudienceType,
} from "@/lib/lecturer-message-service";
import {
  listStudentMessageBroadcasts,
  sendStudentMessage,
  type MessageAudienceType,
} from "@/lib/student-message-service";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const [studentRows, lecturerRows, studentMessages, lecturerMessages] = await Promise.all([
      prisma.studentMessageBroadcast.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { sentBy: { select: { fullName: true } } },
      }),
      prisma.lecturerMessageBroadcast.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { sentBy: { select: { fullName: true } } },
      }),
      listStudentMessageBroadcasts(50),
      listLecturerMessageBroadcasts(50),
    ]);

    const announcements = [
      ...studentRows.map((b) => ({
        id: b.id,
        title: b.title,
        message: b.message,
        portal: "Students" as const,
        audience: b.audienceLabel,
        recipients: b.recipientCount,
        sentBy: b.sentBy?.fullName ?? "Admin",
        sentAt: formatDate(b.createdAt),
      })),
      ...lecturerRows.map((b) => ({
        id: b.id,
        title: b.title,
        message: b.message,
        portal: "Lecturers" as const,
        audience: b.audienceLabel,
        recipients: b.recipientCount,
        sentBy: b.sentBy?.fullName ?? "Admin",
        sentAt: formatDate(b.createdAt),
      })),
    ].sort((a, b) => b.sentAt.localeCompare(a.sentAt));

    return NextResponse.json({
      announcements,
      stats: {
        studentBroadcasts: studentMessages.length,
        lecturerBroadcasts: lecturerMessages.length,
        total: announcements.length,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/broadcasts:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load broadcasts." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const portal = body.portal as "students" | "lecturers";
    const title = body.title ?? "";
    const message = body.message ?? "";
    const audienceType = body.audienceType as string;

    if (portal === "lecturers") {
      const valid = ["individual", "department", "all"];
      if (!valid.includes(audienceType)) {
        return NextResponse.json({ error: "Invalid lecturer audience type." }, { status: 400 });
      }

      const result = await sendLecturerMessage({
        title,
        message,
        audienceType: audienceType as LecturerMessageAudienceType,
        targetId: body.targetId ?? null,
        sentByUserId: admin.id,
      });

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      await logActivity({
        actorId: admin.id,
        action: "announcement.sent",
        entityType: "lecturer_broadcast",
        entityId: result.broadcast.id,
        summary: `Announcement sent to lecturers: ${title}`,
      });

      return NextResponse.json({
        message: `Announcement sent to ${result.recipientCount} lecturer${result.recipientCount === 1 ? "" : "s"}.`,
        broadcast: result.broadcast,
      });
    }

    const validStudent = ["individual", "department", "year", "all"];
    if (!validStudent.includes(audienceType)) {
      return NextResponse.json({ error: "Invalid student audience type." }, { status: 400 });
    }

    const result = await sendStudentMessage({
      title,
      message,
      audienceType: audienceType as MessageAudienceType,
      targetId: body.targetId ?? null,
      targetValue: body.targetValue ?? null,
      sentByUserId: admin.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivity({
      actorId: admin.id,
      action: "announcement.sent",
      entityType: "student_broadcast",
      entityId: result.broadcast.id,
      summary: `Announcement sent to students: ${title}`,
    });

    return NextResponse.json({
      message: `Announcement sent to ${result.recipientCount} student${result.recipientCount === 1 ? "" : "s"}.`,
      broadcast: result.broadcast,
    });
  } catch (error) {
    console.error("POST /api/admin/broadcasts:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to send announcement." }, { status: 500 });
  }
}
