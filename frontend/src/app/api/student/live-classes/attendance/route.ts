import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { formatAttendanceStatus, formatDuration } from "@/lib/live-classroom/attendance";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) return unauthorized();

    const logs = await prisma.liveClassAttendanceLog.findMany({
      where: { studentId: student.id },
      orderBy: { joinTime: "desc" },
      take: 50,
    });

    return NextResponse.json({
      records: logs.map((log) => ({
        id: log.id,
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
    console.error("GET student attendance:", error);
    return NextResponse.json({ error: "Failed to load attendance." }, { status: 500 });
  }
}
