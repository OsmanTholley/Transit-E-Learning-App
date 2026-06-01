import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const [studentRows, lecturerRows] = await Promise.all([
      prisma.studentMessageBroadcast.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lecturerMessageBroadcast.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const notifications = [
      ...studentRows.map((b) => ({
        id: b.id,
        title: b.title,
        audience: `Students — ${b.audienceLabel}`,
        sentAt: formatDate(b.createdAt),
        status: "Sent" as const,
      })),
      ...lecturerRows.map((b) => ({
        id: b.id,
        title: b.title,
        audience: `Lecturers — ${b.audienceLabel}`,
        sentAt: formatDate(b.createdAt),
        status: "Sent" as const,
      })),
    ].sort((a, b) => b.sentAt.localeCompare(a.sentAt));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET /api/admin/broadcasts:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load broadcasts." }, { status: 500 });
  }
}
