import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { formatAttendanceStatus, formatDuration } from "@/lib/live-classroom/attendance";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const logs = await prisma.liveClassAttendanceLog.findMany({
      where: { liveClass: { lecturerId: lecturer.id } },
      orderBy: { joinTime: "desc" },
      take: 500,
      include: {
        liveClass: { select: { title: true } },
      },
    });

    return NextResponse.json({
      records: logs.map((log) => ({
        id: log.id,
        liveClassTitle: log.liveClass.title ?? "Live Class",
        studentIdCode: log.studentIdCode,
        studentName: log.studentName,
        course: `${log.courseCode} – ${log.courseTitle}`,
        joinTime: log.joinTime.toISOString(),
        exitTime: log.exitTime?.toISOString() ?? null,
        durationSeconds: log.durationSeconds,
        durationLabel: formatDuration(log.durationSeconds),
        attendancePercent: log.attendancePercent,
        status: log.status,
        statusLabel: formatAttendanceStatus(log.status),
      })),
    });
  } catch (error) {
    console.error("GET /api/lecturer/live-classes/attendance:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load attendance." }, { status: 500 });
  }
}
