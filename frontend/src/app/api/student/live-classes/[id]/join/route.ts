import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { recordStudentJoin } from "@/lib/live-classroom/service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const { id } = await params;
    const log = await recordStudentJoin({ liveClassId: id, studentId: student.id });
    if (!log) {
      return NextResponse.json({ error: "Cannot join this class." }, { status: 403 });
    }

    return NextResponse.json({
      message: "Joined class. Attendance tracking started.",
      joinTime: log.joinTime.toISOString(),
    });
  } catch (error) {
    console.error("POST join live class:", error);
    return NextResponse.json({ error: "Failed to join class." }, { status: 500 });
  }
}
