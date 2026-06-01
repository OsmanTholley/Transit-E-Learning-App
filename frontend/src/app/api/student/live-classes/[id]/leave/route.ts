import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { recordStudentLeave } from "@/lib/live-classroom/service";
import { formatAttendanceStatus } from "@/lib/live-classroom/attendance";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) return unauthorized();

    const { id } = await params;
    const log = await recordStudentLeave({ liveClassId: id, studentId: student.id });
    if (!log) {
      return NextResponse.json({ error: "No attendance session." }, { status: 404 });
    }

    return NextResponse.json({
      exitTime: log.exitTime?.toISOString() ?? null,
      durationSeconds: log.durationSeconds,
      attendancePercent: log.attendancePercent,
      status: log.status,
      statusLabel: formatAttendanceStatus(log.status),
    });
  } catch (error) {
    console.error("POST leave:", error);
    return NextResponse.json({ error: "Failed to record exit." }, { status: 500 });
  }
}
