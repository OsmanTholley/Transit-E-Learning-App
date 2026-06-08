import { AttendanceStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

const validStatuses = new Set<string>(Object.values(AttendanceStatus));

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const rows = await prisma.attendance.findMany({
      take: 200,
      orderBy: { markedAt: "desc" },
      include: {
        student: {
          select: {
            studentId: true,
            user: { select: { fullName: true } },
          },
        },
        liveClass: {
          select: {
            course: { select: { courseCode: true } },
            startTime: true,
          },
        },
      },
    });

    const records = rows.map((r) => ({
      id: r.id,
      studentName: r.student?.user.fullName ?? "—",
      studentId: r.student?.studentId ?? "—",
      course: r.liveClass?.course?.courseCode ?? "—",
      date: formatDate(r.markedAt),
      status: r.status,
    }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("GET /api/admin/attendance:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load attendance." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const statusRaw = typeof body.status === "string" ? body.status.trim().toUpperCase() : "PRESENT";

    if (!studentId) {
      return NextResponse.json({ error: "Student is required." }, { status: 400 });
    }
    if (!validStatuses.has(statusRaw)) {
      return NextResponse.json({ error: "Invalid attendance status." }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { OR: [{ id: studentId }, { studentId }] },
      select: { id: true, studentId: true, user: { select: { fullName: true } } },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const record = await prisma.attendance.create({
      data: {
        studentId: student.id,
        status: statusRaw as AttendanceStatus,
        classId: typeof body.classId === "string" && body.classId ? body.classId : null,
      },
      include: {
        student: { select: { studentId: true, user: { select: { fullName: true } } } },
        liveClass: { select: { course: { select: { courseCode: true } } } },
      },
    });

    return NextResponse.json({
      message: "Attendance recorded.",
      record: {
        id: record.id,
        studentName: record.student?.user.fullName ?? "—",
        studentId: record.student?.studentId ?? "—",
        course: record.liveClass?.course?.courseCode ?? "General",
        date: formatDate(record.markedAt),
        status: record.status,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/attendance:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to create attendance." }, { status: 500 });
  }
}
