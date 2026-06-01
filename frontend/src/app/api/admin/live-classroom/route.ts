import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { formatAttendanceStatus } from "@/lib/live-classroom/attendance";
import { listAllLiveClasses } from "@/lib/live-classroom/service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const sessions = await listAllLiveClasses();

    const [totalSessions, liveNow, upcoming, logs] = await Promise.all([
      prisma.liveClass.count(),
      prisma.liveClass.count({ where: { status: "LIVE" } }),
      prisma.liveClass.count({
        where: { status: "SCHEDULED", startTime: { gte: new Date() } },
      }),
      prisma.liveClassAttendanceLog.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    ]);

    const presentCount = logs.filter((l) => l.status === "PRESENT").length;
    const partialCount = logs.filter((l) => l.status === "PARTIAL").length;
    const absentCount = logs.filter((l) => l.status === "ABSENT").length;
    const averageAttendance =
      logs.length > 0
        ? Math.round(logs.reduce((sum, l) => sum + l.attendancePercent, 0) / logs.length)
        : 0;

    return NextResponse.json({
      sessions,
      analytics: {
        totalSessions,
        liveNow,
        upcoming,
        averageAttendance,
        presentCount,
        partialCount,
        absentCount,
      },
      attendance: logs.map((log) => ({
        id: log.id,
        studentIdCode: log.studentIdCode,
        studentName: log.studentName,
        course: `${log.courseCode} – ${log.courseTitle}`,
        joinTime: log.joinTime.toISOString(),
        exitTime: log.exitTime?.toISOString() ?? null,
        durationSeconds: log.durationSeconds,
        attendancePercent: log.attendancePercent,
        status: log.status,
        statusLabel: formatAttendanceStatus(log.status),
      })),
    });
  } catch (error) {
    console.error("GET admin live-classroom:", error);
    return NextResponse.json({ error: "Failed to load live classroom data." }, { status: 500 });
  }
}
